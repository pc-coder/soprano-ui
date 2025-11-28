import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system/legacy';
import { EncodingType } from 'expo-file-system/legacy';
import { API_CONFIG } from '../config/api';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

/**
 * Analyze transactions for song generation
 */
const analyzeForSong = (transactions: Transaction[]) => {
  console.log('[SongService] Analyzing transactions, total:', transactions.length);

  // Use ALL transactions, not just this month
  const allExpenses = transactions.filter(t => t.amount < 0);
  const allIncome = transactions.filter(t => t.amount > 0);

  console.log('[SongService] Expenses:', allExpenses.length);
  console.log('[SongService] Income:', allIncome.length);

  // Category spending - ALL transactions
  const categorySpending: Record<string, number> = {};
  allExpenses.forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
  });

  // Top categories
  const topCategories = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  console.log('[SongService] Top categories:', topCategories);

  // Merchant frequency - ALL transactions
  const merchantCount: Record<string, number> = {};
  const merchantSpending: Record<string, number> = {};
  allExpenses.forEach(t => {
    merchantCount[t.name] = (merchantCount[t.name] || 0) + 1;
    merchantSpending[t.name] = (merchantSpending[t.name] || 0) + Math.abs(t.amount);
  });

  const topMerchants = Object.entries(merchantCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  console.log('[SongService] Top merchants:', topMerchants);

  // Total spending vs income - ALL transactions
  const totalSpending = allExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalIncome = allIncome.reduce((sum, t) => sum + t.amount, 0);

  console.log('[SongService] Total spending:', totalSpending);
  console.log('[SongService] Total income:', totalIncome);

  // Food delivery addiction check - ALL transactions
  const foodDelivery = allExpenses.filter(t =>
    t.name.toLowerCase().includes('swiggy') || t.name.toLowerCase().includes('zomato')
  );

  console.log('[SongService] Food delivery count:', foodDelivery.length);

  return {
    topCategories,
    topMerchants,
    totalSpending,
    totalIncome,
    foodDeliveryCount: foodDelivery.length,
    foodDeliveryTotal: foodDelivery.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    transactionCount: allExpenses.length,
    merchantSpending,
  };
};

/**
 * Generate song lyrics using Claude
 */
export const generateSpendingSong = async (transactions: Transaction[]): Promise<string> => {
  const startTime = performance.now();

  try {
    console.log('[SongService] Generating song lyrics...');

    const analysis = analyzeForSong(transactions);
    const anthropic = new Anthropic({
      apiKey: API_CONFIG.anthropic.apiKey,
    });

    const prompt = `You are a creative songwriter. Write a SHORT, CATCHY song (rap/pop style) about someone's spending habits. Keep it to 8-12 lines max.

SPENDING DATA (ALL TIME):
- Total spending: ${formatCurrency(analysis.totalSpending)}
- Total income: ${formatCurrency(analysis.totalIncome)}
- Total transactions: ${analysis.transactionCount}
- Food delivery orders: ${analysis.foodDeliveryCount} (${formatCurrency(analysis.foodDeliveryTotal)})

Top spending categories:
${analysis.topCategories.map(([cat, amt]) => `- ${cat}: ${formatCurrency(amt)}`).join('\n')}

Most frequent merchants:
${analysis.topMerchants.map(([name, count]) => `- ${name}: ${count} times`).join('\n')}

SONG REQUIREMENTS:
- 8-12 lines maximum (SHORT for TTS)
- Catchy, rhythmic, easy to rap/sing
- Funny observations about spending habits
- Reference specific merchants and amounts
- Use rhyming scheme (AABB or ABAB)
- Conversational, relatable tone
- Include hook/chorus if possible

STYLE EXAMPLES:
"Swiggy on Monday, Swiggy on Friday too,
Spent three thousand rupees, what am I gonna do?
Netflix and Prime, subscriptions on repeat,
Bank balance declining, but the vibes are sweet!"

"Food delivery king, that's my crown,
Forty-five K income but the spending's going down,
Zerodha investments trying to be wise,
But Swiggy's got me hypnotized!"

Generate a SHORT, catchy song (8-12 lines). Return ONLY the lyrics, no title or explanation.`;

    console.log('[SongService] Calling Claude API...');
    const message = await anthropic.messages.create({
      model: API_CONFIG.anthropic.model, // Use Sonnet for creativity
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const lyrics = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    if (!lyrics) {
      throw new Error('No lyrics generated');
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`[SongService] Lyrics generated in ${duration}s`);
    console.log(`[SongService] Lyrics:\n${lyrics}`);

    return lyrics.trim();
  } catch (error: any) {
    console.error('[SongService] Generation error:', error.message);
    throw new Error(`Failed to generate song: ${error.message}`);
  }
};

/**
 * Convert lyrics to song using ElevenLabs
 */
export const lyricToSong = async (lyrics: string): Promise<string> => {
  const startTime = performance.now();

  try {
    console.log('[SongService] Converting lyrics to song...');

    const response = await fetch(
      `${API_CONFIG.elevenlabs.baseUrl}/text-to-speech/${API_CONFIG.elevenlabs.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': API_CONFIG.elevenlabs.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: lyrics,
          model_id: API_CONFIG.elevenlabs.model,
          voice_settings: {
            stability: 0.3, // More expressive for singing
            similarity_boost: 0.8,
            style: 0.6, // More stylistic for singing
            use_speaker_boost: true,
          },
        }),
      }
    );

    console.log('[SongService] ElevenLabs response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[SongService] ElevenLabs error:', error);
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    // Save audio to file
    const audioBlob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          const fileUri = `${FileSystem.cacheDirectory}spending_song_${Date.now()}.mp3`;

          await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
            encoding: EncodingType.Base64,
          });

          const duration = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log(`[SongService] Song created in ${duration}s`);

          resolve(fileUri);
        } catch (error: any) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read audio blob'));
      reader.readAsDataURL(audioBlob);
    });
  } catch (error: any) {
    console.error('[SongService] Song creation error:', error.message);
    throw new Error(`Failed to create song: ${error.message}`);
  }
};
