// ==========================================
// JARVIS — Amazon Bedrock Client Wrapper
// ==========================================

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { ParsedIntent } from './types';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

const SYSTEM_PROMPT = `You are JARVIS, an intelligent voice assistant that parses natural language voice commands into structured, actionable items.

Given a transcript of a user's voice memo, extract ALL actionable items. Each item must be classified into one of these types:

1. **alarm** — Setting a time-based alarm (e.g., "Set an alarm for 7am")
2. **reminder** — A reminder to do something at/by a certain time (e.g., "Remind me to finish the report by 5pm")
3. **message** — Sending a text message to someone (e.g., "Text Mom that I'll be late")
4. **task** — A general to-do item without a specific time trigger (e.g., "Add buy groceries to my list")

For time references:
- Convert relative times (e.g., "in 30 minutes", "tomorrow at 3pm") to absolute ISO 8601 datetime strings based on the current time provided.
- If no specific time is mentioned for a task, omit the scheduledTime field.
- For recurring items (e.g., "every morning at 7am"), set recurring to true and provide a cron expression.

For messages:
- Extract the recipient name exactly as spoken.
- Extract the message body — what should be sent to the recipient.

Return ONLY a valid JSON array of objects. No markdown, no explanation, no wrapping. Each object must have:
{
  "type": "alarm" | "reminder" | "message" | "task",
  "title": "short descriptive title",
  "description": "full details",
  "scheduledTime": "ISO 8601 datetime or null",
  "recipient": "name or null",
  "messageBody": "content to send or null",
  "recurring": false,
  "recurringPattern": "cron expression or null"
}`;

export async function analyzeTranscript(
  transcript: string,
  currentTime: string
): Promise<ParsedIntent[]> {
  const userMessage = `Current date/time: ${currentTime}

Transcript:
"${transcript}"

Parse this transcript and return the JSON array of actionable items.`;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2048,
    temperature: 0.1, // Low temperature for structured output
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  // Extract text content from Claude's response
  const textContent = responseBody.content
    ?.filter((block: { type: string }) => block.type === 'text')
    ?.map((block: { text: string }) => block.text)
    ?.join('') ?? '';

  // Parse the JSON array from Claude's response
  // Handle case where Claude might wrap it in markdown code blocks
  let jsonStr = textContent.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const intents: ParsedIntent[] = JSON.parse(jsonStr);
    
    // Validate and sanitize each intent
    return intents.map((intent) => ({
      type: validateTaskType(intent.type),
      title: String(intent.title || 'Untitled'),
      description: String(intent.description || ''),
      scheduledTime: intent.scheduledTime || undefined,
      recipient: intent.recipient || undefined,
      messageBody: intent.messageBody || undefined,
      recurring: Boolean(intent.recurring),
      recurringPattern: intent.recurringPattern || undefined,
    }));
  } catch (parseError) {
    console.error('Failed to parse Bedrock response:', textContent);
    throw new Error(`Failed to parse AI response: ${parseError}`);
  }
}

function validateTaskType(type: string): ParsedIntent['type'] {
  const validTypes = ['alarm', 'reminder', 'message', 'task'];
  return validTypes.includes(type) ? (type as ParsedIntent['type']) : 'task';
}
