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
