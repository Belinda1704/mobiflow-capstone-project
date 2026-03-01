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
  // Show "offline" when the app knows the device is disconnected; if unknown, assume online to avoid flashing
  const isOffline = state != null && state.isConnected === false;

  return { isConnected, isInternetReachable, isOffline, state };
}
