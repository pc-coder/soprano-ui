import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ScreenContextProvider } from './src/context/ScreenContext';
import { VoiceProvider } from './src/context/VoiceContext';
import { GuidedFormProvider } from './src/context/GuidedFormContext';
import { VisualGuideProvider } from './src/context/VisualGuideContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { VisualGuideOverlay } from './src/components/VisualGuideOverlay';
import { SpeechCaption } from './src/components/SpeechCaption';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppProvider>
          <ScreenContextProvider>
            <VoiceProvider>
              <GuidedFormProvider>
                <VisualGuideProvider>
                  <StatusBar barStyle="light-content" />
                  <AppNavigator />
                  <VisualGuideOverlay />
                  <SpeechCaption />
                </VisualGuideProvider>
              </GuidedFormProvider>
            </VoiceProvider>
          </ScreenContextProvider>
        </AppProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
