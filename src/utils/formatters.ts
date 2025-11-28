export const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return amount < 0 ? `-${formatted}` : formatted;
};

/**
 * Format currency for Text-to-Speech (TTS) output
 * Outputs "rupees" instead of ₹ symbol for proper voice pronunciation
 * @example formatCurrencyForTTS(5000) => "5,000 rupees"
 * @example formatCurrencyForTTS(450.50) => "450.50 rupees"
 */
export const formatCurrencyForTTS = (amount: number): string => {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  // Add "rupee" or "rupees" suffix
  const suffix = absAmount === 1 ? 'rupee' : 'rupees';

  return amount < 0 ? `minus ${formatted} ${suffix}` : `${formatted} ${suffix}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const maskAccountNumber = (accNum: string): string => {
  if (accNum.length <= 4) return accNum;
  return '****' + accNum.slice(-4);
};

export const generateTransactionId = (): string => {
  return 'TXN' + Date.now().toString() + Math.random().toString(36).substr(2, 4).toUpperCase();
};
