import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useScreenContext } from '../context/ScreenContext';
import { useGuidedForm } from '../context/GuidedFormContext';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { Soprano } from '../components/Soprano';
import { GuidedModeIndicator } from '../components/GuidedModeIndicator';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

type LoanApplicationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LoanApplication'
>;

interface Props {
  navigation: LoanApplicationScreenNavigationProp;
}

const LoanApplicationScreen: React.FC<Props> = ({ navigation }) => {
  const { setCurrentScreen, updateFormState, registerFormRefs, registerFormHandlers } = useScreenContext();
  const guidedForm = useGuidedForm();

  // Refs for all input fields
  const loanAmountRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const panNumberRef = useRef<TextInput>(null);

  // Form state
  const [loanAmount, setLoanAmount] = useState('');
  const [address, setAddress] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [errors, setErrors] = useState<{
    loanAmount?: string;
    address?: string;
    panNumber?: string;
  }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setCurrentScreen('LoanApplication');
  }, []);

  useEffect(() => {
    // Update form state for Soprano context
    updateFormState({
      loanAmount,
      address,
      panNumber,
      errors,
      focusedField,
    });
  }, [loanAmount, address, panNumber, errors, focusedField]);

  useEffect(() => {
    // Register form refs for guided mode
    registerFormRefs({
      loanAmountRef,
      addressRef,
      panNumberRef,
    });

    // Register form handlers for guided mode
    registerFormHandlers({
      setLoanAmount,
      setAddress,
      setPanNumber,
      handleSubmit,
    });
  }, []);

  const validateLoanAmount = () => {
    const amount = parseFloat(loanAmount);
    if (!loanAmount.trim()) {
      setErrors((prev) => ({ ...prev, loanAmount: 'Loan amount is required' }));
      return false;
    }
    if (isNaN(amount) || amount <= 0) {
      setErrors((prev) => ({ ...prev, loanAmount: 'Please enter a valid amount' }));
      return false;
    }
    if (amount < 10000) {
      setErrors((prev) => ({ ...prev, loanAmount: 'Minimum loan amount is 10,000 rupees' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, loanAmount: undefined }));
    return true;
  };

  const validateAddress = () => {
    if (!address.trim()) {
      setErrors((prev) => ({ ...prev, address: 'Address is required' }));
      return false;
    }
    if (address.length < 20) {
      setErrors((prev) => ({ ...prev, address: 'Please provide complete address' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, address: undefined }));
    return true;
  };

  const validatePanNumber = () => {
    if (!panNumber.trim()) {
      setErrors((prev) => ({ ...prev, panNumber: 'PAN number is required' }));
      return false;
    }
    // PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      setErrors((prev) => ({ ...prev, panNumber: 'Invalid PAN format (e.g., ABCDE1234F)' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, panNumber: undefined }));
    return true;
  };

  const handleSubmit = () => {
    const isLoanAmountValid = validateLoanAmount();
    const isAddressValid = validateAddress();
    const isPanValid = validatePanNumber();

    if (isLoanAmountValid && isAddressValid && isPanValid) {
      // Navigate to confirmation screen or show success message
      // For now, just navigate back to dashboard
      navigation.goBack();
    }
  };

  const isFormValid =
    loanAmount.trim() !== '' &&
    address.trim() !== '' &&
    panNumber.trim() !== '' &&
    !errors.loanAmount &&
    !errors.address &&
    !errors.panNumber;

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
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <InputField
            label="Loan Amount"
            value={loanAmount}
            onChangeText={setLoanAmount}
            placeholder="Enter loan amount"
            keyboardType="numeric"
            prefix="₹"
            error={errors.loanAmount}
            onFocus={() => setFocusedField('loanAmount')}
            onBlur={() => {
              validateLoanAmount();
              setFocusedField(null);
            }}
            inputRef={loanAmountRef}
            isGuidedActive={isFieldGuidedActive('loanAmount')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <InputField
            label="Complete Address"
            value={address}
            onChangeText={setAddress}
            placeholder="House No., Street, Area, City, State, Pincode"
            multiline
            numberOfLines={4}
            error={errors.address}
            onFocus={() => setFocusedField('address')}
            onBlur={() => {
              validateAddress();
              setFocusedField(null);
            }}
            inputRef={addressRef}
            isGuidedActive={isFieldGuidedActive('address')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAN Details</Text>
          <InputField
            label="PAN Number"
            value={panNumber}
            onChangeText={(text) => setPanNumber(text.toUpperCase())}
            placeholder="ABCDE1234F"
            autoCapitalize="characters"
            maxLength={10}
            error={errors.panNumber}
            onFocus={() => setFocusedField('panNumber')}
            onBlur={() => {
              validatePanNumber();
              setFocusedField(null);
            }}
            inputRef={panNumberRef}
            isGuidedActive={isFieldGuidedActive('panNumber')}
          />
        </View>

        <Button
          title="Submit Application"
          onPress={handleSubmit}
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
});

export default LoanApplicationScreen;
