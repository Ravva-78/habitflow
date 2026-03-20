// src/utils/streakCalculator.js
// Real streak calculation from daily habit logs

import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays } from 'date-fns';

const STREAK_KEY    = 'hf_streak_days';
const LAST_LOG_KEY  = 'hf_last_log_date';

/**
 * Calculates real streak from AsyncStorage daily logs
 * Checks each past day — if ANY habit was completed, that day counts
 */
export async function calculateStreak(habits) {
  if (!habits || !habits.length) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const day    = subDays(today, i);
    const key    = `hf_log_${format(day, 'yyyy-MM-dd')}`;
    const logStr = await AsyncStorage.getItem(key);

    if (!logStr) {
      // No log for this day
      if (i === 0) continue; // today hasn't been logged yet — skip
      break; // gap found — streak ends
    }

    const log  = JSON.parse(logStr);
    const done = habits.some(h => log[h.id]);

    if (done) {
      streak++;
    } else {
      if (i === 0) continue; // today not done yet — keep checking
      break;
    }
  }

  // Save streak
  await AsyncStorage.setItem(STREAK_KEY, streak.toString());
  await AsyncStorage.setItem(LAST_LOG_KEY, format(today, 'yyyy-MM-dd'));
  return streak;
}

/**
 * Check if streak is at risk — no habits done today after 8pm
 */
export async function isStreakAtRisk(habits) {
  const hour = new Date().getHours();
  if (hour < 20) return false;

  const today  = format(new Date(), 'yyyy-MM-dd');
  const logStr = await AsyncStorage.getItem(`hf_log_${today}`);
  if (!logStr) return true;

  const log  = JSON.parse(logStr);
  const done = habits.some(h => log[h.id]);
  return !done;
}
