export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  accounts: Account[];
  upiId: string;
}

export interface Account {
  id: string;
  type: 'Savings' | 'Current';
  number: string;
  maskedNumber: string;  // ****7890
  balance: number;
  bankName: string;
  ifsc: string;
}

export interface Transaction {
  id: string;
  name: string;
  description?: string;
  amount: number;  // negative for debit, positive for credit
  date: string;    // ISO string
  category: TransactionCategory;
  icon: string;    // emoji
  upiId?: string;
  status: 'completed' | 'pending' | 'failed';
}

export type TransactionCategory =
  | 'food'
  | 'shopping'
  | 'transport'
  | 'entertainment'
  | 'utilities'
  | 'investment'
  | 'income'
  | 'transfer'
  | 'other';

export interface Payee {
  id: string;
  name: string;
  upiId: string;
  avatar?: string;  // initials or emoji
  isNew: boolean;   // first time paying
  lastPaid?: string;
}

export interface PaymentData {
  upiId: string;
  amount: number;
  note?: string;
  recipientName?: string;
  isNewRecipient: boolean;
}

// For screen context (Soprano integration)
export interface ScreenContext {
  screenName: string;
  params?: Record<string, any>;
  formState?: Record<string, any>;
  visibleData?: Record<string, any>;
  scrollPosition?: number;
}
