import { useCallback } from 'react';
import { TextInput } from 'react-native';

/**
 * Hook for programmatically controlling form fields
 * Provides methods to fill fields, focus them, and trigger validation
 */
export const useFormController = () => {
  /**
   * Fill a form field with a value
   */
  const fillField = useCallback(
    (
      fieldRef: React.RefObject<TextInput> | undefined,
      value: string,
      onChangeText: (text: string) => void,
      onBlur?: () => void
    ): boolean => {
      if (!fieldRef?.current) {
        console.warn('[FormController] Field ref not available');
        return false;
      }

      try {
        // Set the value via the onChange handler (this updates state)
        onChangeText(value);

        // Focus the field briefly to show user what was filled
        fieldRef.current.focus();

        // Trigger blur after a short delay to run validation
        if (onBlur) {
          setTimeout(() => {
            fieldRef.current?.blur();
            onBlur();
          }, 300);
        }

        console.log('[FormController] Field filled with value:', value);
        return true;
      } catch (error) {
        console.error('[FormController] Error filling field:', error);
        return false;
      }
    },
    []
  );

  /**
   * Focus a specific form field
   */
  const focusField = useCallback((fieldRef: React.RefObject<TextInput> | undefined): boolean => {
    if (!fieldRef?.current) {
      console.warn('[FormController] Field ref not available for focus');
      return false;
    }

    try {
      fieldRef.current.focus();
      console.log('[FormController] Field focused');
      return true;
    } catch (error) {
      console.error('[FormController] Error focusing field:', error);
      return false;
    }
  }, []);

  /**
   * Blur a specific form field (useful for triggering validation)
   */
  const blurField = useCallback((fieldRef: React.RefObject<TextInput> | undefined): boolean => {
    if (!fieldRef?.current) {
      console.warn('[FormController] Field ref not available for blur');
      return false;
    }

    try {
      fieldRef.current.blur();
      console.log('[FormController] Field blurred');
      return true;
    } catch (error) {
      console.error('[FormController] Error blurring field:', error);
      return false;
    }
  }, []);

  /**
   * Clear a form field
   */
  const clearField = useCallback(
    (fieldRef: React.RefObject<TextInput> | undefined, onChangeText: (text: string) => void): boolean => {
      if (!fieldRef?.current) {
        console.warn('[FormController] Field ref not available for clear');
        return false;
      }

      try {
        onChangeText('');
        console.log('[FormController] Field cleared');
        return true;
      } catch (error) {
        console.error('[FormController] Error clearing field:', error);
        return false;
      }
    },
    []
  );

  return {
    fillField,
    focusField,
    blurField,
    clearField,
  };
};
