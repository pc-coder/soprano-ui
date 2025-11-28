import Anthropic from '@anthropic-ai/sdk';
import { API_CONFIG } from '../config/api';
import { Transaction } from '../types';
import { formatCurrencyForTTS } from '../utils/formatters';

/**
 * Analyze transaction patterns for commentary generation
 */
const analyzeTransactions = (transactions: Transaction[]) => {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Spending by day of week
  const spendingByDay: Record<string, number> = {};
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  thisMonth.forEach(t => {
    if (t.amount < 0) {
      const day = daysOfWeek[new Date(t.date).getDay()];
      spendingByDay[day] = (spendingByDay[day] || 0) + Math.abs(t.amount);
    }
  });

  // Spending by category
  const spendingByCategory: Record<string, number> = {};
  thisMonth.forEach(t => {
    if (t.amount < 0) {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + Math.abs(t.amount);
    }
  });

  // Spending by merchant
  const spendingByMerchant: Record<string, { total: number; count: number }> = {};
  thisMonth.forEach(t => {
    if (t.amount < 0) {
      if (!spendingByMerchant[t.name]) {
        spendingByMerchant[t.name] = { total: 0, count: 0 };
      }
      spendingByMerchant[t.name].total += Math.abs(t.amount);
      spendingByMerchant[t.name].count += 1;
    }
  });

  // Pending transactions
  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  // Investment vs spending
  const investments = thisMonth.filter(t => t.category === 'investment');
  const totalInvestment = investments.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalSpending = thisMonth
    .filter(t => t.amount < 0 && t.category !== 'investment')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Income
  const income = thisMonth.filter(t => t.amount > 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  // Find highest spending day
  const highestSpendingDay = Object.entries(spendingByDay).sort((a, b) => b[1] - a[1])[0];

  // Find most frequent merchant
  const topMerchant = Object.entries(spendingByMerchant).sort((a, b) => b[1].count - a[1].count)[0];

  return {
    thisMonth,
    spendingByDay,
    spendingByCategory,
    spendingByMerchant,
    pendingTransactions,
    totalInvestment,
    totalSpending,
    totalIncome,
    highestSpendingDay,
    topMerchant,
  };
};

/**
 * Generate commentary prompt with transaction analysis
 */
const createCommentaryPrompt = (transactions: Transaction[]): string => {
  const analysis = analyzeTransactions(transactions);

  let prompt = `You are a witty, friendly AI assistant analyzing an Indian user's spending patterns. Generate SHORT, conversational commentary about their transactions.

IMPORTANT: This is for Text-to-Speech. Always say "rupees" for currency, never use ₹ or Rs symbols.

TRANSACTION DATA:
`;

  // Recent transactions
  prompt += `\nRecent transactions:\n`;
  transactions.slice(0, 10).forEach(t => {
    const date = new Date(t.date);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    prompt += `- ${dayName}: ${t.name} - ${formatCurrencyForTTS(t.amount)} (${t.status})\n`;
  });

  // Spending patterns
  if (analysis.highestSpendingDay) {
    prompt += `\nHighest spending day: ${analysis.highestSpendingDay[0]} with ${formatCurrencyForTTS(analysis.highestSpendingDay[1])}\n`;
  }

  if (analysis.topMerchant) {
    prompt += `Top merchant: ${analysis.topMerchant[0]} (${analysis.topMerchant[1].count} transactions, ${formatCurrencyForTTS(analysis.topMerchant[1].total)} total)\n`;
  }

  // Food delivery addiction
  const foodDelivery = Object.entries(analysis.spendingByMerchant).filter(([name]) =>
    name.toLowerCase().includes('swiggy') || name.toLowerCase().includes('zomato')
  );
  if (foodDelivery.length > 0) {
    const totalFood = foodDelivery.reduce((sum, [_, data]) => sum + data.total, 0);
    const totalOrders = foodDelivery.reduce((sum, [_, data]) => sum + data.count, 0);
    prompt += `Food delivery: ${totalOrders} orders, ${formatCurrencyForTTS(totalFood)} total\n`;
  }

  // Pending transactions
  if (analysis.pendingTransactions.length > 0) {
    prompt += `\nPending transactions:\n`;
    analysis.pendingTransactions.forEach(t => {
      prompt += `- ${t.name}: ${formatCurrencyForTTS(t.amount)}\n`;
    });
  }

  // Investments vs spending
  if (analysis.totalInvestment > 0) {
    prompt += `\nInvestments: ${formatCurrencyForTTS(analysis.totalInvestment)}\n`;
    prompt += `Other spending: ${formatCurrencyForTTS(analysis.totalSpending)}\n`;
  }

  prompt += `
STYLE GUIDELINES:
- Write 2-4 short observations/comments (each 1-2 sentences max)
- Be funny, friendly, slightly cheeky but supportive
- Make specific observations about patterns (heavy spending days, repeated merchants, pending payments)
- Comment on investments vs spending if relevant
- Reference Indian payment systems (UPI, NEFT, IMPS) and merchants (Swiggy, Zomato, Paytm, PhonePe)
- Decode mysterious merchant names if any (like "BIL*BGBLLRMEPG" = Bajaj EMI)
- Use conversational language with light humor
- ALWAYS say "rupees" for amounts, never use ₹ or Rs
- Don't lecture or give advice, just make witty observations

EXAMPLES OF GOOD COMMENTARY:
"Monday was rough — 3,400 rupees on food delivery alone. Tuesday you recovered, very disciplined. Wednesday... that 15,000 rupees to Priya. Still pending. Shall I remind her, or are we still being polite?"

"Your mutual funds grew 4,600 rupees this month. That's money you made while sleeping. Meanwhile, your FD earned 800 rupees. Just putting that out there. No pressure."

"Swiggy: 12 orders this month. That's almost every other day. The restaurant industry thanks you for your service."

Generate similar commentary based on the transaction data above. Return ONLY the commentary text, no preamble.`;

  return prompt;
};

/**
 * Generate commentary for a specific transaction
 */
export const generateSpotlightCommentary = async (
  transaction: Transaction,
  allTransactions: Transaction[]
): Promise<string> => {
  const startTime = performance.now();

  try {
    console.log('[CommentaryService] Generating for:', transaction.name);
    console.log('[CommentaryService] Model:', API_CONFIG.anthropic.commentaryModel);
    console.log('[CommentaryService] API Key present:', !!API_CONFIG.anthropic.apiKey);

    const anthropic = new Anthropic({
      apiKey: API_CONFIG.anthropic.apiKey,
    });

    // Create contextual prompt for this specific transaction
    const prompt = createSpotlightPrompt(transaction, allTransactions);
    console.log('[CommentaryService] Prompt created, length:', prompt.length);

    console.log('[CommentaryService] Calling Anthropic API...');
    const message = await anthropic.messages.create({
      model: API_CONFIG.anthropic.commentaryModel,
      max_tokens: 150, // Short commentary for TTS
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('[CommentaryService] API response received');

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    if (!responseText) {
      throw new Error('No commentary generated');
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[CommentaryService] Generated in ${duration}s for ${transaction.name}`);
    console.log(`[CommentaryService] Commentary: "${responseText}"`);

    return responseText.trim();
  } catch (error: any) {
    console.error('[CommentaryService] Generation error:', error.message);
    console.error('[CommentaryService] Full error:', error);
    throw new Error(`Failed to generate commentary: ${error.message}`);
  }
};

/**
 * Create prompt for spotlight commentary on a specific transaction
 */
const createSpotlightPrompt = (transaction: Transaction, allTransactions: Transaction[]): string => {
  const date = new Date(transaction.date);
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

  // Find similar transactions
  const sameMerchant = allTransactions.filter(t => t.name === transaction.name);
  const sameCategory = allTransactions.filter(t => t.category === transaction.category);

  let prompt = `You are a witty sports commentator narrating an Indian user's spending. Generate a VERY SHORT (1-2 sentences max) funny comment about this transaction.

IMPORTANT: This is for Text-to-Speech. Always say "rupees" for currency, never use ₹ or Rs symbols.

TRANSACTION:
${transaction.name} - ${formatCurrencyForTTS(transaction.amount)}
Category: ${transaction.category}
Day: ${dayName}
Status: ${transaction.status}
`;

  // Add context
  if (sameMerchant.length > 1) {
    prompt += `\nContext: This person has ${sameMerchant.length} transactions with ${transaction.name}`;
  }

  if (transaction.status === 'pending') {
    prompt += `\nThis transaction is PENDING`;
  }

  if (Math.abs(transaction.amount) > 10000) {
    prompt += `\nThis is a LARGE transaction`;
  }

  prompt += `

EXAMPLES OF GOOD COMMENTARY:
"3,400 rupees on Swiggy. Again. The restaurant industry thanks you for your loyal patronage."
"That's 15,000 rupees to Priya via UPI. Still pending. Shall I remind her, or are we still being polite?"
"Netflix subscription renewed. 649 rupees well spent. Can't put a price on avoiding human interaction."
"Zerodha investment. Look at you, being financially responsible while scrolling."

Generate ONE SHORT witty comment (1-2 sentences max) about THIS transaction. Make it conversational and funny. ALWAYS say "rupees" for amounts. Return ONLY the comment, no preamble.`;

  return prompt;
};

/**
 * Generate transaction commentary using Claude Haiku 4.5
 */
export const generateTransactionCommentary = async (
  transactions: Transaction[]
): Promise<string> => {
  const startTime = performance.now();

  try {
    const anthropic = new Anthropic({
      apiKey: API_CONFIG.anthropic.apiKey,
    });

    const prompt = createCommentaryPrompt(transactions);

    const message = await anthropic.messages.create({
      model: API_CONFIG.anthropic.commentaryModel,
      max_tokens: API_CONFIG.anthropic.commentaryMaxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    if (!responseText) {
      throw new Error('No commentary generated');
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[Commentary] Generated in ${duration}s using ${API_CONFIG.anthropic.commentaryModel}`);

    return responseText.trim();
  } catch (error: any) {
    console.error('[Commentary] Generation error:', error.message);
    throw new Error(`Failed to generate commentary: ${error.message}`);
  }
};
