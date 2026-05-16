// ==========================================
// JARVIS — Voice Recorder Component
// Main recording interface with waveform and status
// ==========================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioRecorder, RecordingState } from '../hooks/useAudioRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';
import { theme } from '../constants/theme';

interface VoiceRecorderProps {
  onProcessingComplete?: (result: any) => void;
}

export function VoiceRecorder({ onProcessingComplete }: VoiceRecorderProps) {
  const {
    state,
    duration,
    processingStatus,
    result,
    error,
    startRecording,
    stopRecording,
    reset,
    confirmTranscript,
    metering,
  } = useAudioRecorder();

  const [editedTranscript, setEditedTranscript] = React.useState('');

  React.useEffect(() => {
    if (state === 'pending_confirmation' && result?.transcript) {
      setEditedTranscript(result.transcript);
    }
  }, [state, result]);

  React.useEffect(() => {
    if (state === 'complete' && result && onProcessingComplete) {
      onProcessingComplete(result);
    }
  }, [state, result, onProcessingComplete]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (): string => {
    switch (state) {
      case 'idle':
        return 'Tap to start recording';
      case 'recording':
        return 'Recording... Tap to stop';
      case 'uploading':
      case 'processing':
        return processingStatus || 'Processing...';
      case 'complete':
        return 'Processing complete!';
      case 'error':
        return error || 'An error occurred';
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (state) {
      case 'recording':
        return theme.colors.danger;
      case 'complete':
        return theme.colors.success;
      case 'error':
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  };

  const isProcessing = state === 'uploading' || state === 'processing';

  return (
    <View style={styles.container}>
      {/* Waveform */}
      <View style={styles.waveformContainer}>
        <WaveformVisualizer
          metering={metering}
          isActive={state === 'recording'}
        />
      </View>

      {/* Duration */}
      {(state === 'recording' || state === 'idle') && (
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      )}

      {/* Status */}
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>

      {/* Record Button */}
      <View style={styles.buttonContainer}>
        {state === 'idle' && (
          <TouchableOpacity
            onPress={startRecording}
            activeOpacity={0.7}
            style={styles.recordButtonOuter}
          >
            <LinearGradient
              colors={[theme.colors.primaryStart, theme.colors.primaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.recordButton}
            >
              <Ionicons name="mic" size={40} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {state === 'recording' && (
          <TouchableOpacity
            onPress={stopRecording}
            activeOpacity={0.7}
            style={styles.recordButtonOuter}
          >
            <View style={[styles.recordButton, styles.stopButton]}>
              <Ionicons name="stop" size={36} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {state === 'pending_confirmation' && (
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationTitle}>Did you mean:</Text>
            <TextInput
              style={styles.transcriptInput}
              value={editedTranscript}
              onChangeText={setEditedTranscript}
              multiline
            />
            <View style={styles.confirmationActions}>
              <TouchableOpacity onPress={reset} style={[styles.confirmBtn, styles.cancelBtn]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmTranscript(editedTranscript)} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Result summary */}
      {state === 'complete' && result?.intents && (
        <View style={styles.resultSummary}>
          <Text style={styles.resultTitle}>
            {result.intents.length} action{result.intents.length !== 1 ? 's' : ''} detected
          </Text>
          {result.intents.map((intent, i) => (
            <View key={i} style={styles.intentPreview}>
              <Ionicons
                name={
                  intent.type === 'alarm'
                    ? 'alarm'
                    : intent.type === 'reminder'
                      ? 'notifications'
                      : intent.type === 'message'
                        ? 'chatbubble'
                        : 'checkmark-circle'
                }
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.intentText} numberOfLines={1}>
                {intent.title}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  waveformContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  duration: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    ...theme.typography.bodySmall,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  recordButtonOuter: {
    ...theme.shadows.glow,
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    backgroundColor: theme.colors.danger,
  },
  processingContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultSummary: {
    marginTop: theme.spacing.xl,
    width: '100%',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultTitle: {
    ...theme.typography.label,
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  intentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  intentText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  confirmationContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  confirmationTitle: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  transcriptInput: {
    backgroundColor: theme.colors.surfaceGlass,
    borderWidth: 1,
    borderColor: theme.colors.borderFocus,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.primary,
    ...theme.typography.body,
    minHeight: 80,
    marginBottom: theme.spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
