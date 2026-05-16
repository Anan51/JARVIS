// ==========================================
// JARVIS — Memo Processor Lambda
// Orchestrates: S3 event → Transcribe → Bedrock → DynamoDB + EventBridge
// ==========================================

import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  TranscriptionJobStatus,
} from '@aws-sdk/client-transcribe';
import {
  SchedulerClient,
  CreateScheduleCommand,
  FlexibleTimeWindowMode,
} from '@aws-sdk/client-scheduler';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { analyzeTranscript } from '../shared/bedrock';
import { createMemo, updateMemo, createTask } from '../shared/db';
import { ParsedIntent } from '../shared/types';

const transcribe = new TranscribeClient({});
const scheduler = new SchedulerClient({});
const s3 = new S3Client({});

const AUDIO_BUCKET = process.env.AUDIO_BUCKET!;
const TRANSCRIBE_OUTPUT_BUCKET = process.env.AUDIO_BUCKET!;
const NOTIFICATION_LAMBDA_ARN = process.env.NOTIFICATION_LAMBDA_ARN!;
const SCHEDULER_ROLE_ARN = process.env.SCHEDULER_ROLE_ARN!;
const SCHEDULER_GROUP = process.env.SCHEDULER_GROUP || 'jarvis-schedules';

// S3 event record type
interface S3EventRecord {
  s3: {
    bucket: { name: string };
    object: { key: string; size: number };
  };
}

interface S3Event {
  Records: S3EventRecord[];
}

interface ApiEvent {
  httpMethod: string;
  pathParameters: { memoId: string };
  body: string;
  requestContext: { authorizer: { claims: { sub: string } } };
}

export const handler = async (event: S3Event | ApiEvent) => {
  if ('httpMethod' in event) {
    return handleApiEvent(event as ApiEvent);
  } else {
    return handleS3Event(event as S3Event);
  }
};

async function processTranscriptAndCreateTasks(userId: string, memoId: string, transcript: string, userTime?: string, timezone?: string) {
  await updateMemo(userId, memoId, { status: 'analyzing', transcript });

  const currentTime = userTime || new Date().toISOString();
  const intents = await analyzeTranscript(transcript, currentTime, timezone);
  console.log(`Parsed intents:`, JSON.stringify(intents));

  const createdTasks = [];
  for (const intent of intents) {
    const taskId = randomUUID();
    const task = {
      userId,
      taskId,
      memoId,
      type: intent.type,
      title: intent.title,
      description: intent.description,
      status: 'pending',
      scheduledTime: intent.scheduledTime,
      recipient: intent.recipient,
      messageBody: intent.messageBody,
      recurring: intent.recurring,
      recurringPattern: intent.recurringPattern,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (intent.scheduledTime && (intent.type === 'alarm' || intent.type === 'reminder')) {
      const schedulerArn = await scheduleNotification(userId, taskId, intent);
      (task as Record<string, unknown>).schedulerArn = schedulerArn;
    }

    await createTask(task);
    createdTasks.push(task);
  }

  await updateMemo(userId, memoId, {
    status: 'complete',
    intents: intents,
  });

  return { intents, tasks: createdTasks };
}

async function handleApiEvent(event: ApiEvent) {
  try {
    const userId = event.requestContext.authorizer.claims.sub;
    const memoId = event.pathParameters.memoId;
    const body = JSON.parse(event.body || '{}');
    const transcript = body.transcript;
    const userTime = body.userTime;
    const timezone = body.timezone;

    if (!transcript) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing transcript' }) };
    }

    const result = await processTranscriptAndCreateTasks(userId, memoId, transcript, userTime, timezone);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Success', ...result }),
    };
  } catch (err) {
    console.error('API Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Internal error' })
    };
  }
}

async function handleS3Event(event: S3Event) {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing audio file: s3://${bucket}/${key}`);

    const keyParts = key.split('/');
    if (keyParts.length < 3) continue;

    const userId = keyParts[1];
    const memoId = keyParts[2].replace('.webm', '');

    try {
      await updateMemo(userId, memoId, { status: 'transcribing' });

      const transcript = await transcribeAudio(bucket, key, memoId);
      console.log(`Transcript: ${transcript}`);

      await updateMemo(userId, memoId, {
        status: 'pending_confirmation',
        transcript,
      });
      console.log(`Memo ${memoId} is pending confirmation.`);
    } catch (err) {
      console.error(`Error processing memo ${memoId}:`, err);
      await updateMemo(userId, memoId, { status: 'failed' }).catch(() => { });
    }
  }
}

async function transcribeAudio(bucket: string, key: string, jobName: string): Promise<string> {
  const transcriptionJobName = `jarvis-${jobName}-${Date.now()}`;
  const mediaUri = `s3://${bucket}/${key}`;
  const outputKey = `transcripts/${jobName}.json`;

  await transcribe.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: transcriptionJobName,
      LanguageCode: 'en-US',
      MediaFormat: 'webm',
      Media: { MediaFileUri: mediaUri },
      OutputBucketName: TRANSCRIBE_OUTPUT_BUCKET,
      OutputKey: outputKey,
    })
  );

  // Poll for completion (with backoff)
  let status: string | undefined;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max with 5s intervals

  while (attempts < maxAttempts) {
    await sleep(5000);
    attempts++;

    const result = await transcribe.send(
      new GetTranscriptionJobCommand({
        TranscriptionJobName: transcriptionJobName,
      })
    );

    status = result.TranscriptionJob?.TranscriptionJobStatus;
    console.log(`Transcription status (attempt ${attempts}): ${status}`);

    if (status === TranscriptionJobStatus.COMPLETED) {
      // Read transcript from S3
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const transcriptResult = await s3.send(
        new GetObjectCommand({
          Bucket: TRANSCRIBE_OUTPUT_BUCKET,
          Key: outputKey,
        })
      );

      const transcriptBody = await transcriptResult.Body?.transformToString();
      if (!transcriptBody) throw new Error('Empty transcript body');

      const transcriptData = JSON.parse(transcriptBody);
      return transcriptData.results?.transcripts?.[0]?.transcript ?? '';
    }

    if (status === TranscriptionJobStatus.FAILED) {
      throw new Error(`Transcription failed for job ${transcriptionJobName}`);
    }
  }

  throw new Error(`Transcription timed out after ${maxAttempts * 5}s`);
}

async function scheduleNotification(
  userId: string,
  taskId: string,
  intent: ParsedIntent
): Promise<string> {
  const scheduleName = `jarvis-${taskId}`;
  const scheduleTime = new Date(intent.scheduledTime!);

  // Don't schedule if the time has already passed
  if (scheduleTime <= new Date()) {
    console.warn(`Scheduled time ${intent.scheduledTime} is in the past, skipping schedule`);
    return '';
  }

  const input = {
    Name: scheduleName,
    GroupName: SCHEDULER_GROUP,
    ScheduleExpression: intent.recurring && intent.recurringPattern
      ? `cron(${intent.recurringPattern})`
      : `at(${scheduleTime.toISOString().replace(/\.\d{3}Z$/, '')})`,
    ScheduleExpressionTimezone: 'UTC',
    FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
    Target: {
      Arn: NOTIFICATION_LAMBDA_ARN,
      RoleArn: SCHEDULER_ROLE_ARN,
      Input: JSON.stringify({
        userId,
        taskId,
        type: intent.type,
        title: intent.title,
        description: intent.description,
      }),
    },
    // Auto-delete one-time schedules after execution
    ...(!intent.recurring ? {
      ActionAfterCompletion: 'DELETE' as const,
    } : {}),
  };

  await scheduler.send(new CreateScheduleCommand(input));
  return scheduleName;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
