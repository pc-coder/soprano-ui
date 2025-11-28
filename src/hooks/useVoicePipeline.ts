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
      // Clean up any existing recording first
      if (recordingRef.current) {
        console.log('[VoicePipeline] Found existing recording, cleaning up...');
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log('[VoicePipeline] Error stopping previous recording (might already be stopped):', e);
        }
        recordingRef.current = null;
        console.log('[VoicePipeline] Previous recording cleaned up');
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

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
      console.log('[VoicePipeline] Stopping and unloading recording...');
      await recordingRef.current.stopAndUnloadAsync();
      const audioUri = recordingRef.current.getURI();
      console.log('[VoicePipeline] Recording URI retrieved:', audioUri);
      recordingRef.current = null;
      console.log('[VoicePipeline] Recording reference cleared');

      setIsRecording(false);

      if (!audioUri) {
        throw new Error('No audio recorded');
      }

      setStatus('processing');

      // Step 1: Transcribe audio with Deepgram
      let transcript: string;
      try {
        transcript = await transcribeAudio(audioUri);
        setTranscript(transcript);
      } catch (transcriptionError: any) {
        console.error('[VoicePipeline] Transcription failed:', transcriptionError.message);

        // If in guided mode, ask user to repeat
        if (guidedForm.isGuidedMode) {
          const currentField = guidedForm.getCurrentField();
          if (currentField) {
            console.log('[VoicePipeline] Guided mode - asking user to repeat');
            await speakResponse("I didn't catch that. Could you please repeat?");
            await new Promise(resolve => setTimeout(resolve, 200));
            await startRecording();
            return;
          }
        }

        // Otherwise, throw the error
        throw transcriptionError;
      }

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
      if (guidedForm.isGuidedMode) {
        if (guidedForm.isAwaitingConfirmation) {
          // Handle confirmation response
          await handleConfirmationResponse(llmResponse, transcript);
        } else if (guidedForm.isSelectingFieldToEdit) {
          // Handle field selection for editing
          await handleFieldSelection(transcript);
        } else if (guidedContextData?.currentField) {
          // Handle field filling
          await handleGuidedModeResponse(llmResponse, transcript);
        }
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

      // If in guided mode, try to recover gracefully
      if (guidedForm.isGuidedMode) {
        const currentField = guidedForm.getCurrentField();
        if (currentField) {
          console.log('[VoicePipeline] Guided mode - recovering from error');
          try {
            await speakResponse("Sorry, I had trouble processing that. Let's try again. " + currentField.prompt);
            await new Promise(resolve => setTimeout(resolve, 200));
            await startRecording();
            return;
          } catch (recoveryError) {
            console.error('[VoicePipeline] Recovery also failed:', recoveryError);
            // Fall through to error state
          }
        }
      }

      // If not in guided mode or recovery failed, go to error state
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
          // Get next field directly from moveToNextField() to avoid race condition
          const nextField = guidedForm.moveToNextField();

          if (nextField) {
            // Small delay before speaking
            await new Promise(resolve => setTimeout(resolve, 100));
            await speakResponse(nextField.prompt);

            // Extra delay to ensure audio playback is complete and recording is ready
            await new Promise(resolve => setTimeout(resolve, 200));
            await startRecording();
          }
        } else {
          // All fields completed - move to confirmation phase
          console.log('[VoicePipeline] All fields completed, requesting confirmation');
          await requestConfirmation();
        }
        break;
      }

      case 'skip': {
        if (!currentField.required) {
          // skipCurrentField calls moveToNextField internally, need to update that too
          const nextField = guidedForm.moveToNextField();
          guidedForm.updateFieldValue(currentField.name, '(skipped)', null);
          await speakResponse(parsed.message);

          // Small delay then ask for next field after skipping
          await new Promise(resolve => setTimeout(resolve, 100));
          if (nextField) {
            await speakResponse(nextField.prompt);
            // Extra delay before starting recording
            await new Promise(resolve => setTimeout(resolve, 200));
            await startRecording();
          }
        } else {
          await speakResponse("I'm sorry, but this field is required. " + currentField.prompt);
          await new Promise(resolve => setTimeout(resolve, 200));
          await startRecording();
        }
        break;
      }

      case 'go_back': {
        // Get previous field directly from moveToPreviousField()
        const prevField = guidedForm.moveToPreviousField();
        await speakResponse(parsed.message);

        // Small delay then ask for the previous field
        await new Promise(resolve => setTimeout(resolve, 100));
        if (prevField) {
          await speakResponse(prevField.prompt);
          // Extra delay before starting recording
          await new Promise(resolve => setTimeout(resolve, 200));
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
        await new Promise(resolve => setTimeout(resolve, 200));
        await startRecording();
        break;
      }
    }
  }, [guidedForm, formState, formRefs, formHandlers, fillField, speakResponse, startRecording]);

  /**
   * Request confirmation after all fields are filled
   */
  const requestConfirmation = useCallback(async () => {
    console.log('[VoicePipeline] Generating summary for confirmation');

    // Generate summary from filled values
    const filledValues = guidedForm.getFilledValues();
    let summary = "Great! Let me confirm the details. ";

    // Format summary based on screen
    if (currentScreen === 'UPIPayment') {
      const upiId = filledValues.upiId || '';
      const amount = filledValues.amount || '';
      const note = filledValues.note;

      summary += `You're sending ${amount} rupees to ${upiId}`;
      if (note) {
        summary += ` with the note: ${note}`;
      }
      summary += ". Would you like to proceed with this payment?";
    }

    // Set awaiting confirmation state
    guidedForm.setAwaitingConfirmation(true);

    // Speak summary and ask for confirmation
    await speakResponse(summary);

    // Start listening for confirmation
    await new Promise(resolve => setTimeout(resolve, 200));
    await startRecording();
  }, [guidedForm, currentScreen, speakResponse, startRecording]);

  /**
   * Handle user's confirmation response
   */
  const handleConfirmationResponse = useCallback(async (llmResponse: string, userTranscript: string) => {
    console.log('[VoicePipeline] Handling confirmation response');
    console.log('[VoicePipeline] User said:', userTranscript);

    // Parse response - check for confirmation or rejection
    const lowerTranscript = userTranscript.toLowerCase();
    const isConfirmed =
      lowerTranscript.includes('yes') ||
      lowerTranscript.includes('confirm') ||
      lowerTranscript.includes('proceed') ||
      lowerTranscript.includes('correct') ||
      lowerTranscript.includes('yeah') ||
      lowerTranscript.includes('ok') ||
      lowerTranscript.includes('okay');

    const isRejected =
      lowerTranscript.includes('no') ||
      lowerTranscript.includes('cancel') ||
      lowerTranscript.includes('stop') ||
      lowerTranscript.includes('wrong') ||
      lowerTranscript.includes('edit') ||
      lowerTranscript.includes('change');

    if (isConfirmed) {
      console.log('[VoicePipeline] User confirmed - submitting form');
      await speakResponse("Perfect! Processing your payment now.");

      // Get the filled values from guided form
      const filledValues = guidedForm.getFilledValues();
      console.log('[VoicePipeline] Filled values from conversation history:', filledValues);

      // Stop guided mode
      guidedForm.stopGuidedMode();

      // Navigate directly using the values we collected
      // This bypasses the state synchronization issue
      if (currentScreen === 'UPIPayment' && formHandlers.navigation) {
        const upiIdValue = String(filledValues.upiId || '');
        const amountValue = parseFloat(String(filledValues.amount || '0'));
        const noteValue = String(filledValues.note || '');
        const balanceValue = formHandlers.balance || 50000;

        console.log('[VoicePipeline] Validating values before navigation:');
        console.log('  upiId:', upiIdValue);
        console.log('  amount:', amountValue);
        console.log('  note:', noteValue);

        // Validate before navigating
        const { validateUPIId, validateAmount } = require('../utils/validation');
        const { findPayeeByUPI, isNewPayee } = require('../data/mockPayees');

        const upiValidation = validateUPIId(upiIdValue);
        const amountValidation = validateAmount(amountValue, balanceValue);

        if (upiValidation.valid && amountValidation.valid) {
          const payee = findPayeeByUPI(upiIdValue);
          const recipientName = payee?.name || upiIdValue.split('@')[0];
          const isNewRecipient = isNewPayee(upiIdValue);

          console.log('[VoicePipeline] Validation passed, navigating to UPIConfirm');
          formHandlers.navigation.navigate('UPIConfirm', {
            upiId: upiIdValue,
            amount: amountValue,
            note: noteValue || undefined,
            recipientName,
            isNewRecipient,
          });
        } else {
          console.error('[VoicePipeline] Validation failed:', {
            upiError: upiValidation.error,
            amountError: amountValidation.error,
          });
          await speakResponse("Sorry, there was an error validating the payment details. Please try again.");
        }
      }
    } else if (isRejected) {
      console.log('[VoicePipeline] User rejected - offering to edit');
      guidedForm.setAwaitingConfirmation(false);
      guidedForm.setSelectingFieldToEdit(true);
      await speakResponse("No problem. Which field would you like to change? You can say UPI ID, amount, or note.");

      // Listen for which field to edit
      await new Promise(resolve => setTimeout(resolve, 200));
      await startRecording();
    } else {
      // Unclear response - ask again
      await speakResponse("I didn't catch that. Would you like to proceed with this payment? Please say yes or no.");
      await new Promise(resolve => setTimeout(resolve, 200));
      await startRecording();
    }
  }, [guidedForm, formHandlers, speakResponse, startRecording, currentScreen]);

  /**
   * Handle field selection when user wants to edit
   */
  const handleFieldSelection = useCallback(async (userTranscript: string) => {
    console.log('[VoicePipeline] Handling field selection');
    console.log('[VoicePipeline] User said:', userTranscript);

    const lowerTranscript = userTranscript.toLowerCase();

    // Map field labels to field names
    let selectedFieldName: string | null = null;
    if (lowerTranscript.includes('upi') || lowerTranscript.includes('id')) {
      selectedFieldName = 'upiId';
    } else if (lowerTranscript.includes('amount') || lowerTranscript.includes('money') || lowerTranscript.includes('rupee')) {
      selectedFieldName = 'amount';
    } else if (lowerTranscript.includes('note') || lowerTranscript.includes('message')) {
      selectedFieldName = 'note';
    } else if (lowerTranscript.includes('cancel') || lowerTranscript.includes('nevermind')) {
      // User wants to cancel editing
      guidedForm.setSelectingFieldToEdit(false);
      await speakResponse("Okay, transaction cancelled.");
      guidedForm.stopGuidedMode();
      return;
    }

    if (selectedFieldName) {
      console.log('[VoicePipeline] Selected field:', selectedFieldName);
      const field = guidedForm.jumpToField(selectedFieldName);

      if (field) {
        guidedForm.setSelectingFieldToEdit(false);
        await speakResponse(`Okay, let's update the ${field.label}. ${field.prompt}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        await startRecording();
      } else {
        await speakResponse("Sorry, I couldn't find that field. Please say UPI ID, amount, or note.");
        await new Promise(resolve => setTimeout(resolve, 200));
        await startRecording();
      }
    } else {
      // Unclear response
      await speakResponse("I didn't catch which field you want to edit. Please say UPI ID, amount, or note.");
      await new Promise(resolve => setTimeout(resolve, 200));
      await startRecording();
    }
  }, [guidedForm, speakResponse, startRecording]);

  /**
   * Synthesize and play response
   */
  const speakResponse = useCallback(async (text: string) => {
    const audioResponseUri = await synthesizeSpeech(text);
    setStatus('speaking');
    await playAudio(audioResponseUri);
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
      console.log('[VoicePipeline] Waiting 200ms before starting recording...');
      await new Promise(resolve => setTimeout(resolve, 200));
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
