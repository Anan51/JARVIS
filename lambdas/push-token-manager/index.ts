// ==========================================
// JARVIS — Push Token Manager Lambda
// Manages Expo push notification device tokens
// ==========================================

import {
  APIGatewayEvent,
  success,
  error,
  getUserId,
} from '../shared/types';
import { savePushToken, deletePushToken, getUserPushTokens } from '../shared/db';

export const handler = async (event: APIGatewayEvent) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return success({});
    }

    const userId = getUserId(event);
    const method = event.httpMethod;

    // POST /push-token — register a device token
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { token, platform } = body;

      if (!token) {
        return error(400, 'Missing push token');
      }

      await savePushToken({
        userId,
        token,
        platform: platform || 'unknown',
        createdAt: new Date().toISOString(),
      });

      return success({ message: 'Push token registered' });
    }

    // GET /push-token — list device tokens
    if (method === 'GET') {
      const tokens = await getUserPushTokens(userId);
      return success({ tokens });
    }

    // DELETE /push-token — unregister a device token
    if (method === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const { token } = body;

      if (!token) {
        return error(400, 'Missing push token');
      }

      await deletePushToken(userId, token);
      return success({ message: 'Push token removed' });
    }

    return error(405, `Method not allowed: ${method}`);
  } catch (err) {
    console.error('Push token manager error:', err);
    if ((err as Error).message?.includes('Unauthorized')) {
      return error(401, (err as Error).message);
    }
    return error(500, 'Internal server error');
  }
};
