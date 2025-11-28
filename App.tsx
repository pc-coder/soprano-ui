import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import { ScreenContextProvider } from './src/context/ScreenContext';
import { VoiceProvider } from './src/context/VoiceContext';
import { GuidedFormProvider } from './src/context/GuidedFormContext';
import { VisualGuideProvider } from './src/context/VisualGuideContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ContextDebugOverlay } from './src/components/ContextDebugOverlay';
import { VisualGuideOverlay } from './src/components/VisualGuideOverlay';

export default function App() {
  return (
    <AppProvider>
      <ScreenContextProvider>
        <VoiceProvider>
          <GuidedFormProvider>
            <VisualGuideProvider>
              <StatusBar barStyle="light-content" />
              <AppNavigator />
              <ContextDebugOverlay />
              <VisualGuideOverlay />
            </VisualGuideProvider>
          </GuidedFormProvider>
        </VoiceProvider>
      </ScreenContextProvider>
    </AppProvider>
  );
}
