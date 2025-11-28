import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGuidedForm } from '../context/GuidedFormContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export const GuidedModeIndicator: React.FC = () => {
  const guidedForm = useGuidedForm();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (guidedForm.isGuidedMode) {
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
  }, [guidedForm.isGuidedMode, fadeAnim]);

  if (!guidedForm.isGuidedMode) {
    return null;
  }

  const progress = guidedForm.getProgress();
  const currentField = guidedForm.getCurrentField();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <MaterialCommunityIcons name="microphone-message" size={20} color="#fff" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Voice Guided Mode</Text>
            <Text style={styles.subtitle}>
              Step {progress.current} of {progress.total}
              {currentField && ` - ${currentField.label}`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exitButton}
          onPress={guidedForm.stopGuidedMode}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${progress.percentage}%` },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  exitButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
});
