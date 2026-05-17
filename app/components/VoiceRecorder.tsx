// ==========================================
// JARVIS — Voice Recorder Component
// Sci-fi HUD recording interface
// ==========================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';
import { HudOverlay } from './HudOverlay';
import { theme } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const glowAnim = React.useRef(new Animated.Value(0)).current;

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

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isProcessing = state === 'uploading' || state === 'processing';
  const isRecording = state === 'recording';

  const glowShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 35],
  });
  const glowShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <View style={styles.container}>
      {/* HUD rings overlay */}
      <HudOverlay isRecording={isRecording} />

      {/* Central content — mic + circular waveform + timer */}
      <View style={styles.centerContent}>
        {/* Circular waveform around the mic */}
        <WaveformVisualizer metering={metering} isActive={isRecording} />

        {/* Mic button */}
        {(state === 'idle' || state === 'recording') && (
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.7}
            style={styles.micTouchArea}
          >
            <Animated.View
              style={[
                styles.micIconContainer,
                isRecording && styles.micIconRecording,
                { shadowRadius: glowShadowRadius, shadowOpacity: glowShadowOpacity },
              ]}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={36}
                color={isRecording ? '#ff4444' : theme.colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Timer between inner and outer circle */}
        {(state === 'idle' || state === 'recording') && (
          <Text style={[styles.timerInner, isRecording && styles.timerInnerRecording]}>
            {formatDuration(duration)}
          </Text>
        )}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>



      {/* TAP TO SPEAK */}
      {state === 'idle' && (
        <Text style={styles.tapLabel}>TAP TO SPEAK</Text>
      )}
      {state === 'recording' && (
        <Text style={[styles.tapLabel, styles.tapLabelRecording]}>TAP TO STOP</Text>
      )}

      {/* Processing status */}
      {isProcessing && (
        <Text style={styles.processingStatusText}>
          {processingStatus || 'Processing...'}
        </Text>
      )}

      {/* Confirmation UI */}
      {/* Replace the existing pending_confirmation block entirely */}
      {state === 'pending_confirmation' && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* HUD corner brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              <Text style={styles.modalLabel}>TRANSCRIPT RECEIVED:</Text>

              <TextInput
                style={styles.modalInput}
                value={editedTranscript}
                onChangeText={setEditedTranscript}
                multiline
                scrollEnabled
              />

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={reset} style={[styles.modalBtn, styles.modalBtnCancel]} activeOpacity={0.7}>
                  <Text style={styles.modalBtnTextCancel}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmTranscript(editedTranscript, {
                    userTime: new Date().toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                  })}
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalBtnTextConfirm}>CONFIRM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Result summary */}
      {state === 'complete' && result?.intents && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              <Text style={styles.modalLabel}>ACTIONS DETECTED:</Text>

              {result.intents.map((intent, i) => (
                <View key={i} style={styles.intentRow}>
                  <Ionicons
                    name={
                      intent.type === 'alarm' ? 'alarm' :
                        intent.type === 'reminder' ? 'notifications' :
                          intent.type === 'message' ? 'chatbubble' :
                            'checkmark-circle'
                    }
                    size={16}
                    color="#00f2fe"
                  />
                  <Text style={styles.intentRowText} numberOfLines={1}>
                    {intent.title}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                onPress={reset}
                style={[styles.modalBtn, styles.modalBtnConfirm, { marginTop: 20, flex: 0, paddingVertical: 14 }]}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnTextConfirm}>RECORD ANOTHER MEMO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Error */}
      {state === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'An error occurred'}</Text>
          <TouchableOpacity onPress={reset} style={styles.modalBtnConfirm}>
            <Text style={styles.modalBtnTextConfirm}>RETRY</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  intentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  intentRowText: {
    color: '#00f2fe',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#0a1a2e',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    padding: 24,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: '#00f2fe',
    borderStyle: 'solid',
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  modalLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(0, 242, 254, 0.6)',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalInput: {
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    borderRadius: 4,
    padding: 12,
    color: '#00f2fe',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    minHeight: 80,
    maxHeight: 160,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.danger,
  },
  modalBtnConfirm: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderColor: 'rgba(0, 242, 254, 0.5)',
    borderWidth: 1,
    borderRadius: 4,
  },
  modalBtnTextCancel: {
    color: theme.colors.danger,
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalBtnTextConfirm: {
    color: '#00f2fe',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 260,
    zIndex: 10,
    position: 'relative',
  },
  micTouchArea: { alignItems: 'center', justifyContent: 'center' },
  micIconContainer: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column',
    backgroundColor: 'rgba(0, 20, 30, 0.6)',
    borderWidth: 2, borderColor: 'rgba(0, 242, 254, 0.4)',
    shadowColor: '#00f2fe', shadowOffset: { width: 0, height: 0 },
  },
  micIconRecording: {
    borderColor: 'rgba(255, 68, 68, 0.6)',
    backgroundColor: 'rgba(40, 0, 0, 0.4)',
    shadowColor: '#ff4444',
  },
  duration: {
    fontFamily: 'Courier', fontSize: 36, fontWeight: '700',
    color: 'rgba(0, 242, 254, 0.9)', letterSpacing: 6,
    marginTop: 16, fontVariant: ['tabular-nums'],
    zIndex: 10,
  },
  durationRecording: { color: '#ff4444' },

  tapLabel: {
    fontFamily: 'Courier', fontSize: 13, letterSpacing: 4,
    color: 'rgba(0, 242, 254, 0.45)', marginTop: 32, zIndex: 10,
  },
  tapLabelRecording: { color: 'rgba(255, 68, 68, 0.6)' },

  processingContainer: {
    width: 80, height: 80, alignItems: 'center', justifyContent: 'center',
  },
  processingStatusText: {
    fontFamily: 'Courier', fontSize: 12, letterSpacing: 2,
    color: 'rgba(0, 242, 254, 0.6)', marginTop: 20, textAlign: 'center',
  },
  transcriptInput: {
    backgroundColor: 'rgba(0, 20, 30, 0.6)', borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)', borderRadius: 4,
    padding: theme.spacing.md, color: theme.colors.primary,
    fontFamily: 'Courier', fontSize: 14, minHeight: 80,
    marginBottom: theme.spacing.md,
  },
  intentText: {
    fontFamily: 'Courier', fontSize: 13,
    color: 'rgba(0, 242, 254, 0.8)', flex: 1,
  },

  errorContainer: {
    marginTop: 24, width: '100%', paddingHorizontal: 24,
    alignItems: 'center', gap: 16, zIndex: 20,
  },
  errorText: {
    fontFamily: 'Courier', fontSize: 12, letterSpacing: 1,
    color: '#ff4444', textAlign: 'center',
  },
  timerInner: {
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(0, 242, 254, 0.9)',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'] as any,
    position: 'absolute',
    bottom: 20,
  },
  timerInnerRecording: {
    color: '#ff4444',
  },
});
