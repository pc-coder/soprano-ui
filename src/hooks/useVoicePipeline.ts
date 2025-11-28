import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { useVoice } from '../context/VoiceContext';
import { useScreenContext } from '../context/ScreenContext';
import { useGuidedForm } from '../context/GuidedFormContext';
import { useVisualGuide } from '../context/VisualGuideContext';
import { useFormController } from './useFormController';
import { RECORDING_OPTIONS } from '../config/api';
import {
  transcribeAudio,
  getLLMResponse,
  synthesizeSpeech,
  playAudio,
  stopAudio,
  cleanupAudioFiles,
  GuidedContextData,
} from '../services/voiceService';
import { processFieldResponse, validateFieldValue, generateErrorPrompt, generateTaskGreeting } from '../utils/conversationFlow';
import { scanAddressDocument, scanPANCard, DocumentData } from '../services/documentScanService';

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
  const visualGuide = useVisualGuide();
  const { fillField } = useFormController();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const prevGuidedModeRef = useRef(guidedForm.isGuidedMode);

  /**
   * Cancel recording and audio when guided mode stops
   */
  useEffect(() => {
    const wasGuidedMode = prevGuidedModeRef.current;
    const isGuidedMode = guidedForm.isGuidedMode;

    // If guided mode just stopped, cancel any ongoing recording and audio
    if (wasGuidedMode && !isGuidedMode) {
      console.log('[VoicePipeline] Guided mode stopped - canceling recording and audio');

      // Stop any playing audio
      stopAudio().catch((e) => {
        console.log('[VoicePipeline] Error stopping audio on guided mode exit:', e);
      });

      // Cancel recording
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch((e) => {
          console.log('[VoicePipeline] Error stopping recording on guided mode exit:', e);
        });
        recordingRef.current = null;
      }

      // Reset voice context
      reset();
    }

    // Update previous state
    prevGuidedModeRef.current = isGuidedMode;
  }, [guidedForm.isGuidedMode, reset]);

  /**
   * Start audio recording
   */
  const startRecording = useCallback(async () => {
    console.log('[VoicePipeline] ===== START RECORDING CALLED =====');
    console.log('[VoicePipeline] Current status:', status);
    console.log('[VoicePipeline] Guided mode:', guidedForm.isGuidedMode);
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

      console.log('[VoicePipeline] Setting audio mode for recording...');
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('[VoicePipeline] Audio mode set successfully');

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
      console.log('[VoicePipeline] ===== RECORDING STARTED SUCCESSFULLY =====');
      console.log('[VoicePipeline] Status set to: listening');
    } catch (error: any) {
      console.error('[VoicePipeline] ===== START RECORDING FAILED =====');
      console.error('[VoicePipeline] Error:', error.message);
      console.error('[VoicePipeline] Stack:', error.stack);
      setError(`Failed to start recording: ${error.message}`);
      setStatus('error');

      // In guided mode, alert the user that they need to tap the mic
      if (guidedForm.isGuidedMode) {
        console.error('[VoicePipeline] Recording failed in guided mode - user will need to tap mic manually');
      }
    }
  }, [setStatus, setIsRecording, setError, status, guidedForm.isGuidedMode]);

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
            await new Promise(resolve => setTimeout(resolve, 700));
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

      // Prepare element registry for navigation assistance
      const elementRegistry = visualGuide.elementRegistry
        .filter(e => e.screenName === currentScreen)
        .map(e => ({ id: e.id, description: e.description }));

      console.log('[VoicePipeline] Element registry for', currentScreen, ':', elementRegistry.length, 'elements');
      console.log('[VoicePipeline] Elements:', elementRegistry.map(e => e.id).join(', '));

      // Step 2: Get LLM response from Anthropic with screen context and guided context
      const llmResponse = await getLLMResponse(transcript, contextData, guidedContextData, elementRegistry);
      setResponse(llmResponse);

      console.log('[VoicePipeline] LLM Response:', llmResponse.substring(0, 200));

      // Step 3: Check if response is a navigation guide
      const navigationGuide = parseNavigationGuide(llmResponse);

      console.log('[VoicePipeline] Navigation guide parsed:', navigationGuide);

      if (navigationGuide) {
        // Handle visual navigation guide
        await handleNavigationGuide(navigationGuide);
      } else if (guidedForm.isGuidedMode) {
        // Handle guided mode
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

      // Done - only set to idle if we haven't started a new recording
      // (in guided mode, we may have already started listening for the next field)
      if (!recordingRef.current) {
        console.log('[VoicePipeline] Processing complete, setting status to idle');
        setStatus('idle');
      } else {
        console.log('[VoicePipeline] Processing complete but already recording next field, keeping status as is');
      }

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
            await new Promise(resolve => setTimeout(resolve, 700));
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
            await new Promise(resolve => setTimeout(resolve, 200));
            await speakResponse(nextField.prompt);

            // Extra delay to ensure audio session is fully released and ready for recording
            console.log('[VoicePipeline] Waiting for audio session to be ready...');
            await new Promise(resolve => setTimeout(resolve, 700));
            console.log('[VoicePipeline] Starting recording for next field');
            await startRecording();
          }
        } else {
          // All fields completed - automatically submit
          console.log('[VoicePipeline] All fields completed, auto-submitting');
          await autoSubmitForm();
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
          await new Promise(resolve => setTimeout(resolve, 200));
          if (nextField) {
            await speakResponse(nextField.prompt);
            // Extra delay to ensure audio session is ready for recording
            await new Promise(resolve => setTimeout(resolve, 700));
            await startRecording();
          }
        } else {
          await speakResponse("I'm sorry, but this field is required. " + currentField.prompt);
          await new Promise(resolve => setTimeout(resolve, 700));
          await startRecording();
        }
        break;
      }

      case 'go_back': {
        // Get previous field directly from moveToPreviousField()
        const prevField = guidedForm.moveToPreviousField();
        await speakResponse(parsed.message);

        // Small delay then ask for the previous field
        await new Promise(resolve => setTimeout(resolve, 200));
        if (prevField) {
          await speakResponse(prevField.prompt);
          // Extra delay to ensure audio session is ready for recording
          await new Promise(resolve => setTimeout(resolve, 700));
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
        await new Promise(resolve => setTimeout(resolve, 700));
        await startRecording();
        break;
      }

      case 'scan_document': {
        try {
          // Speak the AI's message suggesting scanning
          await speakResponse(parsed.message);

          console.log('[VoicePipeline] Starting document scan for type:', parsed.documentType);

          // Scan the appropriate document type
          let extractedData: DocumentData;
          if (parsed.documentType === 'address') {
            extractedData = await scanAddressDocument(true);
          } else if (parsed.documentType === 'pan') {
            extractedData = await scanPANCard(true);
          } else {
            throw new Error('Unknown document type');
          }

          console.log('[VoicePipeline] Document scanned successfully:', extractedData);

          // Extract the value based on field type
          let fieldValue: string = '';
          if (currentField.name === 'address' && extractedData) {
            // Combine address parts into single string
            const addressParts = [
              extractedData.addressLine1,
              extractedData.addressLine2,
              extractedData.city,
              extractedData.state,
              extractedData.pincode,
            ].filter(Boolean);
            fieldValue = addressParts.join(', ');
          } else if (currentField.name === 'panNumber' && extractedData.panNumber) {
            fieldValue = extractedData.panNumber;
          }

          if (!fieldValue) {
            throw new Error('No data extracted from document');
          }

          // Validate the extracted value
          const validation = validateFieldValue(fieldValue, currentField, formState);
          if (!validation.valid && validation.error) {
            await speakResponse(`The scanned data is invalid: ${validation.error}. Let me ask you again. ${currentField.prompt}`);
            await new Promise(resolve => setTimeout(resolve, 200));
            await startRecording();
            return;
          }

          // Fill the form field with scanned data
          const fieldRef = formRefs[currentField.refName];
          const fieldHandler = formHandlers[`set${currentField.name.charAt(0).toUpperCase()}${currentField.name.slice(1)}`];

          if (fieldRef && fieldHandler) {
            const fieldOnBlur = formHandlers[`handle${currentField.name.charAt(0).toUpperCase()}${currentField.name.slice(1)}Blur`];
            fillField(fieldRef, fieldValue, fieldHandler, fieldOnBlur);
          }

          // Update guided form state
          guidedForm.updateFieldValue(currentField.name, '(scanned from document)', fieldValue);

          // Speak confirmation
          await speakResponse(`Great! I've captured your ${currentField.label.toLowerCase()} from the document.`);

          // Move to next field
          if (!guidedForm.isLastField()) {
            const nextField = guidedForm.moveToNextField();
            if (nextField) {
              await new Promise(resolve => setTimeout(resolve, 200));
              await speakResponse(nextField.prompt);
              await new Promise(resolve => setTimeout(resolve, 700));
              await startRecording();
            }
          } else {
            // All fields completed - automatically submit
            console.log('[VoicePipeline] All fields completed, auto-submitting');
            await autoSubmitForm();
          }
        } catch (error: any) {
          console.error('[VoicePipeline] Document scan error:', error.message);

          // Handle error gracefully - fall back to voice input
          if (error.message.includes('No image captured')) {
            // User cancelled - ask them to provide verbally instead
            await speakResponse("No problem. Let's continue with voice instead. " + currentField.prompt);
          } else {
            await speakResponse("I had trouble scanning the document. Let's try entering it with voice instead. " + currentField.prompt);
          }

          await new Promise(resolve => setTimeout(resolve, 700));
          await startRecording();
        }
        break;
      }
    }
  }, [guidedForm, formState, formRefs, formHandlers, fillField, speakResponse, startRecording]);

  /**
   * Parse navigation guide from LLM response
   */
  const parseNavigationGuide = (response: string): { element_id: string; instruction: string } | null => {
    try {
      // Try to extract JSON from response
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const parsed = JSON.parse(jsonStr);

      if (parsed.type === 'navigation_guide' && parsed.element_id && parsed.instruction) {
        return {
          element_id: parsed.element_id,
          instruction: parsed.instruction,
        };
      }

      return null;
    } catch (e) {
      // Not a JSON response, return null
      return null;
    }
  };

  /**
   * Handle navigation guide by highlighting element and speaking instruction
   */
  const handleNavigationGuide = useCallback(async (guide: { element_id: string; instruction: string }) => {
    console.log('[VoicePipeline] Showing navigation guide for:', guide.element_id);

    // Speak the instruction
    await speakResponse(guide.instruction);

    // Show visual guide
    await visualGuide.showGuide(guide.element_id, guide.instruction);
  }, [visualGuide, speakResponse]);

  /**
   * Summarize details and ask user to click Continue button
   */
  const autoSubmitForm = useCallback(async () => {
    console.log('[VoicePipeline] All fields completed, summarizing');

    // Get the filled values from guided form
    const filledValues = guidedForm.getFilledValues();
    console.log('[VoicePipeline] Filled values from conversation history:', filledValues);

    // Generate summary message
    let summary = "Great! All details collected. ";

    // Format summary based on screen
    if (currentScreen === 'UPIPayment') {
      const upiId = filledValues.upiId || '';
      const amount = filledValues.amount || '';
      const note = filledValues.note;

      summary += `You're sending ${amount} rupees to ${upiId}`;
      if (note) {
        summary += ` with the note: ${note}`;
      }
      summary += ". Please click the Continue button to proceed with the payment.";
    }

    // Speak summary
    await speakResponse(summary);

    // Stop guided mode - user will click Continue button to proceed
    guidedForm.stopGuidedMode();
  }, [guidedForm, currentScreen, speakResponse]);

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
      await new Promise(resolve => setTimeout(resolve, 700));
      await startRecording();
    } else {
      // Unclear response - ask again
      await speakResponse("I didn't catch that. Would you like to proceed with this payment? Please say yes or no.");
      await new Promise(resolve => setTimeout(resolve, 700));
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
        await new Promise(resolve => setTimeout(resolve, 700));
        await startRecording();
      } else {
        await speakResponse("Sorry, I couldn't find that field. Please say UPI ID, amount, or note.");
        await new Promise(resolve => setTimeout(resolve, 700));
        await startRecording();
      }
    } else {
      // Unclear response
      await speakResponse("I didn't catch which field you want to edit. Please say UPI ID, amount, or note.");
      await new Promise(resolve => setTimeout(resolve, 700));
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
    // Reset status to idle after speaking completes
    setStatus('idle');
    console.log('[VoicePipeline] Speech completed, status reset to idle');
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
    console.log('[VoicePipeline] Current screen:', currentScreen);

    try {
      if (!firstField) {
        console.error('[VoicePipeline] No first field provided - ABORTING');
        return;
      }

      // Generate task-specific greeting
      const summary = generateTaskGreeting(currentScreen, totalFields);
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
      console.log('[VoicePipeline] Waiting 700ms before starting recording...');
      await new Promise(resolve => setTimeout(resolve, 700));
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
  }, [currentScreen, speakResponse, startRecording, setError, setStatus]);

  return {
    handleMicPress,
    cancelRecording,
    startGuidedConversation,
    status,
  };
};
