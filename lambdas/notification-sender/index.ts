// ==========================================
// JARVIS — Notification Sender Lambda
// Triggered by EventBridge Scheduler to send push notifications
// ==========================================

import { getUserPushTokens, updateTaskStatus } from '../shared/db';

interface SchedulerEvent {
  userId: string;
  taskId: string;
  type: string;
  title: string;
  description: string;
}

export const handler = async (event: SchedulerEvent) => {
  console.log('Notification event:', JSON.stringify(event));

  const { userId, taskId, type, title, description } = event;

  try {
    // Get user's push tokens
    const tokens = await getUserPushTokens(userId);

    if (tokens.length === 0) {
      console.warn(`No push tokens found for user ${userId}`);
      await updateTaskStatus(userId, taskId, 'failed');
      return;
    }

    // Send Expo push notifications to all user devices
    const messages = tokens.map((tokenRecord) => ({
      to: String(tokenRecord.token),
      sound: type === 'alarm' ? 'default' : undefined,
      title: getNotificationTitle(type, title),
      body: description || title,
      data: {
        taskId,
        type,
        title,
        screen: 'tasks',
      },
      priority: type === 'alarm' ? 'high' : 'default',
      channelId: type === 'alarm' ? 'alarms' : 'reminders',
    }));

    // Send via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Push notification result:', JSON.stringify(result));

    // Check for errors in individual tickets
    if (result.data) {
      const tickets = Array.isArray(result.data) ? result.data : [result.data];
      const errors = tickets.filter((t: { status: string }) => t.status === 'error');
      if (errors.length > 0) {
        console.error('Some notifications failed:', errors);
      }
    }

    // Update task status
    await updateTaskStatus(userId, taskId, 'notified');

    console.log(`Successfully sent ${messages.length} notification(s) for task ${taskId}`);
  } catch (err) {
    console.error(`Error sending notification for task ${taskId}:`, err);
    await updateTaskStatus(userId, taskId, 'failed').catch(() => {});
    throw err;
  }
};

function getNotificationTitle(type: string, title: string): string {
  switch (type) {
    case 'alarm':
      return `⏰ Alarm: ${title}`;
    case 'reminder':
      return `📌 Reminder: ${title}`;
    case 'message':
      return `💬 Message: ${title}`;
    case 'task':
      return `✅ Task: ${title}`;
    default:
      return title;
  }
}
