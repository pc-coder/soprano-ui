import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useVoice } from '../context/VoiceContext';
import { useScreenContext } from '../context/ScreenContext';
import { useGuidedForm } from '../context/GuidedFormContext';
import { useFormController } from './useFormController';
import { RECORDING_OPTIONS } from '../config/api';
import {
  transcribeAudio,
  getLLMResponse,
  synthesizeSpeech,
  playAudio,
  cleanupAudioFiles,
  GuidedContextData,
} from '../services/voiceService';
import { processFieldResponse, validateFieldValue, generateErrorPrompt } from '../utils/conversationFlow';

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

  const { currentScreen, screenData, formState, formRefs, formHandlers } = useScreenContext();
  const guidedForm = useGuidedForm();
  const { fillField } = useFormController();
  const recordingRef = useRef<Audio.Recording | null>(null);

  /**
   * Start audio recording
   */
  const startRecording = useCallback(async () => {
    console.log('[VoicePipeline] ===== START RECORDING CALLED =====');
    try {
      console.log('[VoicePipeline] Requesting microphone permissions...');
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      console.log('[VoicePipeline] Permission result:', permission.granted);

      if (!permission.granted) {
        throw new Error('Microphone permission not granted');
      }

      console.log('[VoicePipeline] Setting audio mode...');
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[VoicePipeline] Creating recording instance...');
      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
      console.log('[VoicePipeline] Starting recording...');
      await recording.startAsync();

      recordingRef.current = recording;
      setStatus('listening');
      setIsRecording(true);
      setError(null);
      console.log('[VoicePipeline] Recording started successfully, status set to listening');
    } catch (error: any) {
      console.error('[VoicePipeline] Start recording error:', error.message);
      console.error('[VoicePipeline] Error stack:', error.stack);
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

      // Prepare context data
      const contextData = {
        currentScreen,
        screenData,
        formState,
      };

      // Check if we're in guided mode
      const guidedContextData: GuidedContextData | undefined = guidedForm.isGuidedMode
        ? {
            isGuidedMode: true,
            currentField: guidedForm.getCurrentField() || undefined,
            completedFields: guidedForm.completedFields,
            conversationHistory: guidedForm.conversationHistory,
            progress: guidedForm.getProgress(),
          }
        : undefined;

      // Step 2: Get LLM response from Anthropic with screen context and guided context
      const llmResponse = await getLLMResponse(transcript, contextData, guidedContextData);
      setResponse(llmResponse);

      // Step 3: Handle guided mode vs free conversation mode
      if (guidedForm.isGuidedMode && guidedContextData?.currentField) {
        await handleGuidedModeResponse(llmResponse, transcript);
      } else {
        // Free conversation mode: just speak the response
        await speakResponse(llmResponse);
      }

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
  }, [currentScreen, screenData, formState, guidedForm, setStatus, setIsRecording, setTranscript, setResponse, setError]);

  /**
   * Handle response in guided mode
   */
  const handleGuidedModeResponse = useCallback(async (llmResponse: string, userTranscript: string) => {
    const currentField = guidedForm.getCurrentField();
    if (!currentField) return;

    // Parse the LLM response to extract action and value
    const parsed = processFieldResponse(llmResponse, currentField);

    console.log('[VoicePipeline] Guided mode action:', parsed.action, 'Value:', parsed.value);

    // Handle different actions
    switch (parsed.action) {
      case 'fill_field': {
        // Validate the value
        const validation = validateFieldValue(parsed.value, currentField, formState);

        if (!validation.valid && validation.error) {
          // Validation failed - ask again with error message
          const errorPrompt = generateErrorPrompt(currentField, validation.error);
          await speakResponse(errorPrompt);
          return;
        }

        // Fill the form field programmatically
        const fieldRef = formRefs[currentField.refName];
        const fieldHandler = formHandlers[`set${currentField.name.charAt(0).toUpperCase()}${currentField.name.slice(1)}`];

        if (fieldRef && fieldHandler) {
          const fieldOnBlur = formHandlers[`handle${currentField.name.charAt(0).toUpperCase()}${currentField.name.slice(1)}Blur`];
          fillField(fieldRef, String(parsed.value), fieldHandler, fieldOnBlur);
        }

        // Update guided form state
        guidedForm.updateFieldValue(currentField.name, userTranscript, parsed.value);

        // Speak confirmation
        await speakResponse(parsed.message);

        // Move to next field
        if (!guidedForm.isLastField()) {
          guidedForm.moveToNextField();

          // Small delay then ask for next field
          await new Promise(resolve => setTimeout(resolve, 100));
          const nextField = guidedForm.getCurrentField();
          if (nextField) {
            await speakResponse(nextField.prompt);
            await startRecording();
          }
        } else {
          // All fields completed
          guidedForm.stopGuidedMode();
        }
        break;
      }

      case 'skip': {
        if (!currentField.required) {
          guidedForm.skipCurrentField();
          await speakResponse(parsed.message);

          // Small delay then ask for next field after skipping
          await new Promise(resolve => setTimeout(resolve, 100));
          const nextField = guidedForm.getCurrentField();
          if (nextField) {
            await speakResponse(nextField.prompt);
            await startRecording();
          }
        } else {
          await speakResponse("I'm sorry, but this field is required. " + currentField.prompt);
          await startRecording();
        }
        break;
      }

      case 'go_back': {
        guidedForm.moveToPreviousField();
        await speakResponse(parsed.message);

        // Small delay then ask for the previous field
        await new Promise(resolve => setTimeout(resolve, 100));
        const prevField = guidedForm.getCurrentField();
        if (prevField) {
          await speakResponse(prevField.prompt);
          await startRecording();
        }
        break;
      }

      case 'cancel': {
        guidedForm.stopGuidedMode();
        await speakResponse(parsed.message);
        break;
      }

      case 'clarify': {
        // Ask again with clarification message
        await speakResponse(parsed.message);
        await startRecording();
        break;
      }
    }
  }, [guidedForm, formState, formRefs, formHandlers, fillField, speakResponse, startRecording]);

  /**
   * Synthesize and play response
   */
  const speakResponse = useCallback(async (text: string) => {
    console.log('[VoicePipeline] speakResponse called with text:', text.substring(0, 50) + '...');
    console.log('[VoicePipeline] Calling synthesizeSpeech...');
    const audioResponseUri = await synthesizeSpeech(text);
    console.log('[VoicePipeline] Speech synthesized, URI:', audioResponseUri);
    console.log('[VoicePipeline] Setting status to speaking...');
    setStatus('speaking');
    console.log('[VoicePipeline] Playing audio...');
    await playAudio(audioResponseUri);
    console.log('[VoicePipeline] Audio playback complete');
  }, [setStatus]);

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

  /**
   * Start guided mode conversation - AI speaks first then listens
   * @param firstField - The first field definition to ask about
   * @param totalFields - Total number of fields in the form
   */
  const startGuidedConversation = useCallback(async (firstField: any, totalFields: number) => {
    console.log('[VoicePipeline] ===== START GUIDED CONVERSATION =====');
    console.log('[VoicePipeline] First field passed:', firstField ? `${firstField.name} - ${firstField.label}` : 'NULL');
    console.log('[VoicePipeline] Total fields:', totalFields);

    try {
      if (!firstField) {
        console.error('[VoicePipeline] No first field provided - ABORTING');
        return;
      }

      // Give a summary and introduction
      const summary = `I'll help you fill out this form. We have ${totalFields} fields to complete. Let's start.`;
      console.log('[VoicePipeline] Summary message:', summary);

      console.log('[VoicePipeline] Calling speakResponse for summary...');
      // Speak the summary
      await speakResponse(summary);
      console.log('[VoicePipeline] Summary spoken successfully');

      // Small pause between summary and question
      console.log('[VoicePipeline] Waiting 300ms pause...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Ask for the first field
      console.log('[VoicePipeline] Speaking first field prompt:', firstField.prompt);
      await speakResponse(firstField.prompt);
      console.log('[VoicePipeline] First field prompt spoken successfully');

      // After speaking, automatically start listening
      console.log('[VoicePipeline] Auto-starting recording after prompt');
      await startRecording();
      console.log('[VoicePipeline] Recording started successfully');

      console.log('[VoicePipeline] ===== GUIDED CONVERSATION STARTED SUCCESSFULLY =====');

    } catch (error: any) {
      console.error('[VoicePipeline] ===== ERROR IN GUIDED CONVERSATION =====');
      console.error('[VoicePipeline] Error name:', error.name);
      console.error('[VoicePipeline] Error message:', error.message);
      console.error('[VoicePipeline] Error stack:', error.stack);
      setError(error.message);
      setStatus('error');
    }
  }, [speakResponse, startRecording, setError, setStatus]);

  return {
    handleMicPress,
    cancelRecording,
    startGuidedConversation,
    status,
  };
};
