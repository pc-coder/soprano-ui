import { API_CONFIG } from '../config/api';

/**
 * Maps Whisper language names to ISO 639-1 codes
 * Whisper returns lowercase full language names like "english", "hindi"
 */
const WHISPER_TO_ISO_MAP: Record<string, string> = {
  'english': 'en',
  'hindi': 'hi',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'portuguese': 'pt',
  'chinese': 'zh',
  'japanese': 'ja',
  'korean': 'ko',
  'russian': 'ru',
  'arabic': 'ar',
  'dutch': 'nl',
  'turkish': 'tr',
  'polish': 'pl',
  'ukrainian': 'uk',
  'indonesian': 'id',
  'vietnamese': 'vi',
  'thai': 'th',
  'czech': 'cs',
  'romanian': 'ro',
  'hungarian': 'hu',
  'greek': 'el',
  'bulgarian': 'bg',
  'danish': 'da',
  'finnish': 'fi',
  'swedish': 'sv',
  'norwegian': 'no',
  'slovak': 'sk',
  'croatian': 'hr',
  'malay': 'ms',
  'tamil': 'ta',
  'filipino': 'fil',
};

/**
 * Convert Whisper language name to ISO 639-1 code
 */
export const whisperLanguageToISO = (whisperLanguage: string): string => {
  const normalized = whisperLanguage.toLowerCase().trim();
  return WHISPER_TO_ISO_MAP[normalized] || 'en'; // Default to English
};

/**
 * Get the appropriate ElevenLabs voice ID based on detected language
 */
export const getVoiceIdForLanguage = (whisperLanguage: string): string => {
  const isoCode = whisperLanguageToISO(whisperLanguage);

  // Check if we have language-specific voice IDs configured
  if (isoCode === 'hi' && API_CONFIG.elevenlabs.voiceIdHindi) {
    console.log('[LanguageMapping] Using Hindi voice for language:', whisperLanguage);
    return API_CONFIG.elevenlabs.voiceIdHindi;
  }

  if (isoCode === 'en' && API_CONFIG.elevenlabs.voiceIdEnglish) {
    console.log('[LanguageMapping] Using English voice for language:', whisperLanguage);
    return API_CONFIG.elevenlabs.voiceIdEnglish;
  }

  // Fall back to default voice ID if language-specific ones aren't configured
  // or if English voice ID is configured, use it as default
  const defaultVoice = API_CONFIG.elevenlabs.voiceIdEnglish || API_CONFIG.elevenlabs.voiceId;
  console.log('[LanguageMapping] Using default voice for language:', whisperLanguage);
  return defaultVoice;
};

/**
 * Get language code for ElevenLabs API (optional parameter)
 */
export const getLanguageCodeForElevenLabs = (whisperLanguage: string): string => {
  return whisperLanguageToISO(whisperLanguage);
};
