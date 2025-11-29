import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
  showCaptions: boolean;
  setShowCaptions: (enabled: boolean) => void;
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

  const value: SettingsContextType = {
    showCaptions,
    setShowCaptions,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
