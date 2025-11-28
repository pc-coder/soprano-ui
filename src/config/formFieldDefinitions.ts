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
      prompt: "What's the UPI ID you'd like to send money to using UPI? For example, name at paytm or name at phonepe.",
      validation: (value: string) => validateUPIId(value),
      required: true,
      refName: 'upiIdRef',
      type: 'email',
    },
    {
      name: 'amount',
      label: 'Amount',
      prompt: 'How many rupees would you like to send?',
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
      prompt: "Would you like to add a note for this UPI payment? You can say 'skip' if you don't want to add one.",
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
      prompt: 'How many rupees would you like to apply for as a loan?',
      validation: (value: string) => {
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
          return { valid: false, error: 'Please enter a valid amount' };
        }
        if (amount < 10000) {
          return { valid: false, error: 'Minimum loan amount is 10,000 rupees' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'loanAmountRef',
      type: 'number',
    },
    {
      name: 'address',
      label: 'Address',
      prompt: 'What is your complete address in India? Please include house number, street, area, city, state, and pincode.',
      validation: (value: string) => {
        if (!value.trim()) {
          return { valid: false, error: 'Address is required' };
        }
        if (value.length < 20) {
          return { valid: false, error: 'Please provide complete address' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'addressRef',
      type: 'text',
    },
    {
      name: 'panNumber',
      label: 'PAN Number',
      prompt: 'What is your Indian PAN card number? It should be in the format A B C D E 1 2 3 4 F.',
      validation: (value: string) => {
        if (!value.trim()) {
          return { valid: false, error: 'PAN number is required' };
        }
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) {
          return { valid: false, error: 'Invalid PAN format, for example A B C D E 1 2 3 4 F' };
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
