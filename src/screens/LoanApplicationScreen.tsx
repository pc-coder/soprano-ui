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
  const addressLine1Ref = useRef<TextInput>(null);
  const addressLine2Ref = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const pincodeRef = useRef<TextInput>(null);
  const panNumberRef = useRef<TextInput>(null);

  // Form state
  const [loanAmount, setLoanAmount] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [errors, setErrors] = useState<{
    loanAmount?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
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
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      panNumber,
      errors,
      focusedField,
    });
  }, [loanAmount, addressLine1, addressLine2, city, state, pincode, panNumber, errors, focusedField]);

  useEffect(() => {
    // Register form refs for guided mode
    registerFormRefs({
      loanAmountRef,
      addressLine1Ref,
      addressLine2Ref,
      cityRef,
      stateRef,
      pincodeRef,
      panNumberRef,
    });

    // Register form handlers for guided mode
    registerFormHandlers({
      setLoanAmount,
      setAddressLine1,
      setAddressLine2,
      setCity,
      setState,
      setPincode,
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
      setErrors((prev) => ({ ...prev, loanAmount: 'Minimum loan amount is ₹10,000' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, loanAmount: undefined }));
    return true;
  };

  const validateAddressLine1 = () => {
    if (!addressLine1.trim()) {
      setErrors((prev) => ({ ...prev, addressLine1: 'Address is required' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, addressLine1: undefined }));
    return true;
  };

  const validateCity = () => {
    if (!city.trim()) {
      setErrors((prev) => ({ ...prev, city: 'City is required' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, city: undefined }));
    return true;
  };

  const validateState = () => {
    if (!state.trim()) {
      setErrors((prev) => ({ ...prev, state: 'State is required' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, state: undefined }));
    return true;
  };

  const validatePincode = () => {
    if (!pincode.trim()) {
      setErrors((prev) => ({ ...prev, pincode: 'Pincode is required' }));
      return false;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setErrors((prev) => ({ ...prev, pincode: 'Pincode must be 6 digits' }));
      return false;
    }
    setErrors((prev) => ({ ...prev, pincode: undefined }));
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
    const isAddressValid = validateAddressLine1();
    const isCityValid = validateCity();
    const isStateValid = validateState();
    const isPincodeValid = validatePincode();
    const isPanValid = validatePanNumber();

    if (isLoanAmountValid && isAddressValid && isCityValid && isStateValid && isPincodeValid && isPanValid) {
      // Navigate to confirmation screen or show success message
      // For now, just navigate back to dashboard
      navigation.goBack();
    }
  };

  const isFormValid =
    loanAmount.trim() !== '' &&
    addressLine1.trim() !== '' &&
    city.trim() !== '' &&
    state.trim() !== '' &&
    pincode.trim() !== '' &&
    panNumber.trim() !== '' &&
    !errors.loanAmount &&
    !errors.addressLine1 &&
    !errors.city &&
    !errors.state &&
    !errors.pincode &&
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
            label="Address Line 1"
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="House/Flat No., Building Name"
            error={errors.addressLine1}
            onFocus={() => setFocusedField('addressLine1')}
            onBlur={() => {
              validateAddressLine1();
              setFocusedField(null);
            }}
            inputRef={addressLine1Ref}
            isGuidedActive={isFieldGuidedActive('addressLine1')}
          />
          <View style={{ height: spacing.md }} />
          <InputField
            label="Address Line 2"
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Street, Area, Locality (Optional)"
            onFocus={() => setFocusedField('addressLine2')}
            onBlur={() => setFocusedField(null)}
            inputRef={addressLine2Ref}
            isGuidedActive={isFieldGuidedActive('addressLine2')}
          />
          <View style={{ height: spacing.md }} />
          <InputField
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            error={errors.city}
            onFocus={() => setFocusedField('city')}
            onBlur={() => {
              validateCity();
              setFocusedField(null);
            }}
            inputRef={cityRef}
            isGuidedActive={isFieldGuidedActive('city')}
          />
          <View style={{ height: spacing.md }} />
          <InputField
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="Enter state"
            error={errors.state}
            onFocus={() => setFocusedField('state')}
            onBlur={() => {
              validateState();
              setFocusedField(null);
            }}
            inputRef={stateRef}
            isGuidedActive={isFieldGuidedActive('state')}
          />
          <View style={{ height: spacing.md }} />
          <InputField
            label="Pincode"
            value={pincode}
            onChangeText={setPincode}
            placeholder="6-digit pincode"
            keyboardType="numeric"
            maxLength={6}
            error={errors.pincode}
            onFocus={() => setFocusedField('pincode')}
            onBlur={() => {
              validatePincode();
              setFocusedField(null);
            }}
            inputRef={pincodeRef}
            isGuidedActive={isFieldGuidedActive('pincode')}
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
