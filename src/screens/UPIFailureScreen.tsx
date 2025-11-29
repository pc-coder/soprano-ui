import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useScreenContext } from '../context/ScreenContext';
import { useVoice } from '../context/VoiceContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Soprano } from '../components/Soprano';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { synthesizeSpeech, playAudio } from '../services/voiceService';
import { Ionicons } from '@expo/vector-icons';

type UPIFailureScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UPIFailure'
>;

type UPIFailureScreenRouteProp = RouteProp<RootStackParamList, 'UPIFailure'>;

interface Props {
  navigation: UPIFailureScreenNavigationProp;
  route: UPIFailureScreenRouteProp;
}

const UPIFailureScreen: React.FC<Props> = ({ navigation, route }) => {
  const { amount, recipientName, upiId, transactionId, timestamp } = route.params;
  const { setCurrentScreen, updateScreenData } = useScreenContext();
  const { setStatus, setCurrentSpeechText } = useVoice();
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    setCurrentScreen('UPIFailure');
    updateScreenData({
      transactionId,
      amount,
      recipientName,
      failed: true,
    });

    // Proactively reassure the user about the failed transaction
    const speakReassurance = async () => {
      if (hasSpokenRef.current) return;
      hasSpokenRef.current = true;

      const message = `I'm sorry, the payment to ${recipientName} could not be processed at this time. Please don't worry - your money is completely safe. If any amount was deducted from your account, it will be automatically refunded within 24 hours.`;

      try {
        const audioUri = await synthesizeSpeech(message);
        setCurrentSpeechText(message);
        setStatus('speaking');
        await playAudio(audioUri);
        setStatus('idle');
        setCurrentSpeechText(null);
      } catch (error) {
        console.error('[UPIFailureScreen] Error speaking reassurance:', error);
        setStatus('idle');
      }
    };

    // Small delay before speaking
    setTimeout(() => {
      speakReassurance();
    }, 500);
  }, []);

  const handleBackToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      })
    );
  };

  const handleTryAgain = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Dashboard' }, { name: 'UPIPayment' }],
      })
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.failureIconContainer}>
          <Ionicons name="close-circle" size={80} color={colors.error} />
        </View>

        <Text style={styles.failureTitle}>Payment Failed</Text>
        <Text style={styles.subtitle}>We couldn't process this transaction</Text>

        <Text style={styles.amount}>{formatCurrency(amount)}</Text>

        <Text style={styles.sentTo}>to</Text>
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
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, styles.statusFailed]}>Failed</Text>
          </View>
        </Card>

        <View style={styles.buttonsContainer}>
          <Button
            title="Try Again"
            onPress={handleTryAgain}
            variant="primary"
            fullWidth
          />
          <View style={{ height: spacing.md }} />
          <Button
            title="Back to Home"
            onPress={handleBackToHome}
            variant="outline"
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
  failureIconContainer: {
    marginBottom: spacing.lg,
  },
  failureTitle: {
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
    color: colors.error,
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
  statusFailed: {
    color: colors.error,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: spacing.xl,
  },
});

export default UPIFailureScreen;
