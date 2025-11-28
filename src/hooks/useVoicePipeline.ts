import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useVoice } from '../context/VoiceContext';
import { useScreenContext } from '../context/ScreenContext';
import { RECORDING_OPTIONS } from '../config/api';
import {
  transcribeAudio,
  getLLMResponse,
  synthesizeSpeech,
  playAudio,
  cleanupAudioFiles,
} from '../services/voiceService';

export const useVoicePipeline = () => {
  const {
    status,
    setStatus,
    setIsRecording,
    setTranscript,
    setResponse,
    setError,
    reset,
  } = useVoice();

  const { currentScreen, screenData, formState } = useScreenContext();
  const recordingRef = useRef<Audio.Recording | null>(null);

  /**
   * Start audio recording
   */
  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission not granted');
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await recording.startAsync();

      recordingRef.current = recording;
      setStatus('listening');
      setIsRecording(true);
      setError(null);
    } catch (error: any) {
      console.error('[VoicePipeline] Start recording error:', error.message);
      setError(`Failed to start recording: ${error.message}`);
      setStatus('error');
    }
  }, [setStatus, setIsRecording, setError]);

  /**
   * Stop recording and process the voice pipeline
   */
  const stopRecordingAndProcess = useCallback(async () => {
    try {
      if (!recordingRef.current) {
        throw new Error('No active recording');
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const audioUri = recordingRef.current.getURI();
      recordingRef.current = null;

      setIsRecording(false);

      if (!audioUri) {
        throw new Error('No audio recorded');
      }

      setStatus('processing');

      // Step 1: Transcribe audio with Deepgram
      const transcript = await transcribeAudio(audioUri);
      setTranscript(transcript);

      // Step 2: Get LLM response from Anthropic with screen context
      const contextData = {
        currentScreen,
        screenData,
        formState,
      };
      const llmResponse = await getLLMResponse(transcript, contextData);
      setResponse(llmResponse);

      // Step 3: Synthesize speech with ElevenLabs
      const audioResponseUri = await synthesizeSpeech(llmResponse);

      // Step 4: Play audio response
      setStatus('speaking');
      await playAudio(audioResponseUri);

      // Done
      setStatus('idle');

      // Cleanup old audio files
      cleanupAudioFiles().catch(console.error);

    } catch (error: any) {
      console.error('[VoicePipeline] Processing error:', error.message);
      setError(error.message);
      setStatus('error');
      setIsRecording(false);
    }
  }, [currentScreen, screenData, formState, setStatus, setIsRecording, setTranscript, setResponse, setError]);

  /**
   * Cancel recording without processing
   */
  const cancelRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      reset();
    } catch (error: any) {
      console.error('[VoicePipeline] Cancel error:', error.message);
    }
  }, [reset]);

  /**
   * Handle mic button press based on current status
   */
  const handleMicPress = useCallback(async () => {
    switch (status) {
      case 'idle':
        await startRecording();
        break;

      case 'listening':
        await stopRecordingAndProcess();
        break;

      case 'processing':
      case 'speaking':
        // Cannot interrupt during processing or speaking
        break;

      case 'error':
        reset();
        break;
    }
  }, [status, startRecording, stopRecordingAndProcess, reset]);

  return {
    handleMicPress,
    cancelRecording,
    status,
  };
};
