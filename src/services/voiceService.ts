import Anthropic from '@anthropic-ai/sdk';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { EncodingType } from 'expo-file-system/legacy';
import { API_CONFIG } from '../config/api';
import { createSystemPrompt } from '../utils/contextSerializer';
import { FormFieldDefinition, ConversationEntry } from '../context/GuidedFormContext';

export interface GuidedContextData {
  isGuidedMode: boolean;
  currentField?: FormFieldDefinition;
  completedFields: string[];
  conversationHistory: ConversationEntry[];
  progress: { current: number; total: number };
}

/**
 * Transcribe audio using Deepgram STT
 */
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  const startTime = performance.now();

  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist');
    }

    // Read audio file as base64
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: EncodingType.Base64,
    });

    // Convert base64 to Uint8Array
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Call Deepgram API with language detection
    const deepgramResponse = await fetch(
      `${API_CONFIG.deepgram.baseUrl}/listen?model=nova-2&smart_format=true&detect_language=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${API_CONFIG.deepgram.apiKey}`,
          'Content-Type': 'audio/m4a',
        },
        body: bytes,
      }
    );

    if (!deepgramResponse.ok) {
      const error = await deepgramResponse.text();
      throw new Error(`Deepgram API error: ${error}`);
    }

    const data = await deepgramResponse.json();
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;
    const detectedLanguage = data.results?.channels[0]?.detected_language;

    if (!transcript) {
      throw new Error('No transcript returned from Deepgram');
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    const langInfo = detectedLanguage ? ` [${detectedLanguage}]` : '';
    console.log(`[VoiceService] STT completed in ${duration}s${langInfo}: "${transcript}"`);

    return transcript;
  } catch (error: any) {
    console.error('[VoiceService] STT error:', error.message);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

/**
 * Get LLM response from Anthropic Claude
 */
export const getLLMResponse = async (
  transcript: string,
  contextData: { currentScreen: string; screenData: Record<string, any>; formState: Record<string, any> },
  guidedContext?: GuidedContextData,
  elementRegistry?: Array<{ id: string; description: string }>
): Promise<string> => {
  const startTime = performance.now();

  try {
    const anthropic = new Anthropic({
      apiKey: API_CONFIG.anthropic.apiKey,
    });

    const systemPrompt = createSystemPrompt(contextData, guidedContext, elementRegistry);

    const message = await anthropic.messages.create({
      model: API_CONFIG.anthropic.model,
      max_tokens: API_CONFIG.anthropic.maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: transcript,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    if (!responseText) {
      throw new Error('No response text from Anthropic');
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[VoiceService] LLM completed in ${duration}s`);

    return responseText;
  } catch (error: any) {
    console.error('[VoiceService] LLM error:', error.message);
    throw new Error(`Failed to get LLM response: ${error.message}`);
  }
};

/**
 * Synthesize speech using ElevenLabs TTS
 */
export const synthesizeSpeech = async (text: string): Promise<string> => {
  const startTime = performance.now();

  try {
    console.log('[VoiceService] Synthesizing text:', text.substring(0, 50) + '...');
    console.log('[VoiceService] API Key present:', !!API_CONFIG.elevenlabs.apiKey);
    console.log('[VoiceService] Voice ID:', API_CONFIG.elevenlabs.voiceId);

    const response = await fetch(
      `${API_CONFIG.elevenlabs.baseUrl}/text-to-speech/${API_CONFIG.elevenlabs.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': API_CONFIG.elevenlabs.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: API_CONFIG.elevenlabs.model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    console.log('[VoiceService] TTS response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[VoiceService] TTS error response:', error);
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    // Save audio to file
    const audioBlob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          const fileUri = `${FileSystem.cacheDirectory}soprano_response_${Date.now()}.mp3`;

          await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
            encoding: EncodingType.Base64,
          });

          const duration = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log(`[VoiceService] TTS completed in ${duration}s`);

          resolve(fileUri);
        } catch (error: any) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read audio blob'));
      reader.readAsDataURL(audioBlob);
    });
  } catch (error: any) {
    console.error('[VoiceService] TTS error:', error.message);
    throw new Error(`Failed to synthesize speech: ${error.message}`);
  }
};

// Keep track of current audio playback
let currentSound: Audio.Sound | null = null;

/**
 * Stop current audio playback
 */
export const stopAudio = async (): Promise<void> => {
  try {
    if (currentSound) {
      console.log('[VoiceService] Stopping current audio');
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (error: any) {
    console.error('[VoiceService] Error stopping audio:', error.message);
    currentSound = null;
  }
};

/**
 * Play audio file
 */
export const playAudio = async (audioUri: string): Promise<void> => {
  try {
    // Stop any currently playing audio
    await stopAudio();

    // Set audio mode for playback
    console.log('[VoiceService] Setting audio mode for playback');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    console.log('[VoiceService] Creating audio from URI:', audioUri);

    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true }
    );

    // Store reference to current sound
    currentSound = sound;

    console.log('[VoiceService] Audio created, playing...');

    // Wait for playback to finish
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('[VoiceService] Playback finished');
          resolve();
        }
      });
    });

    await sound.unloadAsync();
    currentSound = null;
    console.log('[VoiceService] Audio unloaded');

    // Reset audio mode to allow recording after playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    console.log('[VoiceService] Audio mode reset for recording');
  } catch (error: any) {
    console.error('[VoiceService] Playback error:', error.message);
    console.error('[VoiceService] Full playback error:', error);
    currentSound = null;
    throw new Error(`Failed to play audio: ${error.message}`);
  }
};

/**
 * Clean up temporary audio files
 */
export const cleanupAudioFiles = async (): Promise<void> => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return;

    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const audioFiles = files.filter(
      (file) => file.startsWith('soprano_') && file.endsWith('.mp3')
    );

    await Promise.all(
      audioFiles.map((file) =>
        FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true })
      )
    );

    console.log('[VoiceService] Cleaned up audio files');
  } catch (error) {
    console.error('[VoiceService] Cleanup error:', error);
  }
};
