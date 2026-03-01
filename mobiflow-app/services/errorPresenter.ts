import { Alert } from 'react-native';

// Show errors/confirm dialogs (screens call this instead of Alert).
export function showError(title: string, message: string): void {
  Alert.alert(title, message);
}

// Confirm dialog; onConfirm on tap.
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
): void {
  const { confirmText = 'OK', cancelText = 'Cancel', destructive = false } = options ?? {};
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => { void onConfirm(); } },
  ]);
}
