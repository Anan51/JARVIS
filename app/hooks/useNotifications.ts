// ==========================================
// JARVIS — Notifications Hook
// Manages Expo push notifications registration and local alarm scheduling
// ==========================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPushToken } from '../services/api';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  requestPermission: () => Promise<string | null>;
  scheduleLocalAlarm: (title: string, body: string, triggerDate: Date) => Promise<string>;
  scheduleLocalReminder: (title: string, body: string, triggerDate: Date) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          registerPushToken(token, Platform.OS).catch((err) => {
            console.error('Failed to register push token with backend:', err);
          });
        }
      })
      .catch((err) => {
        setError((err as Error).message);
      });

    // Set up notification channels for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('alarms', {
        name: 'Alarms',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });

      Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notif) => {
        setNotification(notif);
      }
    );

    // Listen for notification responses (user tapped notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification response:', data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const scheduleLocalAlarm = useCallback(
    async (title: string, body: string, triggerDate: Date): Promise<string> => {
      if (Platform.OS === 'web') {
        console.warn('Local notifications are not supported on web. Skipping schedule:', title);
        return `web-dummy-${Date.now()}`;
      }

      // On Android, use the system AlarmClock intent to create a real alarm
      // with SKIP_UI to avoid requiring user confirmation
      if (Platform.OS === 'android') {
        try {
          const IntentLauncher = await import('expo-intent-launcher');
          const hour = triggerDate.getHours();
          const minutes = triggerDate.getMinutes();

          await IntentLauncher.startActivityAsync(
            'android.intent.action.SET_ALARM',
            {
              extra: {
                'android.intent.extra.alarm.HOUR': hour,
                'android.intent.extra.alarm.MINUTES': minutes,
                'android.intent.extra.alarm.MESSAGE': title,
                'android.intent.extra.alarm.SKIP_UI': true,
              },
            }
          );

          // Return a synthetic ID since AlarmClock intents don't return one
          return `alarm-${triggerDate.getTime()}`;
        } catch (intentErr) {
          console.warn('AlarmClock intent failed, falling back to notification:', intentErr);
          // Fall through to notification-based alarm below
        }
      }

      // Fallback: iOS always uses this, and Android uses it if the intent fails
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${title}`,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { type: 'alarm' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      return id;
    },
    []
  );

  const scheduleLocalReminder = useCallback(
    async (title: string, body: string, triggerDate: Date): Promise<string> => {
      if (Platform.OS === 'web') {
        console.warn('Local notifications are not supported on web. Skipping schedule:', title);
        return `web-dummy-${Date.now()}`;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📌 ${title}`,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      return id;
    },
    []
  );

  const cancelNotification = useCallback(async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  }, []);

  const requestPermission = useCallback(async (): Promise<string | null> => {
    try {
      const token = await registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        await registerPushToken(token, Platform.OS).catch((err) => {
          console.error('Failed to register push token with backend:', err);
        });
      }
      return token;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, []);

  return {
    expoPushToken,
    notification,
    error,
    requestPermission,
    scheduleLocalAlarm,
    scheduleLocalReminder,
    cancelNotification,
  };
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permissions not granted');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: projectId ?? undefined,
  });

  return tokenData.data;
}
