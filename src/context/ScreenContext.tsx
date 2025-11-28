import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ScreenContextType {
  currentScreen: string;
  screenData: Record<string, any>;
  formState: Record<string, any>;
  updateScreenData: (data: Record<string, any>) => void;
  updateFormState: (data: Record<string, any>) => void;
  setCurrentScreen: (screen: string) => void;
}

const ScreenContext = createContext<ScreenContextType | undefined>(undefined);

export const useScreenContext = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error('useScreenContext must be used within ScreenContextProvider');
  }
  return context;
};

interface ScreenContextProviderProps {
  children: ReactNode;
}

export const ScreenContextProvider: React.FC<ScreenContextProviderProps> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<string>('Dashboard');
  const [screenData, setScreenData] = useState<Record<string, any>>({});
  const [formState, setFormState] = useState<Record<string, any>>({});

  const updateScreenData = (data: Record<string, any>) => {
    setScreenData(prev => ({ ...prev, ...data }));
  };

  const updateFormState = (data: Record<string, any>) => {
    setFormState(prev => ({ ...prev, ...data }));
  };

  const value: ScreenContextType = {
    currentScreen,
    screenData,
    formState,
    updateScreenData,
    updateFormState,
    setCurrentScreen,
  };

  return <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>;
};
