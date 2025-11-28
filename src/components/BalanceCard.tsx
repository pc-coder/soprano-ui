import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { formatCurrency } from '../utils/formatters';
import { Account } from '../types';

interface BalanceCardProps {
  account: Account;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ account }) => {
  // SOPRANO: Narrator mode - comment on balance and spending patterns
  return (
    <Card style={styles.card}>
      <Text style={styles.accountType}>{account.type} Account</Text>
      <Text style={styles.balance}>{formatCurrency(account.balance)}</Text>
      <View style={styles.detailsRow}>
        <Text style={styles.accountNumber}>{account.maskedNumber}</Text>
        <Text style={styles.bankName}>{account.bankName}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  accountType: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  balance: {
    ...typography.h1,
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountNumber: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  },
  bankName: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  },
});
