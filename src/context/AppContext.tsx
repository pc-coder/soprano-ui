import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Transaction } from '../types';
import { mockUser } from '../data/mockUser';
import { mockTransactions } from '../data/mockTransactions';

interface AppContextType {
  user: User;
  transactions: Transaction[];
  balance: number;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const balance = user.accounts[0]?.balance || 0;

  const refreshData = () => {
    // Simulate data refresh - in a real app, this would fetch from an API
    setUser({ ...mockUser });
    setTransactions([...mockTransactions]);
  };

  const value: AppContextType = {
    user,
    transactions,
    balance,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
