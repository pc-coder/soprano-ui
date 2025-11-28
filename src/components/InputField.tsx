import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
  TextInputProps,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useScreenContext } from '../context/ScreenContext';

interface InputFieldProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  warning?: string;
  prefix?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<TextInput>;
  isGuidedActive?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error,
  warning,
  prefix,
  maxLength,
  autoCapitalize = 'none',
  onFocus,
  onBlur,
  inputRef,
  isGuidedActive = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const containerRef = useRef<View>(null);
  const { scrollViewRef } = useScreenContext();

  // Pulse animation and auto-scroll when field is active in guided mode
  useEffect(() => {
    if (isGuidedActive) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
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

      // Glow effect
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Auto-scroll to field
      if (containerRef.current && scrollViewRef?.current) {
        setTimeout(() => {
          containerRef.current?.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              console.log('[InputField] Scrolling to field at y:', y);
              scrollViewRef.current?.scrollTo({
                y: Math.max(0, y - 100), // Scroll with 100px offset from top
                animated: true,
              });
            },
            () => {
              console.log('[InputField] Failed to measure field position');
            }
          );
        }, 100); // Small delay to ensure layout is ready
      }
    } else {
      pulseAnim.setValue(1);
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isGuidedActive, pulseAnim, glowAnim, scrollViewRef]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.success],
  });

  const backgroundColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0)', 'rgba(76, 175, 80, 0.1)'],
  });

  return (
    <Animated.View
      ref={containerRef}
      style={[styles.container, { transform: [{ scale: pulseAnim }] }]}
    >
      {isGuidedActive && (
        <View style={styles.guidedBadge}>
          <Text style={styles.guidedBadgeText}>🎤 Listening</Text>
        </View>
      )}
      <Text style={[styles.label, isGuidedActive && styles.labelActive]}>{label}</Text>
      <Animated.View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          isGuidedActive && {
            borderColor,
            backgroundColor,
            borderWidth: 2,
          },
        ]}
      >
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          ref={inputRef}
          style={[styles.input, prefix && styles.inputWithPrefix]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {warning && !error && <Text style={styles.warningText}>{warning}</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  guidedBadge: {
    position: 'absolute',
    top: -8,
    right: 0,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  guidedBadgeText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.success,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  prefix: {
    ...typography.body,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  inputWithPrefix: {
    paddingLeft: 0,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  },
});
