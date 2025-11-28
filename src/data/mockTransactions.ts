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
