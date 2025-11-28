import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TextInput } from 'react-native';

export interface FormFieldDefinition {
  name: string;
  label: string;
  prompt: string;
  validation?: (value: any, formData?: Record<string, any>) => { valid: boolean; error?: string };
  required: boolean;
  refName: string;
  type?: 'text' | 'number' | 'email';
}

export interface ConversationEntry {
  field: string;
  userInput: string;
  parsedValue: any;
  timestamp: number;
}

interface GuidedFormState {
  isGuidedMode: boolean;
  currentFieldIndex: number;
  completedFields: string[];
  fieldDefinitions: FormFieldDefinition[];
  conversationHistory: ConversationEntry[];
  formRefs: Record<string, React.RefObject<TextInput>>;
}

interface GuidedFormContextType extends GuidedFormState {
  startGuidedMode: (fields: FormFieldDefinition[], refs: Record<string, React.RefObject<TextInput>>) => void;
  stopGuidedMode: () => void;
  moveToNextField: () => FormFieldDefinition | null;
  moveToPreviousField: () => FormFieldDefinition | null;
  updateFieldValue: (fieldName: string, userInput: string, parsedValue: any) => void;
  skipCurrentField: () => void;
  getCurrentField: () => FormFieldDefinition | null;
  isLastField: () => boolean;
  getProgress: () => { current: number; total: number; percentage: number };
  reset: () => void;
}

const GuidedFormContext = createContext<GuidedFormContextType | undefined>(undefined);

export const useGuidedForm = () => {
  const context = useContext(GuidedFormContext);
  if (!context) {
    throw new Error('useGuidedForm must be used within GuidedFormProvider');
  }
  return context;
};

interface GuidedFormProviderProps {
  children: ReactNode;
}

const initialState: GuidedFormState = {
  isGuidedMode: false,
  currentFieldIndex: 0,
  completedFields: [],
  fieldDefinitions: [],
  conversationHistory: [],
  formRefs: {},
};

export const GuidedFormProvider: React.FC<GuidedFormProviderProps> = ({ children }) => {
  const [isGuidedMode, setIsGuidedMode] = useState(initialState.isGuidedMode);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(initialState.currentFieldIndex);
  const [completedFields, setCompletedFields] = useState<string[]>(initialState.completedFields);
  const [fieldDefinitions, setFieldDefinitions] = useState<FormFieldDefinition[]>(initialState.fieldDefinitions);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>(initialState.conversationHistory);
  const [formRefs, setFormRefs] = useState<Record<string, React.RefObject<TextInput>>>(initialState.formRefs);

  const startGuidedMode = (fields: FormFieldDefinition[], refs: Record<string, React.RefObject<TextInput>>) => {
    console.log('[GuidedForm] Starting guided mode with', fields.length, 'fields');
    console.log('[GuidedForm] First field:', fields[0]?.name, '-', fields[0]?.label);
    setFieldDefinitions(fields);
    setFormRefs(refs);
    setCurrentFieldIndex(0);
    setCompletedFields([]);
    setConversationHistory([]);
    setIsGuidedMode(true); // Set this last to ensure all state is ready
  };

  const stopGuidedMode = () => {
    console.log('[GuidedForm] Stopping guided mode');
    setIsGuidedMode(false);
    setCurrentFieldIndex(0);
    setCompletedFields([]);
    setConversationHistory([]);
  };

  const moveToNextField = (): FormFieldDefinition | null => {
    if (currentFieldIndex < fieldDefinitions.length - 1) {
      const nextIndex = currentFieldIndex + 1;
      const nextField = fieldDefinitions[nextIndex];
      console.log('[GuidedForm] Moving to field', nextIndex, ':', nextField?.name);
      setCurrentFieldIndex(nextIndex);
      return nextField || null;
    } else {
      console.log('[GuidedForm] All fields completed');
      stopGuidedMode();
      return null;
    }
  };

  const moveToPreviousField = (): FormFieldDefinition | null => {
    if (currentFieldIndex > 0) {
      const prevIndex = currentFieldIndex - 1;
      const prevField = fieldDefinitions[prevIndex];
      console.log('[GuidedForm] Moving back to field', prevIndex, ':', prevField?.name);
      setCurrentFieldIndex(prevIndex);
      // Remove the previous field from completed list
      const prevFieldName = prevField?.name;
      if (prevFieldName) {
        setCompletedFields((prev) => prev.filter((f) => f !== prevFieldName));
      }
      return prevField || null;
    }
    return null;
  };

  const updateFieldValue = (fieldName: string, userInput: string, parsedValue: any) => {
    console.log('[GuidedForm] Field updated:', fieldName, '=', parsedValue);

    // Add to conversation history
    setConversationHistory((prev) => [
      ...prev,
      {
        field: fieldName,
        userInput,
        parsedValue,
        timestamp: Date.now(),
      },
    ]);

    // Mark field as completed
    if (!completedFields.includes(fieldName)) {
      setCompletedFields((prev) => [...prev, fieldName]);
    }
  };

  const skipCurrentField = () => {
    const currentField = getCurrentField();
    if (currentField && !currentField.required) {
      console.log('[GuidedForm] Skipping optional field:', currentField.name);
      updateFieldValue(currentField.name, '(skipped)', null);
      moveToNextField();
    }
  };

  const getCurrentField = (): FormFieldDefinition | null => {
    const field = fieldDefinitions[currentFieldIndex] || null;
    if (isGuidedMode && !field) {
      console.warn('[GuidedForm] getCurrentField returned null. Index:', currentFieldIndex, 'Total fields:', fieldDefinitions.length);
    }
    return field;
  };

  const isLastField = (): boolean => {
    return currentFieldIndex === fieldDefinitions.length - 1;
  };

  const getProgress = () => {
    const total = fieldDefinitions.length;
    const current = currentFieldIndex + 1;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return { current, total, percentage };
  };

  const reset = () => {
    setIsGuidedMode(initialState.isGuidedMode);
    setCurrentFieldIndex(initialState.currentFieldIndex);
    setCompletedFields(initialState.completedFields);
    setFieldDefinitions(initialState.fieldDefinitions);
    setConversationHistory(initialState.conversationHistory);
    setFormRefs(initialState.formRefs);
  };

  const value: GuidedFormContextType = {
    isGuidedMode,
    currentFieldIndex,
    completedFields,
    fieldDefinitions,
    conversationHistory,
    formRefs,
    startGuidedMode,
    stopGuidedMode,
    moveToNextField,
    moveToPreviousField,
    updateFieldValue,
    skipCurrentField,
    getCurrentField,
    isLastField,
    getProgress,
    reset,
  };

  return <GuidedFormContext.Provider value={value}>{children}</GuidedFormContext.Provider>;
};
