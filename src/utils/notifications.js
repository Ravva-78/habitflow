// Notifications utility — schedules per-habit daily reminders
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export async function requestNotificationPermission() {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitNotification(habit) {
  try {
    const [hour, min] = habit.reminderTime.split(':').map(Number);
    await Notifications.cancelScheduledNotificationAsync(habit.id).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: habit.id,
      content: {
        title: `${habit.icon} Time for ${habit.name}!`,
        body:  'Complete your daily quest and earn XP 🔥',
        sound: true,
        data:  { habitId: habit.id },
      },
      trigger: {
        hour,
        minute: min,
        repeats: true,
      },
    });
  } catch (e) {
    console.log('Notification schedule error:', e);
  }
}

export async function scheduleAllHabitNotifications(habits) {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await Promise.all(habits.map(h => scheduleHabitNotification(h)));
  return true;
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleMorningSummary() {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: 'morning_summary',
      content: {
        title: '🌅 Good morning, Champion!',
        body:  'Your daily quests are ready. Start strong! ⚔',
        sound: true,
      },
      trigger: { hour: 8, minute: 0, repeats: true },
    });
  } catch (e) {}
}

export async function scheduleEveningNudge() {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: 'evening_nudge',
      content: {
        title: '🌙 Evening check-in',
        body:  "Don't break the streak! Complete remaining quests 🔥",
        sound: true,
      },
      trigger: { hour: 20, minute: 0, repeats: true },
    });
  } catch (e) {}
}
