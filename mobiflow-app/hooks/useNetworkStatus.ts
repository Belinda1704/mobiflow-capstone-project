// Network status for offline support - exposes isConnected for UI (banner, etc.)
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setState);
    NetInfo.fetch().then(setState);
    return () => unsubscribe();
  }, []);

  const isConnected = state?.isConnected ?? true;
  const isInternetReachable = state?.isInternetReachable ?? true;
  // Show offline when device is disconnected; else assume online
  const isOffline = state != null && state.isConnected === false;

  return { isConnected, isInternetReachable, isOffline, state };
}
