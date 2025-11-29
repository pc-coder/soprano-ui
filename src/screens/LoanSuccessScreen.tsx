import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useScreenContext } from '../context/ScreenContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Soprano } from '../components/Soprano';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { formatCurrency } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

type LoanSuccessScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LoanSuccess'
>;

type LoanSuccessScreenRouteProp = RouteProp<RootStackParamList, 'LoanSuccess'>;

interface Props {
  navigation: LoanSuccessScreenNavigationProp;
  route: LoanSuccessScreenRouteProp;
}

const LoanSuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { loanAmount, emiTenure, applicationId } = route.params;
  const { setCurrentScreen, updateScreenData } = useScreenContext();

  // Calculate monthly EMI (simplified calculation at 12% annual interest)
  const annualRate = 0.12;
  const monthlyRate = annualRate / 12;
  const emi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) /
    (Math.pow(1 + monthlyRate, emiTenure) - 1)
  );

  useEffect(() => {
    setCurrentScreen('LoanSuccess');
    updateScreenData({
      applicationId,
      loanAmount,
      emiTenure,
      emi,
    });
  }, []);

  const handleBackToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      })
    );
  };

  const handleViewDetails = () => {
    Alert.alert('Loan Details', 'Full loan details screen coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>

        <Text style={styles.successTitle}>Application Submitted!</Text>
        <Text style={styles.subtitle}>Your loan application is under review</Text>

        <Text style={styles.amount}>{formatCurrency(loanAmount)}</Text>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Application ID</Text>
            <Text style={styles.detailValue}>{applicationId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Loan Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(loanAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>EMI Tenure</Text>
            <Text style={styles.detailValue}>{emiTenure} months</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Monthly EMI (approx.)</Text>
            <Text style={[styles.detailValue, styles.emiHighlight]}>{formatCurrency(emi)}</Text>
          </View>
        </Card>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            We'll review your application and notify you within 24-48 hours.
            You can track the status in your profile.
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            title="View Details"
            onPress={handleViewDetails}
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

      <Soprano />
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing.xl,
  },
  detailsCard: {
    width: '100%',
    marginBottom: spacing.lg,
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
  emiHighlight: {
    color: colors.primary,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xl,
    width: '100%',
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  buttonsContainer: {
    width: '100%',
  },
});

export default LoanSuccessScreen;
