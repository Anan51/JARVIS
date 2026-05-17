import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { ProcessingOverlay } from '../../components/ProcessingOverlay';
import { useNotifications } from '../../hooks/useNotifications';
import { sendSMS } from '../../services/sms';
import { theme } from '../../constants/theme';
import { ParsedIntent } from '../../types';
import { MemoStatusResponse } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecordScreen() {
  const { scheduleLocalAlarm, scheduleLocalReminder } = useNotifications();
  const [processingIntents, setProcessingIntents] = useState(false);
  const [intents, setIntents] = useState<ParsedIntent[]>([]);
  const [currentIntentIndex, setCurrentIntentIndex] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const insets = useSafeAreaInsets();

  const handleProcessingComplete = useCallback(async (result: MemoStatusResponse) => {
    if (!result.intents || result.intents.length === 0) {
      Alert.alert('No Actions Found', 'No actionable items were detected in your voice memo. Try again with a clearer command.');
      return;
    }

    setIntents(result.intents);
    setProcessingIntents(true);
    setCurrentIntentIndex(0);



    // Process each intent
    for (let i = 0; i < result.intents.length; i++) {
      const intent = result.intents[i];
      setCurrentIntentIndex(i);

      try {
        switch (intent.type) {
          case 'alarm':
            setCurrentAction(`Setting alarm: ${intent.title}`);
            if (intent.scheduledTime) {
              await scheduleLocalAlarm(
                intent.title,
                intent.description || intent.title,
                new Date(intent.scheduledTime)
              );
            }
            break;

          case 'reminder':
            setCurrentAction(`Creating reminder: ${intent.title}`);
            if (intent.scheduledTime) {
              await scheduleLocalReminder(
                intent.title,
                intent.description || intent.title,
                new Date(intent.scheduledTime)
              );
            }
            break;

          case 'message':
            setCurrentAction(`Preparing message to ${intent.recipient}`);
            if (intent.recipient && intent.messageBody) {
              const smsResult = await sendSMS({
                recipientName: intent.recipient,
                messageBody: intent.messageBody,
              });
              if (!smsResult.success) {
                Alert.alert('Message', smsResult.message);
              }
            }
            break;

          case 'task':
            setCurrentAction(`Added task: ${intent.title}`);
            // Task is already stored in DynamoDB by the backend
            break;
        }

        // Brief pause between actions for visual feedback
        await new Promise((r) => setTimeout(r, 800));
      } catch (err) {
        console.error(`Error processing intent ${i}:`, err);
      }
    }

    setCurrentIntentIndex(result.intents.length);
    setCurrentAction('All actions completed!');
    await new Promise((r) => setTimeout(r, 1200));
    setProcessingIntents(false);
  }, [scheduleLocalAlarm, scheduleLocalReminder]);

  return (
    <View style={[s.container, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
      {/* HUD Title */}
      <View style={s.titleContainer}>
        <Text style={s.title}>J A R V I S</Text>
      </View>

      {/* Main recording area */}
      <View style={s.centerWrapper}>
        <VoiceRecorder onProcessingComplete={handleProcessingComplete} />
      </View>

      {/* Scan line decorations at the edges */}
      <View style={s.scanlineTop} />
      <View style={s.scanlineBottom} />

      {/* Processing Overlay */}
      <ProcessingOverlay
        visible={processingIntents}
        intents={intents}
        currentIndex={currentIntentIndex}
        currentAction={currentAction}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  titleContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Courier',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 10,
    color: 'rgba(0, 242, 254, 0.85)',
    textShadowColor: 'rgba(0, 242, 254, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // Decorative scan lines
  scanlineTop: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
  },
  scanlineBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
  },
});
