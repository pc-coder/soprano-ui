import { FormFieldDefinition } from '../context/GuidedFormContext';
import { validateUPIId, validateAmount } from '../utils/validation';

/**
 * Form field definitions for guided form filling mode
 */
export const FORM_FIELD_DEFINITIONS: Record<string, FormFieldDefinition[]> = {
  UPIPayment: [
    {
      name: 'upiId',
      label: 'UPI ID',
      prompt: "What's the UPI ID you'd like to send money to?",
      validation: (value: string) => validateUPIId(value),
      required: true,
      refName: 'upiIdRef',
      type: 'email',
    },
    {
      name: 'amount',
      label: 'Amount',
      prompt: 'How much would you like to send?',
      validation: (value: string, formData?: Record<string, any>) => {
        const amountNum = typeof value === 'string' ? parseFloat(value) : value;
        const balance = formData?.balance || 50000; // Default balance or get from context
        return validateAmount(amountNum, balance);
      },
      required: true,
      refName: 'amountRef',
      type: 'number',
    },
    {
      name: 'note',
      label: 'Note',
      prompt: "Would you like to add a note? You can say 'skip' if you don't want to add one.",
      validation: undefined,
      required: false,
      refName: 'noteRef',
      type: 'text',
    },
  ],
  LoanApplication: [
    {
      name: 'loanAmount',
      label: 'Loan Amount',
      prompt: 'How much loan amount would you like to apply for?',
      validation: (value: string) => {
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
          return { valid: false, error: 'Please enter a valid amount' };
        }
        if (amount < 10000) {
          return { valid: false, error: 'Minimum loan amount is ₹10,000' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'loanAmountRef',
      type: 'number',
    },
    {
      name: 'addressLine1',
      label: 'Address Line 1',
      prompt: 'What is your house or flat number and building name?',
      validation: (value: string) => {
        if (!value.trim()) {
          return { valid: false, error: 'Address is required' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'addressLine1Ref',
      type: 'text',
    },
    {
      name: 'addressLine2',
      label: 'Address Line 2',
      prompt: "What is your street, area, and locality? You can say 'skip' if you don't want to add one.",
      validation: undefined,
      required: false,
      refName: 'addressLine2Ref',
      type: 'text',
    },
    {
      name: 'city',
      label: 'City',
      prompt: 'What is your city?',
      validation: (value: string) => {
        if (!value.trim()) {
          return { valid: false, error: 'City is required' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'cityRef',
      type: 'text',
    },
    {
      name: 'state',
      label: 'State',
      prompt: 'What is your state?',
      validation: (value: string) => {
        if (!value.trim()) {
          return { valid: false, error: 'State is required' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'stateRef',
      type: 'text',
    },
    {
      name: 'pincode',
      label: 'Pincode',
      prompt: 'What is your 6-digit pincode?',
      validation: (value: string) => {
        if (!value.trim()) {
          return { valid: false, error: 'Pincode is required' };
        }
        if (!/^\d{6}$/.test(value)) {
          return { valid: false, error: 'Pincode must be 6 digits' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'pincodeRef',
      type: 'number',
    },
    {
      name: 'panNumber',
      label: 'PAN Number',
      prompt: 'What is your PAN number?',
      validation: (value: string) => {
        if (!value.trim()) {
          return { valid: false, error: 'PAN number is required' };
        }
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) {
          return { valid: false, error: 'Invalid PAN format (e.g., ABCDE1234F)' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'panNumberRef',
      type: 'text',
    },
  ],
};

/**
 * Get field definitions for a specific screen
 */
export const getFormFieldsForScreen = (screenName: string): FormFieldDefinition[] => {
  return FORM_FIELD_DEFINITIONS[screenName] || [];
};

/**
 * Check if a screen has guided form support
 */
export const hasGuidedFormSupport = (screenName: string): boolean => {
  return screenName in FORM_FIELD_DEFINITIONS;
};
