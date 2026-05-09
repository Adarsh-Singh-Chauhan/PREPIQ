/**
 * useMediaRecorder — Custom hook for recording webcam + audio
 * Uses the MediaRecorder API to capture video/audio streams.
 * Returns .webm format blob on stop.
 */

import { useState, useRef, useCallback } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  blob: Blob | null;
  error: string | null;
}

export function useMediaRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    blob: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async (existingStream?: MediaStream) => {
    try {
      chunksRef.current = [];

      // Use existing stream or request new one
      const stream = existingStream || await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      streamRef.current = stream;

      // Determine best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1500000, // 1.5 Mbps for reasonable quality
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setState(prev => ({ ...prev, isRecording: false, blob }));
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.onerror = (e: any) => {
        console.error('[MediaRecorder] Error:', e);
        setState(prev => ({ ...prev, error: 'Recording failed', isRecording: false }));
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every second

      // Start duration timer
      let duration = 0;
      timerRef.current = setInterval(() => {
        duration++;
        setState(prev => ({ ...prev, duration }));
      }, 1000);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        blob: null,
        error: null,
      });

      console.log('[MediaRecorder] ✅ Recording started');
    } catch (err: any) {
      console.error('[MediaRecorder] Failed to start:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'Could not access camera/microphone',
        isRecording: false,
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('[MediaRecorder] ⏹️ Recording stopped');
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const resetRecording = useCallback(() => {
    chunksRef.current = [];
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      blob: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    stream: streamRef.current,
  };
}
