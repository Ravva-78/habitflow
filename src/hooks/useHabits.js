// src/hooks/useHabits.js
// Uses AsyncStorage locally — Firebase sync can be added later
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_HABITS } from '../data/habits';
import { format } from 'date-fns';

const LOG_PREFIX    = 'hf_log_';
const HABITS_KEY    = 'hf_habits';

export function useHabits() {
  const [habits, setHabits]     = useState(DEFAULT_HABITS);
  const [todayLog, setTodayLog] = useState({});
  const [loading, setLoading]   = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Load habits + today's log
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(HABITS_KEY);
        if (stored) setHabits(JSON.parse(stored));
        const log = await AsyncStorage.getItem(LOG_PREFIX + today);
        if (log) setTodayLog(JSON.parse(log));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  // Toggle habit done/undone
  const toggleHabit = useCallback(async (habitId) => {
    const next = { ...todayLog, [habitId]: !todayLog[habitId] };
    setTodayLog(next);
    await AsyncStorage.setItem(LOG_PREFIX + today, JSON.stringify(next));
  }, [todayLog, today]);

  // Get log for any date
  const getLogForDate = useCallback(async (date) => {
    const key = LOG_PREFIX + format(date, 'yyyy-MM-dd');
    const log = await AsyncStorage.getItem(key);
    return log ? JSON.parse(log) : {};
  }, []);

  // Add habit
  const addHabit = useCallback(async (habit) => {
    const id = habit.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const newHabit = { ...habit, id, historicalCompletion: 0 };
    const updated = [...habits, newHabit];
    setHabits(updated);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
    return newHabit;
  }, [habits]);

  // Update habit
  const updateHabit = useCallback(async (id, updates) => {
    const updated = habits.map(h => h.id === id ? { ...h, ...updates } : h);
    setHabits(updated);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
  }, [habits]);

  // Delete habit
  const deleteHabit = useCallback(async (id) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
  }, [habits]);

  const completedToday = habits.filter(h => todayLog[h.id]).length;
  const totalHabits    = habits.length;
  const completionPct  = totalHabits > 0 ? completedToday / totalHabits : 0;

  return {
    habits, todayLog, loading,
    toggleHabit, getLogForDate, addHabit, updateHabit, deleteHabit,
    completedToday, totalHabits, completionPct,
  };
}
