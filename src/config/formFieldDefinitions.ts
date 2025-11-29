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
      description: 'The recipient\'s UPI address for receiving payment',
      helpText: 'A UPI ID is a unique virtual payment address linked to a bank account. It typically looks like yourname@paytm, mobile@ybl, or username@oksbi.',
      tips: [
        'Always verify the UPI ID with the recipient before sending money',
        'UPI IDs are not case-sensitive',
        'Common UPI handles include @paytm, @phonepe, @ybl, @okaxis, @oksbi',
      ],
      examples: ['john@paytm', '9876543210@ybl', 'merchant.store@okicici'],
      clarifications: {
        'what is upi': 'UPI is India\'s instant payment system. A UPI ID is like an email address for receiving money.',
        'is it safe': 'Yes, UPI is secure and NPCI-regulated. Always verify the recipient\'s UPI ID before sending.',
        'what if wrong upi': 'Always double-check before confirming. Wrong transfers are hard to recover.',
      },
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
      description: 'The amount of money to transfer',
      helpText: 'Enter the exact amount you want to send in Indian Rupees. Make sure you have sufficient balance in your account.',
      tips: [
        'UPI has a transaction limit of ₹1,00,000 per transaction',
        'Some banks may have lower daily limits',
        'Check your account balance before making large transfers',
      ],
      examples: ['500', '1000', '5000', '25000'],
      clarifications: {
        'what is the limit': 'UPI allows up to 1 lakh rupees per transaction, but your bank may have lower daily limits.',
        'can i send decimals': 'Yes, you can send decimal amounts like 100.50 rupees.',
        'will there be charges': 'Person-to-person UPI transfers are usually free. Merchant payments may have charges.',
      },
    },
    {
      name: 'note',
      label: 'Note',
      prompt: "Would you like to add a note for this UPI payment? You can say 'skip' if you don't want to add one.",
      validation: undefined,
      required: false,
      refName: 'noteRef',
      type: 'text',
      description: 'Optional message or description for the payment',
      helpText: 'Add a note to help you and the recipient remember what this payment was for. This is optional and can be left blank.',
      tips: [
        'Notes help track expenses and remind recipients about the payment purpose',
        'Keep notes brief and clear',
        'Avoid sharing sensitive information in payment notes',
      ],
      examples: ['Dinner split', 'Rent for January', 'Birthday gift', 'Movie tickets'],
      clarifications: {
        'is note required': 'No, notes are completely optional. You can skip this field.',
        'can recipient see note': 'Yes, recipients can see your note in their transaction history.',
      },
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
      description: 'The total amount of money you want to borrow',
      helpText: 'Choose a loan amount based on your needs and repayment capacity. Consider your monthly income and existing financial obligations when deciding.',
      tips: [
        'Only borrow what you actually need to avoid paying unnecessary interest',
        'Consider processing fees and other charges in addition to the loan amount',
        'Higher loan amounts may require additional documentation or collateral',
        'Minimum loan amount is ₹10,000',
      ],
      examples: ['50000', '100000', '500000', '1000000'],
      clarifications: {
        'how much should i borrow': 'Borrow only what you need. Your total EMIs should not exceed 40-50% of monthly income.',
        'what is the maximum': 'Maximum depends on your income and credit score. Personal loans typically range from 10,000 to 40,00,000 rupees.',
        'can i change later': 'No, you cannot change after approval, but you can apply for a top-up loan later if needed.',
      },
    },
    {
      name: 'emiTenure',
      label: 'EMI Tenure',
      prompt: 'For how many months would you like to repay the loan? The minimum is 6 months and maximum is 360 months.',
      validation: (value: string) => {
        const tenure = parseInt(value);
        if (isNaN(tenure) || tenure <= 0) {
          return { valid: false, error: 'Please enter a valid tenure' };
        }
        if (tenure < 6) {
          return { valid: false, error: 'Minimum tenure is 6 months' };
        }
        if (tenure > 360) {
          return { valid: false, error: 'Maximum tenure is 360 months' };
        }
        return { valid: true };
      },
      required: true,
      refName: 'emiTenureRef',
      type: 'number',
      description: 'The duration over which you will repay the loan in monthly installments (EMIs)',
      helpText: 'The tenure affects your monthly EMI amount and total interest paid. Shorter tenures mean higher EMIs but less total interest. Longer tenures mean lower EMIs but more total interest.',
      tips: [
        'Choose a tenure that balances affordable monthly payments with reasonable total interest',
        'Shorter tenure (12-24 months): Higher EMI, less total interest, faster debt-free',
        'Medium tenure (24-60 months): Balanced EMI, moderate interest, suitable for most borrowers',
        'Longer tenure (60-360 months): Lower EMI, higher total interest, suitable for large loans',
      ],
      examples: ['12', '24', '36', '48', '60'],
      clarifications: {
        'shorter vs longer tenure': 'Shorter tenure means higher monthly EMI but less total interest and faster debt freedom. Longer tenure means lower monthly EMI but much higher total interest cost.',
        'what tenure should i choose': 'Choose shorter tenure if you can afford higher EMIs to save on interest. Choose longer if you need affordable monthly payments.',
        'can i prepay': 'Yes, most loans allow early repayment to save interest, though some may charge a small prepayment fee.',
        'what is emi': 'EMI is your fixed monthly payment that includes both principal and interest.',
        'how is interest calculated': 'Interest is calculated on reducing balance, so early EMIs have more interest and later ones have more principal.',
      },
    },
    {
      name: 'address',
      label: 'Address',
      prompt: 'What is your complete address in India? You can tell me verbally, or if you have a document like Aadhaar card, just say scan and I will use the camera.',
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
      description: 'Your current residential address in India',
      helpText: 'Provide your complete permanent or current residential address. This should match your address proof documents like Aadhaar card, passport, or utility bills.',
      tips: [
        'Include house/flat number, building/society name, street, area, city, state, and PIN code',
        'The address should be at least 20 characters long',
        'You can dictate your address or say "scan" to extract it from your Aadhaar card using the camera',
        'Ensure the address matches your official documents for verification',
      ],
      examples: [
        '123 Green Park, MG Road, Bangalore, Karnataka 560001',
        'Flat 4B, Orchid Towers, Sector 15, Noida, Uttar Pradesh 201301',
        '45 Beach Road, Marine Drive, Mumbai, Maharashtra 400002',
      ],
      clarifications: {
        'permanent or current': 'Either is fine, but it must match your proof documents like Aadhaar or utility bills.',
        'how detailed': 'Include house number, building, street, area, city, state, and PIN code for completeness.',
        'can i use office address': 'Use residential address as it matches most identity documents and is easier to verify.',
        'what if i recently moved': 'Provide current address but ensure you have recent proof like utility bills or rental agreement.',
      },
    },
    {
      name: 'panNumber',
      label: 'PAN Number',
      prompt: 'What is your Indian PAN card number? You can tell me the number, or say scan to capture it from your PAN card using the camera.',
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
      description: 'Your Permanent Account Number issued by the Income Tax Department of India',
      helpText: 'PAN is a 10-character alphanumeric identifier mandatory for all financial transactions in India. It consists of 5 letters, 4 numbers, and 1 letter (e.g., ABCDE1234F).',
      tips: [
        'PAN format: 5 letters + 4 digits + 1 letter (total 10 characters)',
        'PAN is case-insensitive, but typically written in uppercase',
        'You can dictate the PAN number or say "scan" to capture it from your PAN card using the camera',
        'The PAN name should match the loan applicant name for verification',
      ],
      examples: ['ABCDE1234F', 'BQXPA2468K', 'AKMPR7894C'],
      clarifications: {
        'what is pan': 'PAN is a 10-digit tax identifier issued by Income Tax Department, mandatory for all loans and financial transactions.',
        'why is it needed': 'Required for KYC compliance and credit verification. All loans need PAN verification.',
        'what if i dont have pan': 'Apply online at NSDL or UTIITSL websites. Takes 15-20 days to receive.',
        'how to find my pan': 'Check your PAN card, Form 16, or Income Tax Returns. You can also verify online using Aadhaar.',
        'is it safe to share': 'Yes, it\'s safe with authorized financial institutions. Only share with legitimate lenders.',
      },
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
