import Anthropic from '@anthropic-ai/sdk';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { EncodingType } from 'expo-file-system/legacy';
import { API_CONFIG } from '../config/api';
import { createSystemPrompt } from '../utils/contextSerializer';

/**
 * Transcribe audio using Deepgram STT
 */
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    console.log('[VoiceService] === TRANSCRIPTION DEBUG START ===');
    console.log('[VoiceService] Audio URI:', audioUri);
    console.log('[VoiceService] FileSystem available:', !!FileSystem);
    console.log('[VoiceService] EncodingType available:', !!EncodingType);
    console.log('[VoiceService] EncodingType.Base64:', EncodingType?.Base64);

    // Check if file exists
    console.log('[VoiceService] Checking if file exists...');
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    console.log('[VoiceService] File info:', JSON.stringify(fileInfo, null, 2));

    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist');
    }

    console.log('[VoiceService] File size:', fileInfo.size, 'bytes');

    // Read audio file as base64
    console.log('[VoiceService] Reading file as base64...');
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: EncodingType.Base64,
    });
    console.log('[VoiceService] Base64 length:', audioBase64.length);
    console.log('[VoiceService] Base64 preview:', audioBase64.substring(0, 50));

    // Convert base64 to Uint8Array
    console.log('[VoiceService] Converting to Uint8Array...');
    const binaryString = atob(audioBase64);
    console.log('[VoiceService] Binary string length:', binaryString.length);

    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('[VoiceService] Uint8Array created, length:', bytes.length);

    // Call Deepgram API
    console.log('[VoiceService] Calling Deepgram API...');
    console.log('[VoiceService] API Key present:', !!API_CONFIG.deepgram.apiKey);
    console.log('[VoiceService] API Key length:', API_CONFIG.deepgram.apiKey?.length);

    const deepgramResponse = await fetch(
      `${API_CONFIG.deepgram.baseUrl}/listen?model=nova-2&smart_format=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${API_CONFIG.deepgram.apiKey}`,
          'Content-Type': 'audio/m4a',
        },
        body: bytes,
      }
    );

    console.log('[VoiceService] Deepgram response status:', deepgramResponse.status);

    if (!deepgramResponse.ok) {
      const error = await deepgramResponse.text();
      console.error('[VoiceService] Deepgram API error response:', error);
      throw new Error(`Deepgram API error: ${error}`);
    }

    const data = await deepgramResponse.json();
    console.log('[VoiceService] Deepgram response data:', JSON.stringify(data, null, 2));

    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;

    if (!transcript) {
      throw new Error('No transcript returned from Deepgram');
    }

    console.log('[VoiceService] Transcription:', transcript);
    console.log('[VoiceService] === TRANSCRIPTION DEBUG END ===');
    return transcript;
  } catch (error: any) {
    console.error('[VoiceService] === TRANSCRIPTION ERROR ===');
    console.error('[VoiceService] Error name:', error.name);
    console.error('[VoiceService] Error message:', error.message);
    console.error('[VoiceService] Error stack:', error.stack);
    console.error('[VoiceService] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

/**
 * Get LLM response from Anthropic Claude
 */
export const getLLMResponse = async (
  transcript: string,
  contextData: { currentScreen: string; screenData: Record<string, any>; formState: Record<string, any> }
): Promise<string> => {
  try {
    console.log('[VoiceService] Getting LLM response from Anthropic...');

    const anthropic = new Anthropic({
      apiKey: API_CONFIG.anthropic.apiKey,
    });

    const systemPrompt = createSystemPrompt(contextData);

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

    console.log('[VoiceService] LLM response:', responseText);
    return responseText;
  } catch (error: any) {
    console.error('[VoiceService] LLM error:', error);
    throw new Error(`Failed to get LLM response: ${error.message}`);
  }
};

/**
 * Synthesize speech using ElevenLabs TTS
 */
export const synthesizeSpeech = async (text: string): Promise<string> => {
  try {
    console.log('[VoiceService] Synthesizing speech with ElevenLabs...');

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

    if (!response.ok) {
      const error = await response.text();
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

          console.log('[VoiceService] Audio saved to:', fileUri);
          resolve(fileUri);
        } catch (error: any) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read audio blob'));
      reader.readAsDataURL(audioBlob);
    });
  } catch (error: any) {
    console.error('[VoiceService] TTS error:', error);
    throw new Error(`Failed to synthesize speech: ${error.message}`);
  }
};

/**
 * Play audio file
 */
export const playAudio = async (audioUri: string): Promise<void> => {
  try {
    console.log('[VoiceService] Playing audio...');

    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true }
    );

    // Wait for playback to finish
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          resolve();
        }
      });
    });

    await sound.unloadAsync();
    console.log('[VoiceService] Audio playback complete');
  } catch (error: any) {
    console.error('[VoiceService] Playback error:', error);
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
