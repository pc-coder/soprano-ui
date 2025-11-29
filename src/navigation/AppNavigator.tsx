import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme/colors';

import PINLoginScreen from '../screens/PINLoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import UPIPaymentScreen from '../screens/UPIPaymentScreen';
import UPIConfirmScreen from '../screens/UPIConfirmScreen';
import UPISuccessScreen from '../screens/UPISuccessScreen';
import LoanApplicationScreen from '../screens/LoanApplicationScreen';
import LoanSuccessScreen from '../screens/LoanSuccessScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  PINLogin: undefined;
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
  LoanApplication: undefined;
  LoanSuccess: {
    loanAmount: number;
    emiTenure: number;
    applicationId: string;
  };
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PINLogin"
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
          name="PINLogin"
          component={PINLoginScreen}
          options={{ headerShown: false }}
        />
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
        <Stack.Screen
          name="LoanApplication"
          component={LoanApplicationScreen}
          options={{ title: 'Apply for Loan' }}
        />
        <Stack.Screen
          name="LoanSuccess"
          component={LoanSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
