// Load Jest matchers from @testing-library/react-native (toBeOnTheScreen, etc.) so TS recognizes them in tests
/// <reference path="./node_modules/@testing-library/react-native/build/matchers/extend-expect.d.ts" />

// Type declaration for @maniac-tech/react-native-expo-read-sms (no official types)
declare module '@maniac-tech/react-native-expo-read-sms' {
  export function startReadSMS(callback: (status: string, payload: string, err?: string) => void): void;
  export function stopReadSMS(): void;
  export function checkIfHasSMSPermission(): Promise<{
    hasReceiveSmsPermission: boolean;
    hasReadSmsPermission: boolean;
  }>;
  export function requestReadSMSPermission(): Promise<boolean>;
  // Custom method to read past SMS messages from inbox
  export function readPastSMS(limit?: number): Promise<Array<{ body: string; address: string; timestamp: number }>>;
  // Read past sent SMS (outgoing / transfers)
  export function readPastSentSMS(limit?: number): Promise<Array<{ body: string; address: string; timestamp: number }>>;
}

// types for firebase/auth/react-native (Metro can't resolve the path)
declare module 'firebase/auth/react-native' {
  import type { FirebaseApp } from 'firebase/app';
  import type { Auth, Persistence } from 'firebase/auth';
  import type AsyncStorage from '@react-native-async-storage/async-storage';

  export function initializeAuth(
    app: FirebaseApp,
    options: { persistence: Persistence }
  ): Auth;

  export function getReactNativePersistence(
    storage: typeof AsyncStorage
  ): Persistence;
}
