import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useApp } from '../context/AppContext';
import { useScreenContext } from '../context/ScreenContext';
import { useVisualGuide } from '../context/VisualGuideContext';
import { BalanceCard } from '../components/BalanceCard';
import { QuickActions } from '../components/QuickActions';
import { TransactionList } from '../components/TransactionList';
import { Soprano } from '../components/Soprano';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getMonthlySpending, getMonthlyIncome } from '../data/mockTransactions';
import { formatCurrency } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { getElementsForScreen } from '../config/elementRegistry';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, transactions, refreshData } = useApp();
  const { setCurrentScreen, updateScreenData } = useScreenContext();
  const { registerElement, clearRegistry } = useVisualGuide();
  const [refreshing, setRefreshing] = useState(false);

  // Create refs for all interactive elements
  const payButtonRef = useRef<View>(null);
  const scanButtonRef = useRef<View>(null);
  const historyButtonRef = useRef<View>(null);
  const moreButtonRef = useRef<View>(null);
  const balanceCardRef = useRef<View>(null);
  const transactionsListRef = useRef<View>(null);

  useEffect(() => {
    setCurrentScreen('Dashboard');
    updateScreenData({
      balance: user.accounts[0]?.balance,
      recentTransactions: transactions.slice(0, 5),
    });

    // Register elements for visual guidance
    const elements = getElementsForScreen('Dashboard');
    const refs: Record<string, React.RefObject<View>> = {
      'pay-button': payButtonRef,
      'scan-button': scanButtonRef,
      'history-button': historyButtonRef,
      'more-button': moreButtonRef,
      'balance-card': balanceCardRef,
      'transactions-list': transactionsListRef,
    };

    elements.forEach(element => {
      if (refs[element.id]) {
        registerElement({
          ...element,
          ref: refs[element.id],
          screenName: 'Dashboard',
        });
      }
    });

    // Cleanup on unmount
    return () => {
      clearRegistry();
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const monthlySpending = getMonthlySpending(transactions);
  const monthlyIncome = getMonthlyIncome(transactions);
  const spendingPercentage = monthlyIncome > 0 ? (monthlySpending / monthlyIncome) * 100 : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    refreshData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const quickActions = [
    {
      id: 'pay-button',
      icon: 'bank-transfer' as const,
      label: 'Pay',
      onPress: () => navigation.navigate('UPIPayment'),
    },
    {
      id: 'scan-button',
      icon: 'qrcode-scan' as const,
      label: 'Scan',
      onPress: () => {},
    },
    {
      id: 'history-button',
      icon: 'history' as const,
      label: 'History',
      onPress: () => navigation.navigate('Transactions'),
    },
    {
      id: 'more-button',
      icon: 'dots-horizontal' as const,
      label: 'More',
      onPress: () => {},
    },
  ];

  const elementRefs = {
    'pay-button': payButtonRef,
    'scan-button': scanButtonRef,
    'history-button': historyButtonRef,
    'more-button': moreButtonRef,
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user.name.split(' ')[0]}</Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View ref={balanceCardRef} collapsable={false}>
          <BalanceCard account={user.accounts[0]} />
        </View>

        <QuickActions actions={quickActions} elementRefs={elementRefs} />

        <Card style={styles.spendingCard}>
          <View style={styles.spendingHeader}>
            <Text style={styles.spendingTitle}>This Month</Text>
            <Text style={styles.spendingPercentage}>
              {spendingPercentage.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.spendingRow}>
            <Text style={styles.spendingLabel}>Income</Text>
            <Text style={[styles.spendingAmount, { color: colors.success }]}>
              {formatCurrency(monthlyIncome)}
            </Text>
          </View>
          <View style={styles.spendingRow}>
            <Text style={styles.spendingLabel}>Spending</Text>
            <Text style={[styles.spendingAmount, { color: colors.error }]}>
              {formatCurrency(-monthlySpending)}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(spendingPercentage, 100)}%` },
              ]}
            />
          </View>
        </Card>

        <View ref={transactionsListRef} collapsable={false}>
          <TransactionList
            transactions={recentTransactions}
            title="Recent Transactions"
            showSeeAll
            onSeeAllPress={() => navigation.navigate('Transactions')}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Soprano />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
  },
  greeting: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    ...typography.h2,
    color: '#fff',
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: spacing.lg,
  },
  spendingCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  spendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  spendingTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  spendingPercentage: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  spendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  spendingLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  spendingAmount: {
    ...typography.body,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});

export default DashboardScreen;
