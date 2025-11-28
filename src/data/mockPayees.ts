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
