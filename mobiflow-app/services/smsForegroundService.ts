// Android foreground service for SMS capture (Notifee, background read). Android only.
import { Platform, PermissionsAndroid } from 'react-native';

const SMS_CAPTURE_CHANNEL_ID = 'mobiflow-sms-capture';
const NOTIFICATION_ID = 'mobiflow-sms-foreground';

let notifee: any | null = null;
let isServiceRunning = false;

function getNotifee(): any | null {
  if (notifee) return notifee;
  try {
    notifee = require('@notifee/react-native').default;
    return notifee;
  } catch {
    return null;
  }
}

// Create notification channel (Android 8+). Call once at start.
export async function createSmsCaptureChannel(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  const n = getNotifee();
  if (!n) return null;
  try {
    await n.createChannel({
      id: SMS_CAPTURE_CHANNEL_ID,
      name: 'SMS capture',
      importance: 4, // AndroidImportance.DEFAULT
      sound: undefined,
    });
    return SMS_CAPTURE_CHANNEL_ID;
  } catch (e) {
    console.warn('[SMS Foreground] Failed to create channel:', e);
    return null;
  }
}

// Notification permission (Android 13+) for foreground.
async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const v = Number(Platform.Version);
  if (v < 33) return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'MobiFlow notifications',
        message: 'Allow notifications so MobiFlow can show when it is capturing mobile money SMS in the background.',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

// Start foreground service; show notification so SMS listener keeps running.
export async function startSmsForegroundService(title?: string, body?: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const n = getNotifee();
  if (!n) {
    console.warn('[SMS Foreground] Notifee not available');
    return false;
  }
  if (isServiceRunning) {
    console.log('[SMS Foreground] Service already running');
    return true;
  }
  try {
    await ensureNotificationPermission();
    await createSmsCaptureChannel();
    await n.displayNotification({
      id: NOTIFICATION_ID,
      title: title ?? 'MobiFlow',
      body: body ?? 'Capturing mobile money SMS in the background',
      android: {
        channelId: SMS_CAPTURE_CHANNEL_ID,
        asForegroundService: true,
        foregroundServiceTypes: ['dataSync'], // Android 14+ required; syncs transaction data from SMS
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
    isServiceRunning = true;
    console.log('[SMS Foreground] Foreground service started');
    return true;
  } catch (e) {
    console.warn('[SMS Foreground] Failed to start:', e);
    return false;
  }
}

// Stop service and hide notification.
export async function stopSmsForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const n = getNotifee();
  if (!n) return;
  if (!isServiceRunning) return;
  try {
    await n.stopForegroundService();
    await n.cancelNotification(NOTIFICATION_ID);
    isServiceRunning = false;
    console.log('[SMS Foreground] Foreground service stopped');
  } catch (e) {
    console.warn('[SMS Foreground] Failed to stop:', e);
    isServiceRunning = false;
  }
}

export function isSmsForegroundServiceRunning(): boolean {
  return isServiceRunning;
}
