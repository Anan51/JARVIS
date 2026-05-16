// ==========================================
// JARVIS — Shared TypeScript Types
// ==========================================

export interface Task {
  userId: string;
  taskId: string;
  memoId: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  scheduledTime?: string; // ISO 8601
  recipient?: string;
  recipientPhone?: string;
  messageBody?: string;
  recurring: boolean;
  recurringPattern?: string; // cron expression
  schedulerArn?: string; // EventBridge Scheduler ARN
  createdAt: string;
  updatedAt: string;
}

export type TaskType = 'alarm' | 'reminder' | 'message' | 'task';
export type TaskStatus = 'pending' | 'active' | 'notified' | 'sent' | 'completed' | 'failed';

export interface Memo {
  userId: string;
  memoId: string;
  audioKey: string;
  status: MemoStatus;
  transcript?: string;
  intents?: ParsedIntent[];
  createdAt: string;
  updatedAt: string;
}

export type MemoStatus = 'uploading' | 'transcribing' | 'analyzing' | 'complete' | 'failed';

export interface ParsedIntent {
  type: TaskType;
  title: string;
  description: string;
  scheduledTime?: string;
  recipient?: string;
  messageBody?: string;
  recurring: boolean;
  recurringPattern?: string;
}

export interface PushToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  createdAt: string;
}

export interface Contact {
  userId: string;
  contactName: string;
  phoneNumber: string;
}

// API Gateway Lambda event helpers
export interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  pathParameters?: Record<string, string> | null;
  queryStringParameters?: Record<string, string> | null;
  body: string | null;
  headers: Record<string, string>;
  requestContext: {
    authorizer?: {
      claims?: {
        sub: string;
        email: string;
        [key: string]: string;
      };
    };
  };
}

export interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

export function success(body: unknown): APIGatewayResponse {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

export function error(statusCode: number, message: string): APIGatewayResponse {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ error: message }),
  };
}

export function getUserId(event: APIGatewayEvent): string {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    throw new Error('Unauthorized: No user ID found in request context');
  }
  return userId;
}
