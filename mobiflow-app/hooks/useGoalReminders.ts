// Encapsulates goal-reminder scheduling so the savings screen doesn't call
// notification/reminder services directly.
import { useEffect } from 'react';
import { getNotificationSettings } from '../services/notificationSettingsService';
import { checkAndScheduleGoalReminders } from '../services/goalRemindersService';
import { recordGoalReminder } from '../services/notificationTriggerService';

export type GoalForReminder = { id: string; name: string; percent: number };

export function useGoalReminders(
  userId: string | undefined,
  goals: GoalForReminder[],
  t: (key: string, opts?: Record<string, string | number>) => string
) {
  useEffect(() => {
    if (!userId || goals.length === 0) return;
    getNotificationSettings().then((s) => {
      if (!s.goalReminders) return;
      const forReminder = goals.map((g) => ({ id: g.id, name: g.name, percent: g.percent }));
      checkAndScheduleGoalReminders(
        forReminder,
        (name, pct) => t('goalReminderTitle', { percent: pct }),
        (name, _pct) => t('goalReminderBody', { name }),
        (_, name, percent) => recordGoalReminder(userId, name, percent)
      );
    });
  }, [userId, goals, t]);
}
