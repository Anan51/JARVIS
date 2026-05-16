// ==========================================
// JARVIS — Shared TypeScript Types (Frontend)
// ==========================================

export type TaskType = 'alarm' | 'reminder' | 'message' | 'task';
export type TaskStatus = 'pending' | 'active' | 'notified' | 'sent' | 'completed' | 'failed';
export type MemoStatusType = 'uploading' | 'transcribing' | 'analyzing' | 'complete' | 'failed';

export interface Task {
  userId: string;
  taskId: string;
  memoId: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  scheduledTime?: string;
  recipient?: string;
  recipientPhone?: string;
  messageBody?: string;
  recurring: boolean;
  recurringPattern?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface MemoStatusResponse {
  memoId: string;
  status: MemoStatusType;
  transcript?: string;
  intents?: ParsedIntent[];
}

export interface Contact {
  id: string;
  name: string;
  phoneNumbers?: Array<{
    number: string;
    label: string;
  }>;
}
