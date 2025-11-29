import React, { createContext, useContext, useState, ReactNode } from 'react';

export type STTProvider = 'openai' | 'expo-speech';
export type LLMProvider = 'claude' | 'qwen';
export type TTSProvider = 'elevenlabs' | 'expo-speech';
export type OCRProvider = 'claude' | 'smolvlm';

interface SettingsContextType {
  showCaptions: boolean;
  setShowCaptions: (enabled: boolean) => void;
  sttProvider: STTProvider;
  setSttProvider: (provider: STTProvider) => void;
  llmProvider: LLMProvider;
  setLlmProvider: (provider: LLMProvider) => void;
  ttsProvider: TTSProvider;
  setTtsProvider: (provider: TTSProvider) => void;
  ocrProvider: OCRProvider;
  setOcrProvider: (provider: OCRProvider) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [showCaptions, setShowCaptions] = useState(false);
  const [sttProvider, setSttProvider] = useState<STTProvider>('openai');
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('claude');
  const [ttsProvider, setTtsProvider] = useState<TTSProvider>('elevenlabs');
  const [ocrProvider, setOcrProvider] = useState<OCRProvider>('claude');

  const value: SettingsContextType = {
    showCaptions,
    setShowCaptions,
    sttProvider,
    setSttProvider,
    llmProvider,
    setLlmProvider,
    ttsProvider,
    setTtsProvider,
    ocrProvider,
    setOcrProvider,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
