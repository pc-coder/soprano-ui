import { FormFieldDefinition } from '../context/GuidedFormContext';
import { ParsedGuidedResponse, parseGuidedResponse, parseNumericValue, parseUPIId } from './responseParser';

/**
 * Process a guided form response and extract the appropriate value based on field type
 */
export const processFieldResponse = (
  response: string,
  field: FormFieldDefinition
): ParsedGuidedResponse => {
  // First, try to parse as structured response
  const parsed = parseGuidedResponse(response);

  // If it's a special action (skip, go_back, cancel, clarify), return as-is
  if (parsed.action !== 'fill_field') {
    return parsed;
  }

  // If we got a value from JSON parsing, use it
  if (parsed.value !== undefined && parsed.value !== null) {
    return parsed;
  }

  // Otherwise, try to extract value based on field type
  let extractedValue: any = null;

  switch (field.type) {
    case 'number':
      extractedValue = parseNumericValue(response);
      break;

    case 'email':
      // For UPI IDs (email-like format)
      extractedValue = parseUPIId(response);
      break;

    case 'text':
    default:
      // For text fields, use the response as-is (cleaned up)
      extractedValue = response.trim();
      break;
  }

  return {
    action: 'fill_field',
    field: field.name,
    value: extractedValue,
    message: parsed.message || `Got it, ${extractedValue}`,
  };
};

/**
 * Validate field value
 */
export const validateFieldValue = (
  value: any,
  field: FormFieldDefinition,
  formData?: Record<string, any>
): { valid: boolean; error?: string; warning?: string } => {
  // Check if required field is empty
  if (field.required && (value === null || value === undefined || value === '')) {
    return {
      valid: false,
      error: `${field.label} is required`,
    };
  }

  // Run field-specific validation if provided
  if (field.validation && value) {
    return field.validation(value, formData);
  }

  return { valid: true };
};

/**
 * Generate initial prompt for a field
 */
export const generateFieldPrompt = (field: FormFieldDefinition, isFirstField: boolean): string => {
  if (isFirstField) {
    return `I'll help you fill this form. ${field.prompt}`;
  }
  return field.prompt;
};

/**
 * Generate error re-prompt when validation fails
 */
export const generateErrorPrompt = (field: FormFieldDefinition, error: string): string => {
  return `I'm sorry, but ${error}. ${field.prompt}`;
};

/**
 * Generate completion message
 */
export const generateCompletionMessage = (completedFieldsCount: number): string => {
  if (completedFieldsCount === 1) {
    return "Great! I've filled in that field. Let's move to the next one.";
  }
  return "Perfect! Moving to the next field.";
};

/**
 * Generate final message when all fields are complete
 */
export const generateFinalMessage = (totalFields: number): string => {
  return `All done! I've filled in all ${totalFields} fields. You can review and submit when ready.`;
};

/**
 * Determine if we should automatically ask the next question
 * (vs waiting for user to initiate)
 */
export const shouldAutoAskNext = (field: FormFieldDefinition): boolean => {
  // Always auto-ask for required fields
  if (field.required) {
    return true;
  }

  // For optional fields, still auto-ask but mention it's optional
  return true;
};
