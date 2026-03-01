// Trigger notifications + history (low balance, budget, tx, goal).
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getNotificationSettings } from './notificationSettingsService';
import { addToNotificationHistory } from './notificationHistoryService';
import { formatRWF } from '../utils/formatCurrency';

const LAST_LOW_BALANCE_KEY = '@mobiflow/lastLowBalanceNotify';
const LAST_BUDGET_BREACH_KEY = '@mobiflow/lastBudgetBreach/';
const LAST_EXPENSE_LIMIT_KEY = '@mobiflow/lastExpenseLimitNotify';
const LAST_INCOME_DROP_KEY = '@mobiflow/lastIncomeDropNotify';

let Notifications: any = null;
function getNotif() {
  if (Constants.appOwnership === 'expo') return null;
  if (!Notifications) {
    try {
      Notifications = require('expo-notifications');
    } catch {
      return null;
    }
  }
  return Notifications.default || Notifications;
}

async function scheduleLocalNotification(title: string, body: string): Promise<void> {
  const N = getNotif();
  if (!N) return;
  try {
    await N.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
    });
  } catch (e) {
    console.warn('Schedule notification failed:', e);
  }
}

export async function triggerLowBalanceIfNeeded(
  userId: string,
  balanceRwf: number,
  thresholdRwf: number
): Promise<void> {
  if (!userId || balanceRwf >= thresholdRwf) return;
  const settings = await getNotificationSettings();
  if (!settings.pushNotifications || !settings.lowBalanceAlerts) return;
  const today = new Date().toDateString();
  const raw = await AsyncStorage.getItem(LAST_LOW_BALANCE_KEY);
  if (raw === today) return;
  await AsyncStorage.setItem(LAST_LOW_BALANCE_KEY, today);
  const title = 'Low Balance Alert';
  const body = `Your account balance is ${formatRWF(balanceRwf)}`;
  await addToNotificationHistory(userId, { type: 'lowBalance', title, details: body });
  await scheduleLocalNotification(title, body);
}

export async function triggerBudgetOverspentIfNeeded(
  userId: string,
  category: string,
  overspentByRwf: number
): Promise<void> {
  if (!userId) return;
  const settings = await getNotificationSettings();
  if (!settings.pushNotifications || !settings.budgetAlerts) return;
  const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
  const key = `${LAST_BUDGET_BREACH_KEY}${userId}/${category}`;
  const raw = await AsyncStorage.getItem(key);
  if (raw === monthKey) return;
  await AsyncStorage.setItem(key, monthKey);
  const title = 'Budget Overspent';
  const body = `${category} budget exceeded by ${formatRWF(overspentByRwf)}`;
  await addToNotificationHistory(userId, { type: 'budgetOverspent', title, details: body });
  await scheduleLocalNotification(title, body);
}

export async function recordTransactionCompleted(
  userId: string,
  label: string,
  amountRwf: number
): Promise<void> {
  if (!userId) return;
  const settings = await getNotificationSettings();
  if (!settings.pushNotifications || !settings.transactionAlerts) return;
  const title = 'Transaction Completed';
  const details = `Payment of ${formatRWF(amountRwf)} to ${label}`;
  await addToNotificationHistory(userId, { type: 'transactionCompleted', title, details });
  await scheduleLocalNotification(title, details);
}

export async function recordGoalReminder(
  userId: string,
  goalName: string,
  percent: number
): Promise<void> {
  if (!userId) return;
  const title = `Goal reminder: ${percent}%`;
  const details = `You're ${percent}% of the way to "${goalName}"`;
  await addToNotificationHistory(userId, { type: 'goalReminder', title, details });
}

/** Send a notification when the user goes over their monthly expense limit (the app only reminds once per month). */
export async function triggerExpenseLimitIfNeeded(
  userId: string,
  totalExpenseThisMonthRwf: number,
  limitRwf: number,
  notifyOnExpenseLimit: boolean
): Promise<void> {
  if (!userId || !notifyOnExpenseLimit || totalExpenseThisMonthRwf <= limitRwf) return;
  const settings = await getNotificationSettings();
  if (!settings.pushNotifications || !settings.expenseLimitAlerts) return;
  const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
  const raw = await AsyncStorage.getItem(LAST_EXPENSE_LIMIT_KEY);
  if (raw === monthKey) return;
  await AsyncStorage.setItem(LAST_EXPENSE_LIMIT_KEY, monthKey);
  const over = totalExpenseThisMonthRwf - limitRwf;
  const title = 'Monthly expense limit exceeded';
  const body = `Expenses this month: ${formatRWF(totalExpenseThisMonthRwf)} (${formatRWF(over)} over your limit)`;
  await addToNotificationHistory(userId, { type: 'expenseLimit', title, details: body });
  await scheduleLocalNotification(title, body);
}

// Notify when income down vs last month (once per month).
export async function triggerIncomeDropIfNeeded(
  userId: string,
  percentDrop: number
): Promise<void> {
  if (!userId || percentDrop <= 0) return;
  const settings = await getNotificationSettings();
  if (!settings.pushNotifications || !settings.incomeDropAlerts) return;
  const monthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
  const raw = await AsyncStorage.getItem(LAST_INCOME_DROP_KEY);
  if (raw === monthKey) return;
  await AsyncStorage.setItem(LAST_INCOME_DROP_KEY, monthKey);
  const title = 'Income drop alert';
  const body = `Income is down ${percentDrop}% compared to last month`;
  await addToNotificationHistory(userId, { type: 'incomeDrop', title, details: body });
  await scheduleLocalNotification(title, body);
}
