import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme/colors';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import UPIPaymentScreen from '../screens/UPIPaymentScreen';
import UPIConfirmScreen from '../screens/UPIConfirmScreen';
import UPISuccessScreen from '../screens/UPISuccessScreen';
import LoanApplicationScreen from '../screens/LoanApplicationScreen';
import ProfileScreen from '../screens/ProfileScreen';

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
  LoanApplication: undefined;
  Profile: undefined;
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
        <Stack.Screen
          name="LoanApplication"
          component={LoanApplicationScreen}
          options={{ title: 'Apply for Loan' }}
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
