import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  openai: {
    apiKey: Constants.expoConfig?.extra?.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com/v1',
    whisperModel: 'whisper-1',
  },
  anthropic: {
    apiKey: Constants.expoConfig?.extra?.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
    model: 'claude-sonnet-4-5',
    commentaryModel: 'claude-haiku-4-5',
    maxTokens: 1024,
    commentaryMaxTokens: 512,
  },
  elevenlabs: {
    apiKey: Constants.expoConfig?.extra?.ELEVENLABS_API_KEY || process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
    voiceId: Constants.expoConfig?.extra?.ELEVENLABS_VOICE_ID || process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || '',
    voiceIdEnglish: Constants.expoConfig?.extra?.ELEVENLABS_VOICE_ID_ENGLISH || process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID_ENGLISH || '',
    voiceIdHindi: Constants.expoConfig?.extra?.ELEVENLABS_VOICE_ID_HINDI || process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID_HINDI || '',
    baseUrl: 'https://api.elevenlabs.io/v1',
    model: 'eleven_multilingual_v2',
  },
};

// Validate API keys on import (only in development)
if (__DEV__) {
  const missingKeys: string[] = [];

  if (!API_CONFIG.openai.apiKey) missingKeys.push('OPENAI_API_KEY');
  if (!API_CONFIG.anthropic.apiKey) missingKeys.push('ANTHROPIC_API_KEY');
  if (!API_CONFIG.elevenlabs.apiKey) missingKeys.push('ELEVENLABS_API_KEY');
  if (!API_CONFIG.elevenlabs.voiceId && !API_CONFIG.elevenlabs.voiceIdEnglish) {
    missingKeys.push('ELEVENLABS_VOICE_ID or ELEVENLABS_VOICE_ID_ENGLISH');
  }

  if (missingKeys.length > 0) {
    console.warn(
      '[API Config] Missing API keys:',
      missingKeys.join(', '),
      '\nPlease add them to your .env file'
    );
  }
}

export const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: 2, // MPEG_4
    audioEncoder: 3, // AAC
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: 'mpeg4aac',
    audioQuality: 'MAX',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};
