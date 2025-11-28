import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import { ScreenContextProvider } from './src/context/ScreenContext';
import { VoiceProvider } from './src/context/VoiceContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ContextDebugOverlay } from './src/components/ContextDebugOverlay';

export default function App() {
  return (
    <AppProvider>
      <ScreenContextProvider>
        <VoiceProvider>
          <StatusBar barStyle="light-content" />
          <AppNavigator />
          <ContextDebugOverlay />
        </VoiceProvider>
      </ScreenContextProvider>
    </AppProvider>
  );
}
