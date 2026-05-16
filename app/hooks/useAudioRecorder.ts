// ==========================================
// JARVIS — Audio Recorder Hook
// Uses expo-av for high-quality audio recording
// ==========================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import {
  getPresignedUploadUrl,
  uploadAudioToS3,
  pollMemoStatus,
  analyzeMemo,
  MemoStatusResponse,
} from '../services/api';

export type RecordingState = 'idle' | 'recording' | 'uploading' | 'processing' | 'pending_confirmation' | 'complete' | 'error';

interface AudioRecorderReturn {
  state: RecordingState;
  duration: number;
  processingStatus: string;
  result: MemoStatusResponse | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  reset: () => void;
  confirmTranscript: (transcript: string, options?: { userTime: string; timezone: string }) => Promise<void>;
  metering: number; // Audio level for waveform visualization (-160 to 0)
}

export function useAudioRecorder(): AudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [result, setResult] = useState<MemoStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metering, setMetering] = useState(-160);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState('recording');
      setError(null);
      setResult(null);
      setDuration(0);
      setProcessingStatus('');

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording with high quality preset
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      // Set up status updates for metering
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          setMetering(status.metering);
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;

      // Start duration counter
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    } catch (err) {
      console.error('Error starting recording:', err);
      setState('error');
      setError((err as Error).message);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) {
        throw new Error('No active recording');
      }

      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setState('uploading');
      setProcessingStatus('Stopping recording...');

      // Stop and get the recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setProcessingStatus('Getting upload URL...');

      // Get presigned URL
      const { uploadUrl, memoId } = await getPresignedUploadUrl();

      setProcessingStatus('Uploading audio...');

      // Read the file and upload
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadAudioToS3(uploadUrl, blob);

      setState('processing');
      setProcessingStatus('Transcribing audio...');

      // Poll for processing status
      const finalStatus = await pollMemoStatus(memoId, (status) => {
        switch (status.status) {
          case 'transcribing':
            setProcessingStatus('Transcribing audio...');
            break;
          case 'analyzing':
            setProcessingStatus('Analyzing with AI...');
            break;
          case 'pending_confirmation':
            setProcessingStatus('Please confirm transcript...');
            break;
          case 'complete':
            setProcessingStatus('Complete!');
            break;
          case 'failed':
            setProcessingStatus('Processing failed');
            break;
          default:
            setProcessingStatus(`Processing: ${status.status}`);
        }
      });

      if (finalStatus.status === 'failed') {
        throw new Error('Memo processing failed on the server');
      }

      setResult(finalStatus);
      if (finalStatus.status === 'pending_confirmation') {
        setState('pending_confirmation');
      } else {
        setState('complete');
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      setState('error');
      setError((err as Error).message);
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setDuration(0);
    setProcessingStatus('');
    setResult(null);
    setError(null);
    setMetering(-160);
  }, []);

  const confirmTranscript = useCallback(async (transcript: string, options?: { userTime: string; timezone: string }) => {
    if (!result?.memoId) return;
    try {
      setState('processing');
      setProcessingStatus('Analyzing with AI...');
      const finalStatus = await analyzeMemo(result.memoId, transcript, options?.userTime, options?.timezone);
      setResult(finalStatus);
      setState('complete');
    } catch (err) {
      console.error('Error analyzing memo:', err);
      setState('error');
      setError((err as Error).message);
    }
  }, [result]);

  return {
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
  };
}
