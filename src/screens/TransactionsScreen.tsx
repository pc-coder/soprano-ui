import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useApp } from '../context/AppContext';
import { useScreenContext } from '../context/ScreenContext';
import { TransactionItem } from '../components/TransactionItem';
import { SopranoPlaceholder } from '../components/SopranoPlaceholder';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getTransactionsByMonth } from '../data/mockTransactions';
import { formatCurrency } from '../utils/formatters';
import { Transaction } from '../types';
import { Ionicons } from '@expo/vector-icons';

type TransactionsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Transactions'
>;

interface Props {
  navigation: TransactionsScreenNavigationProp;
}

const TransactionsScreen: React.FC<Props> = ({ navigation }) => {
  const { transactions, refreshData } = useApp();
  const { setCurrentScreen, updateScreenData } = useScreenContext();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    setCurrentScreen('Transactions');
    updateScreenData({
      totalTransactions: transactions.length,
      visibleTransactions: filteredTransactions.length,
    });
  }, [searchQuery]);

  const filteredTransactions = searchQuery
    ? transactions.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transactions;

  const groupedTransactions = getTransactionsByMonth(filteredTransactions);

  const onRefresh = async () => {
    setRefreshing(true);
    refreshData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getMonthTotal = (transactions: Transaction[]) => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    return total;
  };

  const renderSectionHeader = ({ section }: any) => {
    const total = getMonthTotal(section.data);
    const isPositive = total >= 0;

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text
          style={[
            styles.sectionTotal,
            { color: isPositive ? colors.success : colors.error },
          ]}
        >
          {formatCurrency(total)}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} />
  );

  // SOPRANO: Narrator mode - comment on visible transactions during scroll
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <SectionList
        sections={groupedTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={(event) => {
          setScrollPosition(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
      />

      <SopranoPlaceholder />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  listContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionTotal: {
    ...typography.body,
    fontWeight: '700',
  },
});

export default TransactionsScreen;
