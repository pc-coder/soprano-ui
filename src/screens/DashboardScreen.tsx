import React, { useEffect, useState } from 'react';
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
import { BalanceCard } from '../components/BalanceCard';
import { QuickActions } from '../components/QuickActions';
import { TransactionList } from '../components/TransactionList';
import { SopranoPlaceholder } from '../components/SopranoPlaceholder';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getMonthlySpending, getMonthlyIncome } from '../data/mockTransactions';
import { formatCurrency } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, transactions, refreshData } = useApp();
  const { setCurrentScreen, updateScreenData } = useScreenContext();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setCurrentScreen('Dashboard');
    updateScreenData({
      balance: user.accounts[0]?.balance,
      recentTransactions: transactions.slice(0, 5),
    });
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
      icon: 'bank-transfer' as const,
      label: 'Pay',
      onPress: () => navigation.navigate('UPIPayment'),
    },
    {
      icon: 'qrcode-scan' as const,
      label: 'Scan',
      onPress: () => {},
    },
    {
      icon: 'history' as const,
      label: 'History',
      onPress: () => navigation.navigate('Transactions'),
    },
    {
      icon: 'dots-horizontal' as const,
      label: 'More',
      onPress: () => {},
    },
  ];

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
        <BalanceCard account={user.accounts[0]} />

        <QuickActions actions={quickActions} />

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

        <TransactionList
          transactions={recentTransactions}
          title="Recent Transactions"
          showSeeAll
          onSeeAllPress={() => navigation.navigate('Transactions')}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <SopranoPlaceholder />
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
