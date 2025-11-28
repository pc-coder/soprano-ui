import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface QuickAction {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  id?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  elementRefs?: Record<string, React.RefObject<View>>;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, elementRefs }) => {
  return (
    <View style={styles.container}>
      {actions.map((action, index) => {
        const elementRef = action.id && elementRefs ? elementRefs[action.id] : undefined;

        return (
          <View
            key={index}
            ref={elementRef}
            collapsable={false}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={action.icon}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.label}>{action.label}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
