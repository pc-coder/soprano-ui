import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useApp } from '../context/AppContext';
import { useScreenContext } from '../context/ScreenContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Soprano } from '../components/Soprano';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { formatCurrency, generateTransactionId } from '../utils/formatters';

type UPIConfirmScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UPIConfirm'
>;

type UPIConfirmScreenRouteProp = RouteProp<RootStackParamList, 'UPIConfirm'>;

interface Props {
  navigation: UPIConfirmScreenNavigationProp;
  route: UPIConfirmScreenRouteProp;
}

const UPIConfirmScreen: React.FC<Props> = ({ navigation, route }) => {
  const { upiId, amount, note, recipientName, isNewRecipient } = route.params;
  const { user } = useApp();
  const { setCurrentScreen, updateScreenData } = useScreenContext();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentScreen('UPIConfirm');
    updateScreenData({
      upiId,
      amount,
      recipientName,
      isNewRecipient,
    });
  }, []);

  const handlePay = async () => {
    // SOPRANO: Guide mode - warn about first-time recipient
    setLoading(true);

    // Simulate payment processing delay
    setTimeout(() => {
      const transactionId = generateTransactionId();
      const timestamp = new Date().toISOString();

      navigation.replace('UPISuccess', {
        amount,
        recipientName,
        upiId,
        transactionId,
        timestamp,
      });
    }, 2000);
  };

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(recipientName)}</Text>
          </View>
        </View>

        <Text style={styles.recipientName}>{recipientName}</Text>
        <Text style={styles.upiId}>{upiId}</Text>

        <Text style={styles.amount}>{formatCurrency(amount)}</Text>

        {isNewRecipient && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningBadgeText}>⚠️ First-time recipient</Text>
          </View>
        )}

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From</Text>
            <View style={styles.detailValue}>
              <Text style={styles.detailValueText}>
                {user.accounts[0].type} Account
              </Text>
              <Text style={styles.detailValueSubtext}>
                {user.accounts[0].maskedNumber}
              </Text>
            </View>
          </View>

          {note && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Note</Text>
              <Text style={styles.detailValueText}>{note}</Text>
            </View>
          )}
        </Card>

        <Button
          title={`Pay ${formatCurrency(amount)}`}
          onPress={handlePay}
          loading={loading}
          disabled={loading}
          fullWidth
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <Soprano />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: '#fff',
    fontWeight: '700',
  },
  recipientName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  upiId: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  warningBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },
  warningBadgeText: {
    ...typography.bodySmall,
    color: '#856404',
    fontWeight: '600',
  },
  detailsCard: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    alignItems: 'flex-end',
  },
  detailValueText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  detailValueSubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default UPIConfirmScreen;
