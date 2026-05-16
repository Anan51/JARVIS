// ==========================================
// JARVIS — API Client Service
// ==========================================

import { config } from '../constants/config';
import { getAuthToken } from './auth';
import { Task, ParsedIntent } from '../types';

const BASE_URL = config.apiUrl;

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API Error ${response.status}: ${body}`);
  }

  return response;
}

// ---- Memo Operations ----

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  memoId: string;
}

export async function getPresignedUploadUrl(): Promise<PresignedUploadResponse> {
  const response = await authFetch('/memo', { method: 'POST' });
  return response.json();
}

export async function uploadAudioToS3(uploadUrl: string, audioBlob: Blob): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'audio/webm',
    },
    body: audioBlob,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status}`);
  }
}

export interface MemoStatusResponse {
  memoId: string;
  status: string;
  transcript?: string;
  intents?: ParsedIntent[];
}

export async function getMemoStatus(memoId: string): Promise<MemoStatusResponse> {
  const response = await authFetch(`/memo/${memoId}/status`);
  return response.json();
}

export async function analyzeMemo(memoId: string, transcript: string, userTime?: string, timezone?: string): Promise<MemoStatusResponse> {
  const response = await authFetch(`/memo/${memoId}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ transcript, userTime, timezone }),
  });
  return response.json();
}

export async function pollMemoStatus(
  memoId: string,
  onStatusUpdate?: (status: MemoStatusResponse) => void
): Promise<MemoStatusResponse> {
  const maxAttempts = config.memoStatusMaxPollAttempts;
  const interval = config.memoStatusPollIntervalMs;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval));

    const status = await getMemoStatus(memoId);
    onStatusUpdate?.(status);

    if (status.status === 'complete' || status.status === 'failed' || status.status === 'pending_confirmation') {
      return status;
    }
  }

  throw new Error('Memo processing timed out');
}

// ---- Task Operations ----

export async function fetchTasks(): Promise<Task[]> {
  const response = await authFetch('/tasks');
  const data = await response.json();
  return data.tasks;
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const response = await authFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
  const data = await response.json();
  return data.task;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  await authFetch(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await authFetch(`/tasks/${taskId}`, { method: 'DELETE' });
}

// ---- Push Token Operations ----

export async function registerPushToken(token: string, platform: string): Promise<void> {
  await authFetch('/push-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });
}

export async function unregisterPushToken(token: string): Promise<void> {
  await authFetch('/push-token', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}
