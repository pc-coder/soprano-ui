import { formatCurrency } from './formatters';

interface ScreenContextData {
  currentScreen: string;
  screenData: Record<string, any>;
  formState: Record<string, any>;
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
    default:
      description += serializeGenericContext(screenData, formState);
  }

  return description.trim();
};

function serializeDashboardContext(data: Record<string, any>): string {
  let desc = 'Dashboard Overview:\n';

  if (data.balance !== undefined) {
    desc += `- Account balance: ${formatCurrency(data.balance)}\n`;
  }

  if (data.recentTransactions && Array.isArray(data.recentTransactions)) {
    desc += `- Showing ${data.recentTransactions.length} recent transactions\n`;

    if (data.recentTransactions.length > 0) {
      desc += '  Recent activity:\n';
      data.recentTransactions.slice(0, 3).forEach((txn: any) => {
        desc += `  • ${txn.name}: ${formatCurrency(txn.amount)}\n`;
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
  let desc = 'Payment Confirmation:\n';

  if (data.upiId) {
    desc += `- Recipient UPI ID: ${data.upiId}\n`;
  }

  if (data.amount !== undefined) {
    desc += `- Amount to send: ${formatCurrency(data.amount)}\n`;
  }

  if (data.recipientName) {
    desc += `- Recipient name: ${data.recipientName}\n`;
  }

  if (data.isNewRecipient) {
    desc += '- ⚠️ This is a first-time recipient\n';
  }

  return desc;
}

function serializeUPISuccessContext(data: Record<string, any>): string {
  let desc = 'Payment Successful:\n';

  if (data.transactionId) {
    desc += `- Transaction ID: ${data.transactionId}\n`;
  }

  if (data.amount !== undefined) {
    desc += `- Amount sent: ${formatCurrency(data.amount)}\n`;
  }

  if (data.recipientName) {
    desc += `- Sent to: ${data.recipientName}\n`;
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
 * Creates a system prompt for the LLM with screen context
 */
export const createSystemPrompt = (context: ScreenContextData): string => {
  const contextDescription = serializeContextForLLM(context);

  return `You are Soprano, a friendly and helpful AI banking assistant integrated into a mobile banking app.

Your role is to help users with their banking tasks, answer questions, and provide guidance based on what they're currently viewing.

CURRENT CONTEXT:
${contextDescription}

GUIDELINES:
- Be concise and conversational - this is a voice interface
- Reference what the user is seeing on screen when relevant
- Offer helpful suggestions based on the current context
- If the user asks to perform an action, explain what they need to do
- Keep responses under 2-3 sentences for voice delivery
- Use natural, friendly language - avoid overly formal banking jargon
- If you don't have enough context, ask clarifying questions

Example good responses:
- "I see you're on the dashboard. Your current balance is ₹45,230. Would you like to review recent transactions or make a payment?"
- "You're filling out a UPI payment form. I notice the amount field is empty - what amount would you like to send?"
- "Looks like there's an error with the UPI ID format. It should look like username@bankname, for example: ramesh@oksbi"`;
};
