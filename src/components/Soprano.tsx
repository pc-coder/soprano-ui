import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { useVoice } from '../context/VoiceContext';
import { useVoicePipeline } from '../hooks/useVoicePipeline';
import { useGuidedForm } from '../context/GuidedFormContext';
import { useScreenContext } from '../context/ScreenContext';
import { getFormFieldsForScreen, hasGuidedFormSupport } from '../config/formFieldDefinitions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Soprano: React.FC = () => {
  const { status } = useVoice();
  const { handleMicPress, startGuidedConversation } = useVoicePipeline();
  const guidedForm = useGuidedForm();
  const { currentScreen, formRefs } = useScreenContext();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);
  const panRef = useRef<any>(null);
  const tapRef = useRef<any>(null);
  const longPressRef = useRef<any>(null);

  // Draggable position state - start at bottom center
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: SCREEN_WIDTH / 2 - 33, y: SCREEN_HEIGHT - 166 });

  // Initialize position at bottom center
  useEffect(() => {
    translateX.setOffset(lastOffset.current.x);
    translateY.setOffset(lastOffset.current.y);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('[Soprano] Status changed to:', status);
    console.log('[Soprano] Guided mode:', guidedForm.isGuidedMode);
  }, [status, guidedForm.isGuidedMode]);

  // Control Lottie animation based on status
  useEffect(() => {
    if (lottieRef.current) {
      switch (status) {
        case 'listening':
          lottieRef.current.play();
          break;
        case 'processing':
          lottieRef.current.play();
          break;
        case 'speaking':
          lottieRef.current.play();
          break;
        default:
          lottieRef.current.play(); // Always animate for personality
      }
    }
  }, [status]);

  // Pulsing animation for listening state
  useEffect(() => {
    if (status === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  // Rotating animation for processing state
  useEffect(() => {
    if (status === 'processing') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [status, rotateAnim]);

  const handleLongPress = async () => {
    console.log('[Soprano] Long press detected - starting guided mode');

    // Check if current screen supports guided mode
    if (!hasGuidedFormSupport(currentScreen)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Check if already in guided mode
    if (guidedForm.isGuidedMode) {
      return;
    }

    // Start guided mode
    const fieldDefinitions = getFormFieldsForScreen(currentScreen);

    if (fieldDefinitions.length === 0) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    guidedForm.startGuidedMode(fieldDefinitions, formRefs);

    try {
      // AI speaks first, then starts listening - pass field data directly to avoid state race condition
      await startGuidedConversation(fieldDefinitions[0], fieldDefinitions.length);
    } catch (error: any) {
      console.error('[Soprano] Error in guided conversation:', error.message);
    }
  };

  const getButtonColor = () => {
    // In guided mode, show status-based colors
    // but default to green when idle
    if (guidedForm.isGuidedMode) {
      switch (status) {
        case 'listening':
          return colors.error; // Red when recording
        case 'processing':
          return colors.warning; // Yellow when processing
        case 'speaking':
          return colors.success; // Green when speaking
        case 'error':
          return colors.error;
        default:
          return colors.success; // Green when idle in guided mode
      }
    }

    switch (status) {
      case 'listening':
        return colors.error; // Red when recording
      case 'processing':
        return colors.warning; // Yellow when processing
      case 'speaking':
        return colors.success; // Green when speaking
      case 'error':
        return colors.error;
      default:
        return colors.primary; // Blue when idle
    }
  };

  const getAnimationSpeed = () => {
    switch (status) {
      case 'listening':
        return 1.5; // Faster for active listening
      case 'processing':
        return 1.2; // Medium speed for processing
      case 'speaking':
        return 1.0; // Normal speed for speaking
      default:
        return 0.8; // Slower idle animation
    }
  };

  const isDisabled = status === 'processing' || status === 'speaking';

  const handlePress = async () => {
    if (isDisabled) return;
    await handleMicPress();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Haptic feedback when drag starts
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (event.nativeEvent.state === State.END) {
      const { translationX: tx, translationY: ty } = event.nativeEvent;

      // Update last offset
      lastOffset.current = {
        x: lastOffset.current.x + tx,
        y: lastOffset.current.y + ty,
      };

      // Reset translation and set new offset
      translateX.setOffset(lastOffset.current.x);
      translateX.setValue(0);
      translateY.setOffset(lastOffset.current.y);
      translateY.setValue(0);
    }
  };

  const onTapHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      handlePress();
    }
  };

  const onLongPressHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      handleLongPress();
    }
  };

  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      simultaneousHandlers={[tapRef, longPressRef]}
      minDist={10}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX },
              { translateY },
              { scale: status === 'listening' ? pulseAnim : 1 },
            ],
          },
        ]}
      >
        <TapGestureHandler
          ref={longPressRef}
          onHandlerStateChange={onLongPressHandlerStateChange}
          minDurationMs={400}
          simultaneousHandlers={panRef}
        >
          <TapGestureHandler
            ref={tapRef}
            onHandlerStateChange={onTapHandlerStateChange}
            simultaneousHandlers={[panRef, longPressRef]}
          >
            <Animated.View
              style={[styles.button, { backgroundColor: getButtonColor() }]}
            >
              <LottieView
                ref={lottieRef}
                source={require('../../assets/animations/robot.json')}
                autoPlay
                loop
                speed={getAnimationSpeed()}
                style={styles.lottieAnimation}
              />
            </Animated.View>
          </TapGestureHandler>
        </TapGestureHandler>

      {/* Recording indicator */}
      {status === 'listening' && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
        </View>
      )}

      {/* Processing indicator */}
      {status === 'processing' && (
        <View style={styles.processingIndicator}>
          <ActivityIndicator size="small" color={colors.warning} />
        </View>
      )}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 66,
    height: 66,
  },
  button: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  lottieAnimation: {
    width: 77,
    height: 77,
  },
  recordingIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  processingIndicator: {
    position: 'absolute',
    bottom: -30,
  },
});
