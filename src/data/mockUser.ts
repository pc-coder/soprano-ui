import { User } from '../types';

export const mockUser: User = {
  id: 'user_001',
  name: 'Ramesh Kumar',
  phone: '9876543210',
  email: 'ramesh.kumar@email.com',
  upiId: 'ramesh.kumar@oksbi',
  accounts: [
    {
      id: 'acc_001',
      type: 'Savings',
      number: '1234567890',
      maskedNumber: '****7890',
      balance: 45230.50,
      bankName: 'State Bank of India',
      ifsc: 'SBIN0001234',
    },
  ],
};
