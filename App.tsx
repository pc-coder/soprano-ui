import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ScreenContextProvider } from './src/context/ScreenContext';
import { VoiceProvider } from './src/context/VoiceContext';
import { GuidedFormProvider } from './src/context/GuidedFormContext';
import { VisualGuideProvider } from './src/context/VisualGuideContext';
import AppNavigator from './src/navigation/AppNavigator';
import { VisualGuideOverlay } from './src/components/VisualGuideOverlay';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ScreenContextProvider>
          <VoiceProvider>
            <GuidedFormProvider>
              <VisualGuideProvider>
                <StatusBar barStyle="light-content" />
                <AppNavigator />
                <VisualGuideOverlay />
              </VisualGuideProvider>
            </GuidedFormProvider>
          </VoiceProvider>
        </ScreenContextProvider>
      </AppProvider>
    </AuthProvider>
  );
}
