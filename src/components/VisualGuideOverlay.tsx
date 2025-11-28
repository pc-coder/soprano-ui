import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { useVisualGuide } from '../context/VisualGuideContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const VisualGuideOverlay: React.FC = () => {
  const { isGuiding, instruction, elementPosition, hideGuide } = useVisualGuide();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fade in/out animation
  useEffect(() => {
    if (isGuiding) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isGuiding, fadeAnim]);

  // Pulse animation for circle
  useEffect(() => {
    if (isGuiding) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isGuiding, pulseAnim]);

  if (!isGuiding || !elementPosition) {
    return null;
  }

  const { x, y, width, height } = elementPosition;

  // Calculate spotlight hole
  const spotlightPadding = 8;
  const spotlightX = x - spotlightPadding;
  const spotlightY = y - spotlightPadding;
  const spotlightWidth = width + spotlightPadding * 2;
  const spotlightHeight = height + spotlightPadding * 2;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim }]}
      pointerEvents="box-none"
    >
      {/* Dim background with cutout */}
      <TouchableWithoutFeedback onPress={hideGuide}>
        <View style={styles.dimBackground}>
          {/* Top section */}
          <View style={[styles.dimSection, { height: spotlightY }]} />

          {/* Middle section with left, cutout, right */}
          <View style={[styles.row, { height: spotlightHeight }]}>
            <View style={[styles.dimSection, { width: spotlightX }]} />
            <View style={{ width: spotlightWidth, height: spotlightHeight }} />
            <View
              style={[
                styles.dimSection,
                { width: SCREEN_WIDTH - spotlightX - spotlightWidth },
              ]}
            />
          </View>

          {/* Bottom section */}
          <View
            style={[
              styles.dimSection,
              { height: SCREEN_HEIGHT - spotlightY - spotlightHeight },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Pulsing circle around element */}
      <Animated.View
        style={[
          styles.highlightCircle,
          {
            left: spotlightX,
            top: spotlightY,
            width: spotlightWidth,
            height: spotlightHeight,
            borderRadius: spotlightWidth / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
        pointerEvents="none"
      />

      {/* Instruction text at bottom */}
      <View style={styles.instructionContainer} pointerEvents="none">
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>{instruction}</Text>
          <Text style={styles.dismissHint}>Tap anywhere to dismiss</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  dimBackground: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  dimSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  highlightCircle: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  instructionBox: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instructionText: {
    ...typography.body,
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  dismissHint: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});
