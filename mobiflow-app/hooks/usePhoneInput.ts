import { useState, useCallback } from 'react';

import { autoFormatPhoneInput } from '../utils/phoneUtils';

/** Phone input that auto-formats (e.g. adds leading 0 for 9 digits). Screens just use value and onChangeText. */
export function usePhoneInput(initialValue = ''): {
  value: string;
  onChangeText: (text: string) => void;
  setValue: (v: string) => void;
} {
  const [value, setValue] = useState(initialValue);

  const onChangeText = useCallback((text: string) => {
    const formatted = autoFormatPhoneInput(text);
    setValue(formatted);
  }, []);

  return { value, onChangeText, setValue };
}
