// ==========================================
// JARVIS — Memo Upload Lambda
// Generates S3 presigned URLs for direct audio upload
// ==========================================

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { APIGatewayEvent, success, error, getUserId } from '../shared/types';
import { createMemo } from '../shared/db';

const s3 = new S3Client({});
const BUCKET = process.env.AUDIO_BUCKET!;

export const handler = async (event: APIGatewayEvent) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return success({});
    }

    const userId = getUserId(event);
    const memoId = randomUUID();
    const key = `audio/${userId}/${memoId}.webm`;

    // Generate presigned URL for upload (valid for 5 minutes)
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: 'audio/webm',
      Metadata: {
        userId,
        memoId,
      },
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Create memo record in pending state
    await createMemo({
      userId,
      memoId,
      audioKey: key,
      status: 'uploading',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return success({
      uploadUrl,
      key,
      memoId,
    });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    if ((err as Error).message?.includes('Unauthorized')) {
      return error(401, (err as Error).message);
    }
    return error(500, 'Failed to generate upload URL');
  }
};
