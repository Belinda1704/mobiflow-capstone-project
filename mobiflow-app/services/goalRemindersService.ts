// Reminder when goal hits 80%. Notifications only in real build (not Expo Go).
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

let Notifications: any = null;
let notificationsLoaded = false;

function getNotificationsModule() {
  if (Constants.appOwnership === 'expo') {
    return null;
  }
  if (!notificationsLoaded) {
    try {
      Notifications = require('expo-notifications');
      notificationsLoaded = true;
    } catch (error) {
      return null;
    }
  }
  
  return Notifications;
}

const REMINDED_IDS_KEY = '@mobiflow/goalReminderSentIds';

export type GoalForReminder = { id: string; name: string; percent: number };

async function getRemindedGoalIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(REMINDED_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

async function markReminded(goalId: string): Promise<void> {
  const ids = await getRemindedGoalIds();
  ids.add(goalId);
  await AsyncStorage.setItem(REMINDED_IDS_KEY, JSON.stringify([...ids]));
}

// Ask notification permission; true if granted.
export async function requestNotificationPermission(): Promise<boolean> {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return false;
  
  try {
    // Default or named export
    const Notifications = NotificationsModule.default || NotificationsModule;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export type OnGoalReminded = (goalId: string, name: string, percent: number) => void;

// For 80–99% goals, schedule reminder once.
export async function checkAndScheduleGoalReminders(
  goals: GoalForReminder[],
  getTitle: (name: string, percent: number) => string,
  getBody: (name: string, percent: number) => string,
  onReminded?: OnGoalReminded
): Promise<void> {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return;
  
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const reminded = await getRemindedGoalIds();
  const toRemind = goals.filter(
    (g) => g.percent >= 80 && g.percent < 100 && !reminded.has(g.id)
  );
  if (toRemind.length === 0) return;

  try {
    const Notifications = NotificationsModule.default || NotificationsModule;
    for (const goal of toRemind) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: getTitle(goal.name, goal.percent),
          body: getBody(goal.name, goal.percent),
          data: { goalId: goal.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
      await markReminded(goal.id);
      onReminded?.(goal.id, goal.name, goal.percent);
    }
  } catch (error) {
    console.warn('Could not schedule goal reminders:', error);
  }
}
