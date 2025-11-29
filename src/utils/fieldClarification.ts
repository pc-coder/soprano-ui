import { FormFieldDefinition } from '../context/GuidedFormContext';

/**
 * Finds the best matching clarification for a user's question
 */
export const findClarification = (
  question: string,
  field: FormFieldDefinition
): string | null => {
  if (!field.clarifications) {
    return null;
  }

  const normalizedQuestion = question.toLowerCase().trim();

  // Direct match
  if (field.clarifications[normalizedQuestion]) {
    return field.clarifications[normalizedQuestion];
  }

  // Fuzzy match - check if question contains any clarification key
  for (const [key, answer] of Object.entries(field.clarifications)) {
    if (normalizedQuestion.includes(key.toLowerCase())) {
      return answer;
    }
  }

  // Check if any clarification key is contained in the question
  for (const [key, answer] of Object.entries(field.clarifications)) {
    const keyWords = key.toLowerCase().split(' ');
    const matchCount = keyWords.filter(word =>
      normalizedQuestion.includes(word) && word.length > 2
    ).length;

    // If more than half the keywords match, return this clarification
    if (matchCount >= Math.ceil(keyWords.length / 2)) {
      return answer;
    }
  }

  return null;
};

/**
 * Gets all available help information for a field
 */
export const getFieldHelp = (field: FormFieldDefinition): string => {
  const parts: string[] = [];

  if (field.description) {
    parts.push(field.description);
  }

  if (field.helpText) {
    parts.push(field.helpText);
  }

  if (field.tips && field.tips.length > 0) {
    parts.push('\nHelpful tips:\n' + field.tips.map(tip => `• ${tip}`).join('\n'));
  }

  if (field.examples && field.examples.length > 0) {
    parts.push('\nExamples: ' + field.examples.slice(0, 3).join(', '));
  }

  return parts.join('\n\n');
};

/**
 * Checks if user input seems like a question rather than a field value
 */
export const isQuestionLike = (input: string): boolean => {
  const normalizedInput = input.toLowerCase().trim();

  // Question keywords
  const questionPatterns = [
    /^(what|why|how|when|where|which|who|can|could|should|would|is|are|do|does)/,
    /\?$/,
    /(explain|tell me|help|difference|compare|meaning|mean|better|recommend)/,
  ];

  return questionPatterns.some(pattern => pattern.test(normalizedInput));
};

/**
 * Generates a comprehensive help response for field-related questions
 */
export const generateHelpResponse = (
  question: string,
  field: FormFieldDefinition
): string => {
  // First, try to find a specific clarification
  const clarification = findClarification(question, field);
  if (clarification) {
    return clarification;
  }

  // If no specific clarification found, provide general help based on question type
  const normalizedQuestion = question.toLowerCase();

  // Check for specific types of questions
  if (normalizedQuestion.includes('example')) {
    if (field.examples && field.examples.length > 0) {
      return `Here are some examples for ${field.label}: ${field.examples.join(', ')}`;
    }
  }

  if (normalizedQuestion.includes('tip') || normalizedQuestion.includes('suggest')) {
    if (field.tips && field.tips.length > 0) {
      return `Here are some tips for ${field.label}:\n${field.tips.map(tip => `• ${tip}`).join('\n')}`;
    }
  }

  if (normalizedQuestion.includes('what is') || normalizedQuestion.includes('explain')) {
    if (field.helpText) {
      return field.helpText;
    }
    if (field.description) {
      return field.description;
    }
  }

  // Default: return general help
  return getFieldHelp(field);
};

/**
 * Formats metadata for AI context
 */
export const getFieldMetadataForAI = (field: FormFieldDefinition): string => {
  const parts: string[] = [];

  parts.push(`Field: ${field.label}`);

  if (field.description) {
    parts.push(`Description: ${field.description}`);
  }

  if (field.helpText) {
    parts.push(`Help: ${field.helpText}`);
  }

  if (field.tips && field.tips.length > 0) {
    parts.push(`Tips:\n${field.tips.map(tip => `- ${tip}`).join('\n')}`);
  }

  if (field.examples && field.examples.length > 0) {
    parts.push(`Examples: ${field.examples.join(', ')}`);
  }

  if (field.clarifications) {
    parts.push('\nCommon Questions & Answers:');
    for (const [question, answer] of Object.entries(field.clarifications)) {
      parts.push(`Q: ${question}\nA: ${answer}\n`);
    }
  }

  return parts.join('\n');
};
