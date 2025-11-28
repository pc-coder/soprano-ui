import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useApp } from '../context/AppContext';
import { useScreenContext } from '../context/ScreenContext';
import { TransactionItem } from '../components/TransactionItem';
import { TransactionCommentary } from '../components/TransactionCommentary';
import { Soprano } from '../components/Soprano';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getTransactionsByMonth } from '../data/mockTransactions';
import { formatCurrency } from '../utils/formatters';
import { Transaction } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { generateSpotlightCommentary } from '../services/commentaryService';
import { synthesizeSpeech, playAudio } from '../services/voiceService';

type TransactionsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Transactions'
>;

interface Props {
  navigation: TransactionsScreenNavigationProp;
}

const TransactionsScreen: React.FC<Props> = ({ navigation }) => {
  const { transactions, refreshData, commentaryEnabled, setCommentaryEnabled } = useApp();
  const { setCurrentScreen, updateScreenData } = useScreenContext();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [commentedTransactions, setCommentedTransactions] = useState<Set<string>>(new Set());
  const isSpeakingRef = useRef(false);
  const commentaryEnabledRef = useRef(commentaryEnabled);

  useEffect(() => {
    setCurrentScreen('Transactions');
    updateScreenData({
      totalTransactions: transactions.length,
      visibleTransactions: filteredTransactions.length,
    });
  }, [searchQuery]);

  // Keep ref in sync with state
  useEffect(() => {
    commentaryEnabledRef.current = commentaryEnabled;
    console.log('[Commentary] Ref updated to:', commentaryEnabled);
  }, [commentaryEnabled]);

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
    // Reset commented transactions on refresh
    setCommentedTransactions(new Set());
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCommentaryToggle = () => {
    const newEnabled = !commentaryEnabled;
    console.log('[Commentary] Toggle:', newEnabled ? 'ENABLED' : 'DISABLED');
    setCommentaryEnabled(newEnabled);

    if (!newEnabled) {
      // Reset when turning off
      setCommentedTransactions(new Set());
      setIsSpeaking(false);
    } else {
      console.log('[Commentary] Commentary mode active, scroll to trigger');
    }
  };

  const speakCommentary = async (transaction: Transaction) => {
    // Skip if already speaking
    if (isSpeakingRef.current) {
      console.log('[Commentary] Already speaking, skipping:', transaction.name);
      return;
    }

    try {
      console.log('[Commentary] Speaking about:', transaction.name, formatCurrency(transaction.amount));
      isSpeakingRef.current = true;
      setIsSpeaking(true);

      // Generate commentary
      console.log('[Commentary] Generating commentary...');
      const commentary = await generateSpotlightCommentary(transaction, transactions);
      console.log('[Commentary] Generated:', commentary);

      // Synthesize and play
      console.log('[Commentary] Synthesizing speech...');
      const audioUri = await synthesizeSpeech(commentary);
      console.log('[Commentary] Audio URI:', audioUri);

      console.log('[Commentary] Playing audio...');
      await playAudio(audioUri);
      console.log('[Commentary] Finished playing');

      isSpeakingRef.current = false;
      setIsSpeaking(false);
    } catch (error: any) {
      console.error('[Commentary] Error:', error.message);
      console.error('[Commentary] Full error:', error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  };

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    console.log('[Commentary] Viewable items changed, count:', viewableItems.length);
    console.log('[Commentary] Commentary enabled (ref):', commentaryEnabledRef.current);
    console.log('[Commentary] Is speaking (ref):', isSpeakingRef.current);

    if (!commentaryEnabledRef.current) {
      console.log('[Commentary] Skipping - commentary disabled');
      return;
    }

    // Skip if already speaking - prevents queue buildup
    if (isSpeakingRef.current) {
      console.log('[Commentary] Skipping - currently speaking');
      return;
    }

    // Get current commented set from state via callback
    // Find the first viewable transaction that hasn't been commented on
    const uncommentedItem = viewableItems.find((item: any) => {
      const transaction = item.item as Transaction;
      if (!transaction) return false;

      // We'll check inside the state update
      return true;
    });

    // Check each viewable item and speak about the first uncommented one
    setCommentedTransactions(prev => {
      for (const item of viewableItems) {
        const transaction = item.item as Transaction;
        if (!transaction) continue;

        if (!prev.has(transaction.id)) {
          console.log('[Commentary] Found uncommented transaction:', transaction.name);

          // Speak commentary (don't await, let it run async)
          speakCommentary(transaction);

          // Mark as commented
          const newSet = new Set(prev);
          newSet.add(transaction.id);
          console.log('[Commentary] Marked as commented, total:', newSet.size);
          return newSet;
        }
      }

      // No uncommented items found
      return prev;
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Transaction must be 50% visible
    minimumViewTime: 500, // Must be visible for 500ms
  }).current;

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
        <TouchableOpacity
          onPress={handleCommentaryToggle}
          style={[
            styles.commentaryToggle,
            commentaryEnabled && styles.commentaryToggleActive,
          ]}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={commentaryEnabled ? colors.warning : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TransactionCommentary
        isActive={commentaryEnabled}
        isSpeaking={isSpeaking}
      />

      <SectionList
        sections={groupedTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
      />

      <Soprano />
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
  commentaryToggle: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  commentaryToggleActive: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
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
