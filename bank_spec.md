# Soprano Bank - Mock Banking App Specification

## Overview

Build a mock banking app in **React Native Expo** that will serve as the foundation for an AI avatar assistant called "Soprano". The app should look and feel like a real Indian banking app with realistic data.

**Important:** This app will later integrate with an AI avatar. All input fields must expose refs, and screen context must be easily accessible for the AI to understand what the user is viewing.

---

## Tech Stack

- **Framework:** React Native with Expo (SDK 50+)
- **Language:** TypeScript
- **Navigation:** @react-navigation/native + @react-navigation/stack
- **State Management:** React Context API (keep it simple)
- **Styling:** StyleSheet (no external UI libraries)
- **Icons:** @expo/vector-icons (MaterialCommunityIcons, Ionicons)

---

## Project Setup

```bash
npx create-expo-app SopranoBank --template expo-template-blank-typescript
cd SopranoBank
npx expo install @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context react-native-gesture-handler
```

---

## Folder Structure

```
src/
├── navigation/
│   └── AppNavigator.tsx
├── screens/
│   ├── DashboardScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── UPIPaymentScreen.tsx
│   ├── UPIConfirmScreen.tsx
│   └── UPISuccessScreen.tsx
├── components/
│   ├── BalanceCard.tsx
│   ├── QuickActions.tsx
│   ├── TransactionItem.tsx
│   ├── TransactionList.tsx
│   ├── InputField.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   └── SopranoPlaceholder.tsx
├── context/
│   ├── AppContext.tsx
│   └── ScreenContext.tsx
├── data/
│   ├── mockUser.ts
│   ├── mockTransactions.ts
│   └── mockPayees.ts
├── utils/
│   ├── validation.ts
│   ├── formatters.ts
│   └── helpers.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
└── types/
    └── index.ts
```

---

## Theme & Styling

### Colors (`src/theme/colors.ts`)

```typescript
export const colors = {
  // Primary
  primary: '#1a365d',        // Deep blue - headers, primary buttons
  primaryLight: '#2c5282',   // Medium blue - secondary elements
  
  // Semantic
  success: '#38a169',        // Green - income, success states
  error: '#c53030',          // Red - errors, expenses
  warning: '#d69e2e',        // Yellow - warnings
  
  // Neutral
  background: '#f7fafc',     // Light gray - screen background
  surface: '#ffffff',        // White - cards, inputs
  border: '#e2e8f0',         // Border color
  
  // Text
  textPrimary: '#1a202c',    // Almost black - headings
  textSecondary: '#4a5568',  // Dark gray - body text
  textMuted: '#a0aec0',      // Light gray - placeholders, captions
  
  // Misc
  overlay: 'rgba(0,0,0,0.5)',
};
```

### Typography (`src/theme/typography.ts`)

```typescript
export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 20 },
};
```

### Spacing (`src/theme/spacing.ts`)

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

---

## Types (`src/types/index.ts`)

```typescript
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
```

---

## Mock Data

### User (`src/data/mockUser.ts`)

```typescript
import { User } from '../types';

export const mockUser: User = {
  id: 'user_001',
  name: 'Ramesh Kumar',
  phone: '9876543210',
  email: 'ramesh.kumar@email.com',
  upiId: 'ramesh.kumar@mbank',
  accounts: [
    {
      id: 'acc_001',
      type: 'Savings',
      number: '1234567890',
      maskedNumber: '****7890',
      balance: 45230.50,
      bankName: 'MBank',
      ifsc: 'MBNK0001234',
    },
  ],
};
```

### Transactions (`src/data/mockTransactions.ts`)

```typescript
import { Transaction } from '../types';

export const mockTransactions: Transaction[] = [
  // November 2024
  {
    id: 't001',
    name: 'Swiggy',
    description: 'Food delivery',
    amount: -450,
    date: '2024-11-28T14:30:00Z',
    category: 'food',
    icon: '🍔',
    status: 'completed',
  },
  {
    id: 't002',
    name: 'Amazon',
    description: 'Electronics purchase',
    amount: -1299,
    date: '2024-11-27T10:15:00Z',
    category: 'shopping',
    icon: '📦',
    status: 'completed',
  },
  {
    id: 't003',
    name: 'Swiggy',
    description: 'Food delivery',
    amount: -380,
    date: '2024-11-26T20:45:00Z',
    category: 'food',
    icon: '🍔',
    status: 'completed',
  },
  {
    id: 't004',
    name: 'Swiggy',
    description: 'Food delivery',
    amount: -520,
    date: '2024-11-26T13:00:00Z',
    category: 'food',
    icon: '🍔',
    status: 'completed',
  },
  {
    id: 't005',
    name: 'HP Petrol',
    description: 'Fuel',
    amount: -1200,
    date: '2024-11-25T09:30:00Z',
    category: 'transport',
    icon: '⛽',
    status: 'completed',
  },
  {
    id: 't006',
    name: 'Netflix',
    description: 'Monthly subscription',
    amount: -649,
    date: '2024-11-25T00:00:00Z',
    category: 'entertainment',
    icon: '🎬',
    status: 'completed',
  },
  {
    id: 't007',
    name: 'Zerodha',
    description: 'Stock investment',
    amount: -5000,
    date: '2024-11-24T11:00:00Z',
    category: 'investment',
    icon: '📈',
    status: 'completed',
  },
  {
    id: 't008',
    name: 'Electricity Bill',
    description: 'BESCOM',
    amount: -2340,
    date: '2024-11-20T16:00:00Z',
    category: 'utilities',
    icon: '💡',
    status: 'completed',
  },
  {
    id: 't009',
    name: 'Priya',
    description: 'Money transfer',
    amount: -2000,
    date: '2024-11-18T19:30:00Z',
    category: 'transfer',
    icon: '👤',
    upiId: 'priya.s@paytm',
    status: 'completed',
  },
  {
    id: 't010',
    name: 'Swiggy',
    description: 'Food delivery',
    amount: -290,
    date: '2024-11-15T21:00:00Z',
    category: 'food',
    icon: '🍔',
    status: 'completed',
  },
  {
    id: 't011',
    name: 'Uber',
    description: 'Ride',
    amount: -245,
    date: '2024-11-14T08:15:00Z',
    category: 'transport',
    icon: '🚗',
    status: 'completed',
  },
  {
    id: 't012',
    name: 'Flipkart',
    description: 'Online shopping',
    amount: -1899,
    date: '2024-11-12T14:00:00Z',
    category: 'shopping',
    icon: '🛒',
    status: 'completed',
  },
  {
    id: 't013',
    name: 'Mobile Recharge',
    description: 'Jio prepaid',
    amount: -299,
    date: '2024-11-10T10:00:00Z',
    category: 'utilities',
    icon: '📱',
    status: 'completed',
  },
  {
    id: 't014',
    name: 'Salary',
    description: 'TechCorp Pvt Ltd',
    amount: 45000,
    date: '2024-11-01T00:00:00Z',
    category: 'income',
    icon: '💰',
    status: 'completed',
  },

  // October 2024
  {
    id: 't015',
    name: 'Swiggy',
    description: 'Food delivery',
    amount: -410,
    date: '2024-10-31T20:00:00Z',
    category: 'food',
    icon: '🍔',
    status: 'completed',
  },
  {
    id: 't016',
    name: 'Amazon Prime',
    description: 'Annual subscription',
    amount: -1499,
    date: '2024-10-28T00:00:00Z',
    category: 'entertainment',
    icon: '📦',
    status: 'completed',
  },
  {
    id: 't017',
    name: 'Zerodha',
    description: 'Mutual fund SIP',
    amount: -5000,
    date: '2024-10-25T11:00:00Z',
    category: 'investment',
    icon: '📈',
    status: 'completed',
  },
  {
    id: 't018',
    name: 'Zomato',
    description: 'Food delivery',
    amount: -350,
    date: '2024-10-22T19:30:00Z',
    category: 'food',
    icon: '🍕',
    status: 'completed',
  },
  {
    id: 't019',
    name: 'HP Petrol',
    description: 'Fuel',
    amount: -1500,
    date: '2024-10-20T09:00:00Z',
    category: 'transport',
    icon: '⛽',
    status: 'completed',
  },
  {
    id: 't020',
    name: 'Salary',
    description: 'TechCorp Pvt Ltd',
    amount: 45000,
    date: '2024-10-01T00:00:00Z',
    category: 'income',
    icon: '💰',
    status: 'completed',
  },
];

// Helper functions
export const getTransactionsByMonth = (transactions: Transaction[]) => {
  const grouped: Record<string, Transaction[]> = {};
  
  transactions.forEach(txn => {
    const date = new Date(txn.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    
    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push(txn);
  });
  
  return Object.entries(grouped).map(([title, data]) => ({ title, data }));
};

export const getMonthlySpending = (transactions: Transaction[]) => {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && 
           d.getFullYear() === now.getFullYear() &&
           t.amount < 0;
  });
  
  return thisMonth.reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

export const getMonthlyIncome = (transactions: Transaction[]) => {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && 
           d.getFullYear() === now.getFullYear() &&
           t.amount > 0;
  });
  
  return thisMonth.reduce((sum, t) => sum + t.amount, 0);
};

export const getCategorySpending = (transactions: Transaction[]) => {
  const spending: Record<string, number> = {};
  
  transactions.filter(t => t.amount < 0).forEach(t => {
    if (!spending[t.category]) {
      spending[t.category] = 0;
    }
    spending[t.category] += Math.abs(t.amount);
  });
  
  return Object.entries(spending)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
};
```

### Payees (`src/data/mockPayees.ts`)

```typescript
import { Payee } from '../types';

export const mockPayees: Payee[] = [
  {
    id: 'payee_001',
    name: 'Rahul Kumar',
    upiId: 'rahul.kumar@okaxis',
    avatar: 'RK',
    isNew: true,
  },
  {
    id: 'payee_002',
    name: 'Priya Sharma',
    upiId: 'priya.s@paytm',
    avatar: 'PS',
    isNew: false,
    lastPaid: '2024-11-18',
  },
  {
    id: 'payee_003',
    name: 'Mom',
    upiId: '9876543211@ybl',
    avatar: '👩',
    isNew: false,
    lastPaid: '2024-10-15',
  },
  {
    id: 'payee_004',
    name: 'Amit Singh',
    upiId: 'amit.singh@okicici',
    avatar: 'AS',
    isNew: true,
  },
];

export const findPayeeByUPI = (upiId: string): Payee | undefined => {
  return mockPayees.find(p => p.upiId.toLowerCase() === upiId.toLowerCase());
};

export const isNewPayee = (upiId: string): boolean => {
  const payee = findPayeeByUPI(upiId);
  return !payee || payee.isNew;
};
```

---

## Utility Functions

### Validation (`src/utils/validation.ts`)

```typescript
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

export const validateUPIId = (upi: string): ValidationResult => {
  if (!upi || upi.trim() === '') {
    return { valid: false, error: 'UPI ID is required' };
  }
  
  if (!upi.includes('@')) {
    return { valid: false, error: 'UPI ID must contain @' };
  }
  
  const upiRegex = /^[\w.-]+@[\w]+$/;
  if (!upiRegex.test(upi)) {
    return { valid: false, error: 'Invalid UPI ID format' };
  }
  
  return { valid: true };
};

export const validateAmount = (amount: number, balance: number): ValidationResult => {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Enter a valid amount' };
  }
  
  if (amount > balance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  
  if (amount > 100000) {
    return { valid: false, error: 'Amount exceeds daily limit of ₹1,00,000' };
  }
  
  if (amount > 10000) {
    return { valid: true, warning: 'Large transaction - please verify details' };
  }
  
  return { valid: true };
};

export const validateIFSC = (ifsc: string): ValidationResult => {
  if (!ifsc || ifsc.trim() === '') {
    return { valid: false, error: 'IFSC code is required' };
  }
  
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifsc.toUpperCase())) {
    return { 
      valid: false, 
      error: 'Invalid IFSC format. Should be like MBNK0001234 (5th character must be 0)' 
    };
  }
  
  return { valid: true };
};

export const validateAccountNumber = (accNum: string): ValidationResult => {
  if (!accNum || accNum.trim() === '') {
    return { valid: false, error: 'Account number is required' };
  }
  
  if (!/^\d{9,18}$/.test(accNum)) {
    return { valid: false, error: 'Account number must be 9-18 digits' };
  }
  
  return { valid: true };
};
```

### Formatters (`src/utils/formatters.ts`)

```typescript
export const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(absAmount);
  
  return amount < 0 ? `-${formatted}` : formatted;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const maskAccountNumber = (accNum: string): string => {
  if (accNum.length <= 4) return accNum;
  return '****' + accNum.slice(-4);
};

export const generateTransactionId = (): string => {
  return 'TXN' + Date.now().toString() + Math.random().toString(36).substr(2, 4).toUpperCase();
};
```

---

## Navigation (`src/navigation/AppNavigator.tsx`)

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme/colors';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import UPIPaymentScreen from '../screens/UPIPaymentScreen';
import UPIConfirmScreen from '../screens/UPIConfirmScreen';
import UPISuccessScreen from '../screens/UPISuccessScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  UPIPayment: undefined;
  UPIConfirm: {
    upiId: string;
    amount: number;
    note?: string;
    recipientName: string;
    isNewRecipient: boolean;
  };
  UPISuccess: {
    amount: number;
    recipientName: string;
    upiId: string;
    transactionId: string;
    timestamp: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitleVisible: false,
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Transactions" 
          component={TransactionsScreen}
          options={{ title: 'Transactions' }}
        />
        <Stack.Screen 
          name="UPIPayment" 
          component={UPIPaymentScreen}
          options={{ title: 'Send Money' }}
        />
        <Stack.Screen 
          name="UPIConfirm" 
          component={UPIConfirmScreen}
          options={{ title: 'Confirm Payment' }}
        />
        <Stack.Screen 
          name="UPISuccess" 
          component={UPISuccessScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
```

---

## Screen Specifications

### 1. Dashboard Screen (`src/screens/DashboardScreen.tsx`)

**Layout:**
- Status bar area with greeting and notification icon
- Balance card (primary account)
- Quick action buttons (Pay, Scan, History, More)
- Monthly spending summary with progress bar
- Recent transactions list (last 5)
- "View All" link to Transactions screen
- Soprano placeholder (bottom right corner)

**Features:**
- Pull to refresh
- Greeting based on time of day ("Good morning", "Good afternoon", "Good evening")
- Spending percentage calculation (spent/income)

**Data to display:**
- User name
- Primary account balance
- Masked account number
- This month's income and spending
- Last 5 transactions

**Navigation:**
- "Pay" button → UPIPayment screen
- "History" button → Transactions screen
- "View All" → Transactions screen
- Transaction item tap → (no action for now)

---

### 2. Transactions Screen (`src/screens/TransactionsScreen.tsx`)

**Layout:**
- Search bar at top
- Filter dropdown (All, Income, Expense) - optional
- SectionList grouped by month
- Each section has month header with total
- Transaction items with icon, name, amount, date
- Soprano placeholder (bottom right corner)

**Features:**
- Search by transaction name
- Grouped by month (November 2024, October 2024, etc.)
- Month header shows total spent/received
- Pull to refresh
- Track scroll position (for Soprano context)

**Data to display:**
- All transactions from mockTransactions
- Grouped by month
- Monthly totals

---

### 3. UPI Payment Screen (`src/screens/UPIPaymentScreen.tsx`)

**Layout:**
```
- Header: "Send Money"
- "To" section:
  - UPI ID input field (with ref)
  - "Scan QR" button below input
- "Amount" section:
  - Amount input with ₹ prefix (with ref)
- "From" section:
  - Selected account display
  - Available balance
- "Note" section:
  - Optional note input (with ref)
- "Continue" button (disabled until valid)
- Soprano placeholder (bottom right corner)
```

**Features:**
- Real-time validation on blur
- Error messages below fields
- Warning for large amounts (>₹10,000)
- First-time recipient warning
- Keyboard aware scrolling
- All inputs must forward refs

**Validation:**
- UPI ID: Required, must match format xxx@xxx
- Amount: Required, > 0, <= balance, <= 100000
- Note: Optional, max 50 characters

**State to track (for Soprano context):**
```typescript
{
  upiId: string;
  amount: string;
  note: string;
  errors: {
    upiId?: string;
    amount?: string;
  };
  focusedField: 'upiId' | 'amount' | 'note' | null;
}
```

**Navigation:**
- "Continue" → UPIConfirm screen (pass payment data)
- Back → Dashboard

---

### 4. UPI Confirm Screen (`src/screens/UPIConfirmScreen.tsx`)

**Layout:**
```
- Recipient avatar (initials in circle)
- Recipient name (large)
- UPI ID (below name)
- Amount (very large, centered)
- Warning badge if first-time recipient
- "From" account info
- Note (if provided)
- "Pay ₹X,XXX" button
- Soprano placeholder (bottom right corner)
```

**Features:**
- Display all payment details for confirmation
- First-time recipient warning badge
- Loading state on button while "processing"
- Simulate 1-2 second delay before success

**Navigation:**
- "Pay" button → Simulate delay → UPISuccess screen
- Back → UPIPayment screen

---

### 5. UPI Success Screen (`src/screens/UPISuccessScreen.tsx`)

**Layout:**
```
- Large green checkmark (animated if possible)
- "Payment Successful" text
- Amount (large)
- "sent to" text
- Recipient name
- Transaction details:
  - Transaction ID
  - Date & Time
- Two buttons:
  - "Share Receipt" (secondary)
  - "Back to Home" (primary)
- Soprano placeholder (bottom right corner)
```

**Features:**
- Success animation (checkmark appearing)
- Generate transaction ID
- Show current timestamp
- No back gesture (prevent going back to confirm)

**Navigation:**
- "Back to Home" → Reset stack to Dashboard
- "Share Receipt" → (no action for now, just show a toast)

---

## Reusable Components

### InputField (`src/components/InputField.tsx`)

```typescript
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  error?: string;
  warning?: string;
  prefix?: string;  // e.g., "₹"
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<TextInput>;  // IMPORTANT: For Soprano integration
}
```

- Must forward ref to TextInput
- Show error message in red below input
- Show warning message in yellow below input
- Support prefix (for currency)
- Highlight border on focus

### Button (`src/components/Button.tsx`)

```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  buttonRef?: React.RefObject<TouchableOpacity>;  // IMPORTANT: For Soprano integration
}
```

### Card (`src/components/Card.tsx`)

```typescript
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}
```

- White background
- Subtle shadow
- Border radius 12

### TransactionItem (`src/components/TransactionItem.tsx`)

```typescript
interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}
```

- Icon (emoji) on left
- Name and description
- Amount on right (green for credit, red for debit)
- Date below amount

### SopranoPlaceholder (`src/components/SopranoPlaceholder.tsx`)

```typescript
// Placeholder for the Soprano avatar
// Position: absolute, bottom: 100, right: 20
// Size: 60x60
// Style: Circle with primary color, centered icon
```

This is a placeholder that will later be replaced with the actual Soprano avatar component. For now, just show a floating circular button with a microphone or chat icon.

---

## Context

### AppContext (`src/context/AppContext.tsx`)

Provides global app state:

```typescript
interface AppContextType {
  user: User;
  transactions: Transaction[];
  balance: number;
  refreshData: () => void;
}
```

### ScreenContext (`src/context/ScreenContext.tsx`)

Tracks current screen state for Soprano:

```typescript
interface ScreenContextType {
  currentScreen: string;
  screenData: Record<string, any>;
  formState: Record<string, any>;
  updateScreenData: (data: Record<string, any>) => void;
  updateFormState: (data: Record<string, any>) => void;
}
```

Every screen should update this context when:
- Screen mounts (set currentScreen)
- Form values change (set formState)
- Data is loaded (set screenData)

---

## Important Notes for AI Agent

1. **Refs are Critical:** Every input field and important button must expose a ref. This is required for the Soprano AI to highlight and interact with elements.

2. **Screen Context:** Every screen must update the ScreenContext when it mounts and when significant state changes. This allows Soprano to understand what the user is seeing.

3. **Realistic Data:** Use the mock data as-is. The transactions are designed to show patterns (repeated Swiggy orders, monthly salary, etc.) that Soprano can comment on.

4. **Indian Currency:** Always format currency in Indian format (₹45,230.50) with lakhs/crores if needed.

5. **No Authentication:** Skip login/OTP screens. App starts directly on Dashboard.

6. **Error States:** Implement proper error states for validation. These will trigger Soprano's Guardian mode.

7. **Performance:** Use FlatList/SectionList for transaction lists. Avoid re-renders.

8. **Styling:** Follow the theme strictly. The app should look professional and clean, like a real banking app.

9. **TypeScript:** Use strict TypeScript. Define all types properly.

10. **Comments:** Add comments in code indicating where Soprano integration points will be added later.

---

## Testing Checklist

After implementation, verify:

- [ ] App launches without errors
- [ ] Dashboard shows correct balance and transactions
- [ ] Navigation works: Dashboard → Transactions → Back
- [ ] Navigation works: Dashboard → Pay → Confirm → Success → Home
- [ ] UPI validation shows errors for invalid input
- [ ] Amount validation shows error when > balance
- [ ] First-time recipient warning appears
- [ ] Transaction list scrolls smoothly
- [ ] Soprano placeholder appears on all screens
- [ ] All input fields have accessible refs
- [ ] Screen context updates on navigation

---

## Future Integration Points

Mark these areas in code with comments for Soprano integration:

1. **Dashboard:** `// SOPRANO: Narrator mode - comment on balance and spending patterns`
2. **Transactions:** `// SOPRANO: Narrator mode - comment on visible transactions during scroll`
3. **UPI Payment inputs:** `// SOPRANO: Guide mode - explain field on focus`
4. **Validation errors:** `// SOPRANO: Guardian mode - explain error and suggest fix`
5. **Confirm screen:** `// SOPRANO: Guide mode - warn about first-time recipient`
6. **Success screen:** `// SOPRANO: Narrator mode - confirm success and new balance`

---

End of specification.