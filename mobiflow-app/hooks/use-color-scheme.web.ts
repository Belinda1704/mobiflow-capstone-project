import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/** On web the app needs to read the color scheme on the client so it works with static rendering. */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
