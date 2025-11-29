/**
 * Types for parsed responses from LLM in guided mode
 */
export type GuidedResponseAction = 'fill_field' | 'skip' | 'go_back' | 'cancel' | 'clarify' | 'scan_document' | 'provide_clarification';

export interface ParsedGuidedResponse {
  action: GuidedResponseAction;
  field?: string;
  value?: any;
  message: string;
  documentType?: 'address' | 'pan';
}

/**
 * Parse LLM response for guided mode
 * Extracts JSON from the response and handles various formats
 */
export const parseGuidedResponse = (responseText: string): ParsedGuidedResponse => {
  try {
    // Try to extract JSON from the response
    // The LLM might wrap JSON in markdown code blocks or add extra text
    let jsonStr = responseText.trim();

    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Try to find JSON object in the text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    // Parse the JSON
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.action || !parsed.message) {
      throw new Error('Missing required fields: action or message');
    }

    // Validate action type
    const validActions: GuidedResponseAction[] = ['fill_field', 'skip', 'go_back', 'cancel', 'clarify', 'scan_document', 'provide_clarification'];
    if (!validActions.includes(parsed.action)) {
      throw new Error(`Invalid action: ${parsed.action}`);
    }

    return {
      action: parsed.action,
      field: parsed.field,
      value: parsed.value,
      message: parsed.message,
      documentType: parsed.documentType,
    };
  } catch (error: any) {
    console.error('[ResponseParser] Error parsing guided response:', error.message);
    console.error('[ResponseParser] Original response:', responseText);

    // Fallback: try to extract value from natural language
    return parseFallbackResponse(responseText);
  }
};

/**
 * Fallback parser when JSON parsing fails
 * Attempts to extract intent and value from natural language
 */
function parseFallbackResponse(responseText: string): ParsedGuidedResponse {
  const lowerText = responseText.toLowerCase();

  // Check for skip intent
  if (lowerText.includes('skip') || lowerText.includes('skipping')) {
    return {
      action: 'skip',
      message: responseText,
    };
  }

  // Check for go back intent
  if (lowerText.includes('go back') || lowerText.includes('previous')) {
    return {
      action: 'go_back',
      message: responseText,
    };
  }

  // Check for cancel intent
  if (lowerText.includes('cancel') || lowerText.includes('stop')) {
    return {
      action: 'cancel',
      message: responseText,
    };
  }

  // Check for clarification needed
  if (lowerText.includes('didn\'t catch') || lowerText.includes('repeat') || lowerText.includes('sorry')) {
    return {
      action: 'clarify',
      message: responseText,
    };
  }

  // Default: assume it's a clarification or free-form response
  return {
    action: 'clarify',
    message: responseText,
  };
}

/**
 * Extract numeric value from natural language
 * Examples: "five hundred" -> 500, "2500 rupees" -> 2500
 */
export const parseNumericValue = (text: string): number | null => {
  const lowerText = text.toLowerCase().trim();

  // First try to find a direct number
  const directNumber = lowerText.match(/\d+(?:,\d{3})*(?:\.\d+)?/);
  if (directNumber) {
    return parseFloat(directNumber[0].replace(/,/g, ''));
  }

  // Word to number mappings
  const wordToNum: Record<string, number> = {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90,
    'hundred': 100,
    'thousand': 1000,
    'lakh': 100000,
    'lac': 100000,
    'crore': 10000000,
  };

  // Try to parse word-based numbers (e.g., "five hundred")
  let total = 0;
  let current = 0;

  const words = lowerText.replace(/[^a-z\s]/g, '').split(/\s+/);

  for (const word of words) {
    const num = wordToNum[word];
    if (num !== undefined) {
      if (num >= 1000) {
        current = (current || 1) * num;
        total += current;
        current = 0;
      } else if (num === 100) {
        current = (current || 1) * 100;
      } else {
        current += num;
      }
    }
  }

  const result = total + current;
  return result > 0 ? result : null;
};

/**
 * Parse UPI ID from natural language
 * Examples: "arvind at paytm" -> "arvind@paytm"
 */
export const parseUPIId = (text: string): string | null => {
  const lowerText = text.toLowerCase().trim();

  // Replace "at" with "@"
  let upiId = lowerText.replace(/\s+at\s+/g, '@');

  // Remove common filler words
  upiId = upiId.replace(/\b(the|is|it's|its)\b/g, '').trim();

  // Check if it looks like a valid UPI ID (has @ and domain)
  if (upiId.includes('@') && /^[a-z0-9._-]+@[a-z0-9.-]+$/i.test(upiId)) {
    return upiId;
  }

  // Try to extract UPI ID pattern directly
  const upiMatch = text.match(/([a-z0-9._-]+)@([a-z0-9.-]+)/i);
  if (upiMatch) {
    return upiMatch[0].toLowerCase();
  }

  return null;
};

/**
 * Check if text indicates user wants to skip
 */
export const isSkipIntent = (text: string): boolean => {
  const lowerText = text.toLowerCase().trim();
  const skipWords = ['skip', 'no', 'nope', 'nothing', 'leave it', 'leave blank', 'don\'t want'];
  return skipWords.some((word) => lowerText.includes(word));
};

/**
 * Check if text indicates user wants to go back
 */
export const isGoBackIntent = (text: string): boolean => {
  const lowerText = text.toLowerCase().trim();
  const goBackWords = ['go back', 'previous', 'back', 'change previous', 'undo'];
  return goBackWords.some((word) => lowerText.includes(word));
};

/**
 * Check if text indicates user wants to cancel
 */
export const isCancelIntent = (text: string): boolean => {
  const lowerText = text.toLowerCase().trim();
  const cancelWords = ['cancel', 'stop', 'quit', 'exit', 'abort', 'nevermind', 'never mind'];
  return cancelWords.some((word) => lowerText.includes(word));
};
