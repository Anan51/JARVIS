// ==========================================
// JARVIS — Task Manager Lambda
// CRUD operations for tasks
// ==========================================

import {
  SchedulerClient,
  DeleteScheduleCommand,
} from '@aws-sdk/client-scheduler';
import {
  APIGatewayEvent,
  success,
  error,
  getUserId,
} from '../shared/types';
import {
  getUserTasks,
  getTask,
  createTask,
  deleteTask,
  updateTaskStatus,
  getMemo,
} from '../shared/db';
import { randomUUID } from 'crypto';

const scheduler = new SchedulerClient({});
const SCHEDULER_GROUP = process.env.SCHEDULER_GROUP || 'jarvis-schedules';

export const handler = async (event: APIGatewayEvent) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return success({});
    }

    const userId = getUserId(event);
    const path = event.path;
    const method = event.httpMethod;

    // GET /tasks — list all tasks
    if (method === 'GET' && path === '/tasks') {
      const tasks = await getUserTasks(userId);
      return success({ tasks });
    }

    // GET /memo/:memoId/status — get memo processing status
    if (method === 'GET' && path.match(/\/memo\/[^/]+\/status/)) {
      const memoId = event.pathParameters?.memoId;
      if (!memoId) return error(400, 'Missing memoId');

      const memo = await getMemo(userId, memoId);
      if (!memo) return error(404, 'Memo not found');

      return success({
        memoId,
        status: memo.status,
        transcript: memo.transcript,
        intents: memo.intents,
      });
    }

    // POST /tasks — create task manually
    if (method === 'POST' && path === '/tasks') {
      const body = JSON.parse(event.body || '{}');
      const taskId = randomUUID();
      const now = new Date().toISOString();

      const task = {
        userId,
        taskId,
        memoId: body.memoId || 'manual',
        type: body.type || 'task',
        title: body.title,
        description: body.description || '',
        status: 'pending',
        scheduledTime: body.scheduledTime,
        recipient: body.recipient,
        messageBody: body.messageBody,
        recurring: body.recurring || false,
        recurringPattern: body.recurringPattern,
        createdAt: now,
        updatedAt: now,
      };

      await createTask(task);
      return success({ task });
    }

    // PUT /tasks/:taskId — update task
    if (method === 'PUT' && event.pathParameters?.taskId) {
      const taskId = event.pathParameters.taskId;
      const body = JSON.parse(event.body || '{}');

      const existing = await getTask(userId, taskId);
      if (!existing) return error(404, 'Task not found');

      if (body.status) {
        await updateTaskStatus(userId, taskId, body.status);
      }

      return success({ message: 'Task updated' });
    }

    // DELETE /tasks/:taskId — delete task
    if (method === 'DELETE' && event.pathParameters?.taskId) {
      const taskId = event.pathParameters.taskId;

      const existing = await getTask(userId, taskId);
      if (!existing) return error(404, 'Task not found');

      // Cancel associated EventBridge schedule if exists
      if (existing.schedulerArn) {
        try {
          await scheduler.send(
            new DeleteScheduleCommand({
              Name: String(existing.schedulerArn),
              GroupName: SCHEDULER_GROUP,
            })
          );
        } catch (schedErr) {
          console.warn('Failed to delete schedule (may already be deleted):', schedErr);
        }
      }

      await deleteTask(userId, taskId);
      return success({ message: 'Task deleted' });
    }

    return error(404, `Route not found: ${method} ${path}`);
  } catch (err) {
    console.error('Task manager error:', err);
    if ((err as Error).message?.includes('Unauthorized')) {
      return error(401, (err as Error).message);
    }
    return error(500, 'Internal server error');
  }
};
