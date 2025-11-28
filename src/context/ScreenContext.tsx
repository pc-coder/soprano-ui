import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

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
  const [currentScreen, setCurrentScreenState] = useState<string>('Dashboard');
  const currentScreenRef = useRef<string>('Dashboard');
  const [screenData, setScreenData] = useState<Record<string, any>>({});
  const [formState, setFormState] = useState<Record<string, any>>({});

  const setCurrentScreen = (screen: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[ScreenContext] ${timestamp} - Screen Changed: ${currentScreenRef.current} → ${screen}`);
    currentScreenRef.current = screen;
    setCurrentScreenState(screen);
  };

  const updateScreenData = (data: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const newData = { ...screenData, ...data };

    console.log(`[ScreenContext] ${timestamp} - Screen Data Updated`);
    console.log(`  Screen: ${currentScreenRef.current}`);
    console.log(`  Data Fields:`);
    Object.keys(newData).forEach(key => {
      const value = newData[key];
      const displayValue = value === null ? 'null'
        : value === undefined ? 'undefined'
        : value === '' ? '(empty string)'
        : typeof value === 'object' ? JSON.stringify(value)
        : String(value);
      console.log(`    ${key}: ${displayValue}`);
    });

    setScreenData(newData);
  };

  const updateFormState = (data: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const newFormState = { ...formState, ...data };

    console.log(`[ScreenContext] ${timestamp} - Form State Updated`);
    console.log(`  Screen: ${currentScreenRef.current}`);
    console.log(`  Form Fields:`);
    Object.keys(newFormState).forEach(key => {
      const value = newFormState[key];
      const displayValue = value === null ? 'null'
        : value === undefined ? 'undefined'
        : value === '' ? '(empty string)'
        : typeof value === 'object' ? JSON.stringify(value)
        : String(value);
      console.log(`    ${key}: ${displayValue}`);
    });

    setFormState(newFormState);
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
