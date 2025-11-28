import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useScreenContext } from '../context/ScreenContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SopranoPlaceholder } from '../components/SopranoPlaceholder';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

type UPISuccessScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UPISuccess'
>;

type UPISuccessScreenRouteProp = RouteProp<RootStackParamList, 'UPISuccess'>;

interface Props {
  navigation: UPISuccessScreenNavigationProp;
  route: UPISuccessScreenRouteProp;
}

const UPISuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { amount, recipientName, upiId, transactionId, timestamp } = route.params;
  const { setCurrentScreen, updateScreenData } = useScreenContext();

  useEffect(() => {
    setCurrentScreen('UPISuccess');
    updateScreenData({
      transactionId,
      amount,
      recipientName,
    });

    // SOPRANO: Narrator mode - confirm success and new balance
  }, []);

  const handleBackToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      })
    );
  };

  const handleShareReceipt = () => {
    Alert.alert('Share Receipt', 'Receipt sharing feature coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>

        <Text style={styles.successTitle}>Payment Successful</Text>

        <Text style={styles.amount}>{formatCurrency(amount)}</Text>

        <Text style={styles.sentTo}>sent to</Text>
        <Text style={styles.recipientName}>{recipientName}</Text>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{transactionId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>UPI ID</Text>
            <Text style={styles.detailValue}>{upiId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{formatDateTime(timestamp)}</Text>
          </View>
        </Card>

        <View style={styles.buttonsContainer}>
          <Button
            title="Share Receipt"
            onPress={handleShareReceipt}
            variant="outline"
            fullWidth
          />
          <View style={{ height: spacing.md }} />
          <Button
            title="Back to Home"
            onPress={handleBackToHome}
            variant="primary"
            fullWidth
          />
        </View>
      </View>

      <SopranoPlaceholder />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing.md,
  },
  sentTo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  recipientName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  detailsCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  buttonsContainer: {
    width: '100%',
  },
});

export default UPISuccessScreen;
