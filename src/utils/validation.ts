export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

export const validateUPIId = (upi: string): ValidationResult => {
  if (!upi || upi.trim() === '') {
    return { valid: false, error: 'UPI ID is required' };
  }

  if (!upi.includes('@')) {
    return { valid: false, error: 'UPI ID must contain @' };
  }

  const upiRegex = /^[\w.-]+@[\w]+$/;
  if (!upiRegex.test(upi)) {
    return { valid: false, error: 'Invalid UPI ID format' };
  }

  return { valid: true };
};

export const validateAmount = (amount: number, balance: number): ValidationResult => {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Enter a valid amount' };
  }

  if (amount > balance) {
    return { valid: false, error: 'Insufficient balance' };
  }

  if (amount > 100000) {
    return { valid: false, error: 'Amount exceeds daily limit of ₹1,00,000' };
  }

  if (amount > 10000) {
    return { valid: true, warning: 'Large transaction - please verify details' };
  }

  return { valid: true };
};

export const validateIFSC = (ifsc: string): ValidationResult => {
  if (!ifsc || ifsc.trim() === '') {
    return { valid: false, error: 'IFSC code is required' };
  }

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifsc.toUpperCase())) {
    return {
      valid: false,
      error: 'Invalid IFSC format. Should be like SBIN0001234 (5th character must be 0)'
    };
  }

  return { valid: true };
};

export const validateAccountNumber = (accNum: string): ValidationResult => {
  if (!accNum || accNum.trim() === '') {
    return { valid: false, error: 'Account number is required' };
  }

  if (!/^\d{9,18}$/.test(accNum)) {
    return { valid: false, error: 'Account number must be 9-18 digits' };
  }

  return { valid: true };
};
