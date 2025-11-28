import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useVoice } from '../context/VoiceContext';
import { useVoicePipeline } from '../hooks/useVoicePipeline';

export const Soprano: React.FC = () => {
  const { status } = useVoice();
  const { handleMicPress } = useVoicePipeline();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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

  const getButtonColor = () => {
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

  const getIcon = () => {
    switch (status) {
      case 'listening':
        return 'mic';
      case 'processing':
        return 'hourglass';
      case 'speaking':
        return 'volume-high';
      case 'error':
        return 'alert-circle';
      default:
        return 'mic';
    }
  };

  const isDisabled = status === 'processing' || status === 'speaking';

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: status === 'listening' ? pulseAnim : 1 }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: getButtonColor() }]}
        onPress={handleMicPress}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {status === 'processing' ? (
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name={getIcon()} size={28} color="#fff" />
          </Animated.View>
        ) : (
          <Ionicons name={getIcon()} size={28} color="#fff" />
        )}
      </TouchableOpacity>

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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
