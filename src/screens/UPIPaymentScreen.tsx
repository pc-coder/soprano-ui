import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useApp } from '../context/AppContext';
import { useScreenContext } from '../context/ScreenContext';
import { useGuidedForm } from '../context/GuidedFormContext';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Soprano } from '../components/Soprano';
import { GuidedModeIndicator } from '../components/GuidedModeIndicator';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { validateUPIId, validateAmount } from '../utils/validation';
import { formatCurrency } from '../utils/formatters';
import { findPayeeByUPI, isNewPayee } from '../data/mockPayees';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type UPIPaymentScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UPIPayment'
>;

interface Props {
  navigation: UPIPaymentScreenNavigationProp;
}

const UPIPaymentScreen: React.FC<Props> = ({ navigation }) => {
  const { user, balance } = useApp();
  const { setCurrentScreen, updateFormState, updateScreenData, registerFormRefs, registerFormHandlers } = useScreenContext();
  const guidedForm = useGuidedForm();

  // SOPRANO: All inputs must expose refs for AI integration
  const upiIdRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ upiId?: string; amount?: string }>({});
  const [warning, setWarning] = useState<string | undefined>();
  const [focusedField, setFocusedField] = useState<'upiId' | 'amount' | 'note' | null>(null);

  useEffect(() => {
    setCurrentScreen('UPIPayment');
  }, []);

  useEffect(() => {
    // Update form state for Soprano context
    updateFormState({
      upiId,
      amount,
      note,
      errors,
      focusedField,
    });
  }, [upiId, amount, note, errors, focusedField]);

  useEffect(() => {
    // Update screen data with balance for validation
    updateScreenData({
      balance,
    });
  }, [balance]);

  useEffect(() => {
    // Register form refs for guided mode
    registerFormRefs({
      upiIdRef,
      amountRef,
      noteRef,
    });

    // Register form handlers for guided mode
    registerFormHandlers({
      setUpiId,
      setAmount,
      setNote,
      handleUpiIdBlur,
      handleAmountBlur,
      handleContinue,
      navigation,
      balance,
    });
  }, []);

  const handleUpiIdBlur = () => {
    // SOPRANO: Guardian mode - explain error and suggest fix
    const validation = validateUPIId(upiId);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, upiId: validation.error }));
    } else {
      setErrors((prev) => ({ ...prev, upiId: undefined }));

      // Check if this is a new recipient
      if (isNewPayee(upiId)) {
        setWarning('⚠️ First-time recipient. Please verify UPI ID carefully.');
      } else {
        setWarning(undefined);
      }
    }
    setFocusedField(null);
  };

  const handleAmountBlur = () => {
    // SOPRANO: Guardian mode - explain error and suggest fix
    const amountNum = parseFloat(amount);
    const validation = validateAmount(amountNum, balance);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, amount: validation.error }));
      setWarning(undefined);
    } else {
      setErrors((prev) => ({ ...prev, amount: undefined }));
      setWarning(validation.warning);
    }
    setFocusedField(null);
  };

  const handleContinue = () => {
    const amountNum = parseFloat(amount);
    const upiValidation = validateUPIId(upiId);
    const amountValidation = validateAmount(amountNum, balance);

    if (!upiValidation.valid || !amountValidation.valid) {
      setErrors({
        upiId: upiValidation.error,
        amount: amountValidation.error,
      });
      return;
    }

    const payee = findPayeeByUPI(upiId);
    const recipientName = payee?.name || upiId.split('@')[0];
    const isNewRecipient = isNewPayee(upiId);

    navigation.navigate('UPIConfirm', {
      upiId,
      amount: amountNum,
      note: note || undefined,
      recipientName,
      isNewRecipient,
    });
  };

  const isFormValid =
    upiId.trim() !== '' &&
    amount.trim() !== '' &&
    !errors.upiId &&
    !errors.amount;

  // Check if a field is currently active in guided mode
  const isFieldGuidedActive = (fieldName: string): boolean => {
    if (!guidedForm.isGuidedMode) return false;
    const currentField = guidedForm.getCurrentField();
    return currentField?.name === fieldName;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <GuidedModeIndicator />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          guidedForm.isGuidedMode && styles.contentContainerWithGuided,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To</Text>
          <InputField
            label="UPI ID"
            value={upiId}
            onChangeText={setUpiId}
            placeholder="username@bank"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.upiId}
            onFocus={() => setFocusedField('upiId')}
            onBlur={handleUpiIdBlur}
            inputRef={upiIdRef}
            isGuidedActive={isFieldGuidedActive('upiId')}
          />
          <TouchableOpacity style={styles.scanButton} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <InputField
            label="Enter Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="numeric"
            prefix="₹"
            error={errors.amount}
            onFocus={() => setFocusedField('amount')}
            onBlur={handleAmountBlur}
            inputRef={amountRef}
            isGuidedActive={isFieldGuidedActive('amount')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From</Text>
          <Card style={styles.accountCard}>
            <Text style={styles.accountType}>{user.accounts[0].type} Account</Text>
            <Text style={styles.accountNumber}>{user.accounts[0].maskedNumber}</Text>
            <Text style={styles.availableBalance}>
              Available: {formatCurrency(balance)}
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note (Optional)</Text>
          <InputField
            label="Add a note"
            value={note}
            onChangeText={setNote}
            placeholder="What's this for?"
            maxLength={50}
            onFocus={() => setFocusedField('note')}
            onBlur={() => setFocusedField(null)}
            inputRef={noteRef}
            isGuidedActive={isFieldGuidedActive('note')}
          />
        </View>

        {warning && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        )}

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!isFormValid}
          fullWidth
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <Soprano />
    </KeyboardAvoidingView>
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
  },
  contentContainerWithGuided: {
    paddingTop: 80, // Height of GuidedModeIndicator
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  scanButtonText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  accountCard: {
    backgroundColor: colors.surface,
  },
  accountType: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  accountNumber: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  availableBalance: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    ...typography.bodySmall,
    color: '#856404',
  },
});

export default UPIPaymentScreen;
