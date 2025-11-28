import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface TransactionCommentaryProps {
  isActive: boolean;
  isSpeaking: boolean;
}

export const TransactionCommentary: React.FC<TransactionCommentaryProps> = ({
  isActive,
  isSpeaking,
}) => {
  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, isSpeaking && styles.indicatorSpeaking]}>
        <Ionicons
          name={isSpeaking ? 'mic' : 'mic-outline'}
          size={16}
          color={isSpeaking ? colors.error : colors.warning}
        />
        <Text style={styles.text}>
          {isSpeaking ? 'Commentary...' : 'Scroll to hear commentary'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  indicatorSpeaking: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  text: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
});
