// Element definitions for visual navigation guidance
// Each element represents an interactive UI component that can be highlighted

export interface ElementDefinition {
  id: string;
  label: string;
  description: string;
  keywords: string[];
}

export const SCREEN_ELEMENTS: Record<string, ElementDefinition[]> = {
  Dashboard: [
    {
      id: 'pay-button',
      label: 'Pay',
      description: 'Make a UPI payment',
      keywords: ['pay', 'send', 'money', 'transfer', 'payment', 'upi'],
    },
    {
      id: 'scan-button',
      label: 'Scan',
      description: 'Scan QR code for payment',
      keywords: ['scan', 'qr', 'code', 'camera'],
    },
    {
      id: 'history-button',
      label: 'History',
      description: 'View transaction history',
      keywords: ['history', 'transaction', 'transactions', 'past', 'previous', 'view'],
    },
    {
      id: 'more-button',
      label: 'More',
      description: 'More options',
      keywords: ['more', 'options', 'settings', 'menu'],
    },
    {
      id: 'balance-card',
      label: 'Balance',
      description: 'View account balance',
      keywords: ['balance', 'account', 'money', 'funds'],
    },
    {
      id: 'transactions-list',
      label: 'Recent Transactions',
      description: 'View recent transactions',
      keywords: ['recent', 'transactions', 'activity'],
    },
  ],

  Transactions: [
    {
      id: 'transactions-list',
      label: 'Transaction List',
      description: 'View all transactions',
      keywords: ['transactions', 'list', 'all', 'view'],
    },
  ],

  UPIPayment: [
    {
      id: 'upi-id-field',
      label: 'UPI ID',
      description: 'Enter recipient UPI ID',
      keywords: ['upi', 'id', 'recipient', 'enter'],
    },
    {
      id: 'amount-field',
      label: 'Amount',
      description: 'Enter payment amount',
      keywords: ['amount', 'money', 'enter', 'rupees'],
    },
    {
      id: 'note-field',
      label: 'Note',
      description: 'Add payment note',
      keywords: ['note', 'message', 'description'],
    },
    {
      id: 'continue-button',
      label: 'Continue',
      description: 'Proceed to payment confirmation',
      keywords: ['continue', 'proceed', 'next', 'submit'],
    },
  ],

  UPIConfirm: [
    {
      id: 'confirm-button',
      label: 'Confirm Payment',
      description: 'Confirm and complete payment',
      keywords: ['confirm', 'complete', 'finish', 'pay'],
    },
  ],
};

// Helper to get element definitions for a screen
export const getElementsForScreen = (screenName: string): ElementDefinition[] => {
  return SCREEN_ELEMENTS[screenName] || [];
};

// Helper to check if screen supports visual guidance
export const hasVisualGuidance = (screenName: string): boolean => {
  return screenName in SCREEN_ELEMENTS;
};
