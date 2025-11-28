import React, { createContext, useContext, useState, ReactNode } from 'react';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceState {
  status: VoiceStatus;
  isRecording: boolean;
  transcript: string | null;
  response: string | null;
  error: string | null;
}

interface VoiceContextType extends VoiceState {
  setStatus: (status: VoiceStatus) => void;
  setIsRecording: (isRecording: boolean) => void;
  setTranscript: (transcript: string | null) => void;
  setResponse: (response: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider');
  }
  return context;
};

interface VoiceProviderProps {
  children: ReactNode;
}

const initialState: VoiceState = {
  status: 'idle',
  isRecording: false,
  transcript: null,
  response: null,
  error: null,
};

export const VoiceProvider: React.FC<VoiceProviderProps> = ({ children }) => {
  const [status, setStatusInternal] = useState<VoiceStatus>(initialState.status);
  const [isRecording, setIsRecording] = useState(initialState.isRecording);
  const [transcript, setTranscript] = useState<string | null>(initialState.transcript);
  const [response, setResponse] = useState<string | null>(initialState.response);
  const [error, setError] = useState<string | null>(initialState.error);

  const setStatus = (newStatus: VoiceStatus) => {
    console.log('[VoiceContext] Status changing from', status, 'to', newStatus);
    setStatusInternal(newStatus);
  };

  const reset = () => {
    setStatus(initialState.status);
    setIsRecording(initialState.isRecording);
    setTranscript(initialState.transcript);
    setResponse(initialState.response);
    setError(initialState.error);
  };

  const value: VoiceContextType = {
    status,
    isRecording,
    transcript,
    response,
    error,
    setStatus,
    setIsRecording,
    setTranscript,
    setResponse,
    setError,
    reset,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};
