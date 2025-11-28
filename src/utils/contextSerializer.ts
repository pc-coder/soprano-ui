import { formatCurrency, formatCurrencyForTTS } from './formatters';
import { FormFieldDefinition, ConversationEntry } from '../context/GuidedFormContext';

interface ScreenContextData {
  currentScreen: string;
  screenData: Record<string, any>;
  formState: Record<string, any>;
}

interface GuidedModeContext {
  isGuidedMode: boolean;
  currentField?: FormFieldDefinition;
  completedFields: string[];
  conversationHistory: ConversationEntry[];
  progress: { current: number; total: number };
}

/**
 * Serializes screen context into natural language for LLM consumption
 */
export const serializeContextForLLM = (context: ScreenContextData): string => {
  const { currentScreen, screenData, formState } = context;

  let description = `The user is currently on the ${currentScreen} screen.\n\n`;

  // Serialize screen-specific data
  switch (currentScreen) {
    case 'Dashboard':
      description += serializeDashboardContext(screenData);
      break;
    case 'Transactions':
      description += serializeTransactionsContext(screenData);
      break;
    case 'UPIPayment':
      description += serializeUPIPaymentContext(formState);
      break;
    case 'UPIConfirm':
      description += serializeUPIConfirmContext(screenData);
      break;
    case 'UPISuccess':
      description += serializeUPISuccessContext(screenData);
      break;
    case 'LoanApplication':
      description += serializeLoanApplicationContext(formState);
      break;
    default:
      description += serializeGenericContext(screenData, formState);
  }

  return description.trim();
};

function serializeDashboardContext(data: Record<string, any>): string {
  let desc = 'Dashboard Overview:\n';

  if (data.balance !== undefined) {
    desc += `- Account balance: ${formatCurrencyForTTS(data.balance)}\n`;
  }

  if (data.recentTransactions && Array.isArray(data.recentTransactions)) {
    desc += `- Showing ${data.recentTransactions.length} recent transactions\n`;

    if (data.recentTransactions.length > 0) {
      desc += '  Recent activity:\n';
      data.recentTransactions.slice(0, 3).forEach((txn: any) => {
        desc += `  • ${txn.name}: ${formatCurrencyForTTS(txn.amount)}\n`;
      });
    }
  }

  return desc;
}

function serializeTransactionsContext(data: Record<string, any>): string {
  let desc = 'Transaction History:\n';

  if (data.totalTransactions !== undefined) {
    desc += `- Total transactions: ${data.totalTransactions}\n`;
  }

  if (data.visibleTransactions !== undefined) {
    desc += `- Currently visible: ${data.visibleTransactions}\n`;
  }

  if (data.searchQuery) {
    desc += `- Search query: "${data.searchQuery}"\n`;
  }

  return desc;
}

function serializeUPIPaymentContext(formState: Record<string, any>): string {
  let desc = 'UPI Payment Form:\n';

  const upiId = formState.upiId || '';
  const amount = formState.amount || '';
  const note = formState.note || '';
  const errors = formState.errors || {};
  const focusedField = formState.focusedField;

  desc += `- UPI ID field: ${upiId || '(empty)'}\n`;
  desc += `- Amount field: ${amount || '(empty)'}\n`;
  desc += `- Note field: ${note || '(empty)'}\n`;

  if (focusedField) {
    desc += `- User is currently focused on: ${focusedField}\n`;
  }

  if (errors && Object.keys(errors).length > 0) {
    desc += '- Validation errors:\n';
    Object.entries(errors).forEach(([field, error]) => {
      if (error) desc += `  • ${field}: ${error}\n`;
    });
  }

  return desc;
}

function serializeUPIConfirmContext(data: Record<string, any>): string {
  let desc = 'UPI Payment Confirmation:\n';

  if (data.upiId) {
    desc += `- Recipient UPI ID: ${data.upiId}\n`;
  }

  if (data.amount !== undefined) {
    desc += `- Amount to send: ${formatCurrencyForTTS(data.amount)}\n`;
  }

  if (data.recipientName) {
    desc += `- Recipient name: ${data.recipientName}\n`;
  }

  if (data.isNewRecipient) {
    desc += '- Warning: This is a first-time recipient\n';
  }

  return desc;
}

function serializeUPISuccessContext(data: Record<string, any>): string {
  let desc = 'UPI Payment Successful:\n';

  if (data.transactionId) {
    desc += `- Transaction ID: ${data.transactionId}\n`;
  }

  if (data.amount !== undefined) {
    desc += `- Amount sent: ${formatCurrencyForTTS(data.amount)}\n`;
  }

  if (data.recipientName) {
    desc += `- Sent to: ${data.recipientName}\n`;
  }

  return desc;
}

function serializeLoanApplicationContext(formState: Record<string, any>): string {
  let desc = 'Loan Application Form:\n';

  const loanAmount = formState.loanAmount || '';
  const address = formState.address || '';
  const panNumber = formState.panNumber || '';
  const errors = formState.errors || {};
  const focusedField = formState.focusedField;

  desc += `- Loan amount field: ${loanAmount || '(empty)'}\n`;
  desc += `- Address field: ${address || '(empty)'}\n`;
  desc += `- PAN number field: ${panNumber || '(empty)'}\n`;

  if (focusedField) {
    desc += `- User is currently focused on: ${focusedField}\n`;
  }

  if (errors && Object.keys(errors).length > 0) {
    desc += '- Validation errors:\n';
    Object.entries(errors).forEach(([field, error]) => {
      if (error) desc += `  • ${field}: ${error}\n`;
    });
  }

  return desc;
}

function serializeGenericContext(
  screenData: Record<string, any>,
  formState: Record<string, any>
): string {
  let desc = '';

  if (Object.keys(screenData).length > 0) {
    desc += 'Screen Data:\n';
    Object.entries(screenData).forEach(([key, value]) => {
      desc += `- ${key}: ${JSON.stringify(value)}\n`;
    });
  }

  if (Object.keys(formState).length > 0) {
    desc += 'Form State:\n';
    Object.entries(formState).forEach(([key, value]) => {
      desc += `- ${key}: ${JSON.stringify(value)}\n`;
    });
  }

  return desc || 'No specific context data available.\n';
}

/**
 * Serializes guided mode context
 */
function serializeGuidedModeContext(guided: GuidedModeContext): string {
  if (!guided.isGuidedMode || !guided.currentField) {
    return '';
  }

  let desc = '\n🎯 GUIDED FORM MODE ACTIVE\n\n';
  desc += `Current Task: Fill the "${guided.currentField.label}" field\n`;
  desc += `Progress: Step ${guided.progress.current} of ${guided.progress.total}\n`;
  desc += `Field Prompt: ${guided.currentField.prompt}\n`;
  desc += `Field Type: ${guided.currentField.type || 'text'}\n`;
  desc += `Required: ${guided.currentField.required ? 'Yes' : 'No (can be skipped)'}\n`;

  if (guided.completedFields.length > 0) {
    desc += `\nCompleted Fields: ${guided.completedFields.join(', ')}\n`;
  }

  if (guided.conversationHistory.length > 0) {
    desc += '\nRecent conversation:\n';
    guided.conversationHistory.slice(-3).forEach((entry) => {
      desc += `  - ${entry.field}: User said "${entry.userInput}" → Parsed as: ${entry.parsedValue}\n`;
    });
  }

  return desc;
}

/**
 * Creates a system prompt for the LLM with screen context
 */
export const createSystemPrompt = (
  context: ScreenContextData,
  guidedContext?: GuidedModeContext,
  elementRegistry?: Array<{ id: string; description: string }>
): string => {
  const contextDescription = serializeContextForLLM(context);
  const guidedDescription = guidedContext ? serializeGuidedModeContext(guidedContext) : '';

  // Base prompt for free conversation mode
  let basePrompt = `You are Soprano, a friendly and helpful AI voice assistant for an Indian digital banking app.

Your role is to help users with their banking tasks using Indian payment systems (UPI, NEFT, IMPS), answer questions, and provide guidance based on what they're currently viewing.

IMPORTANT: This is a VOICE interface. Always say "rupees" for currency amounts, never use symbols like ₹ or Rs.

CURRENT CONTEXT:
${contextDescription}`;

  // If in guided mode, add guided-specific instructions
  if (guidedContext?.isGuidedMode && guidedContext.currentField) {
    basePrompt += `\n${guidedDescription}

GUIDED MODE INSTRUCTIONS:
You are helping the user fill out a form field-by-field using voice.

IMPORTANT: The user has ALREADY been asked: "${guidedContext.currentField.prompt}"
The user has just spoken their response. Your job is to extract the value from what they said.

YOUR TASK:
1. The user was asked for the "${guidedContext.currentField.label}" field
2. The user's spoken response is in the transcript below
3. Extract the value they said for this SPECIFIC field ONLY
4. Respond with a confirmation message

RESPONSE FORMAT:
You must respond with valid JSON in the following format:
{
  "action": "fill_field",
  "field": "${guidedContext.currentField.name}",
  "value": "<extracted_value>",
  "message": "<friendly confirmation message to speak to user>"
}

SPECIAL CASES:
- If user says "skip" or "no" for optional fields: {"action": "skip", "message": "Okay, skipping this field"}
- If user says "go back" or "change previous": {"action": "go_back", "message": "Going back to the previous field"}
- If user says "cancel" or "stop": {"action": "cancel", "message": "Canceling form filling"}
- If response is unclear: {"action": "clarify", "message": "I didn't catch that. Could you please repeat?"}

VALUE EXTRACTION RULES:
- For UPI IDs: Convert "arvind at paytm" → "arvind@paytm", "john at oksbi" → "john@oksbi", "priya at phonepe" → "priya@phonepe"
- For amounts: Convert "five hundred rupees" → "500", "two thousand five hundred" → "2500", "fifteen thousand" → "15000"
  - Also handle: "one lakh" → "100000", "two lakh fifty thousand" → "250000"
- For text: Extract as-is

CRITICAL RULES:
1. DO NOT ask any questions - only extract and confirm
2. DO NOT mention other fields - only the current field: "${guidedContext.currentField.label}"
3. The message should be a confirmation like "Got it, I've set the ${guidedContext.currentField.label} to [value]"
4. Only return the JSON, no additional text before or after`;
  } else {
    // Free conversation mode instructions
    basePrompt += `

GUIDELINES:
- Be concise and conversational - this is a voice interface
- Reference what the user is seeing on screen when relevant
- Offer helpful suggestions based on the current context
- If the user asks to perform an action, explain what they need to do
- Keep responses under 2-3 sentences for voice delivery
- Use natural, friendly language - avoid overly formal banking jargon
- If you don't have enough context, ask clarifying questions

Example good responses:
- "I see you're on the dashboard. Your current balance is 45,230 rupees. Would you like to review recent transactions or make a UPI payment?"
- "You're filling out a UPI payment form. I notice the amount field is empty - how many rupees would you like to send?"
- "Looks like there's an error with the UPI ID format. It should look like username at bank name, for example: ramesh at oksbi or priya at phonepe"`;

    // Add navigation assistance if element registry is provided
    if (elementRegistry && elementRegistry.length > 0) {
      basePrompt += `

VISUAL NAVIGATION ASSISTANCE:
If the user asks "how to", "where is", "how do I", or navigation questions, you can guide them visually.

Available interactive elements on this screen:
${elementRegistry.map(e => `- ${e.id}: ${e.description}`).join('\n')}

When user asks navigation questions, respond with JSON in this format:
{
  "type": "navigation_guide",
  "element_id": "history-button",
  "instruction": "Tap the History button to view all your transactions"
}

The system will highlight the element and speak your instruction.

ONLY use navigation_guide when user explicitly asks how to do something or where something is.
For general conversation, respond normally without JSON.`;
    }
  }

  return basePrompt;
};
