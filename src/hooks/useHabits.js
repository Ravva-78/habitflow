import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

export function useHabits() {
  const habits = useStore(state => state.habits);
  const logs = useStore(state => state.logs);
  const toggleHabit = useStore(state => state.toggleHabit);
  const addHabit = useStore(state => state.addHabit);
  const updateHabit = useStore(state => state.updateHabit);
  const deleteHabit = useStore(state => state.deleteHabit);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLog = logs[today] || {};
  
  const completedToday = habits.filter(h => todayLog[h.id]).length;
  const totalHabits = habits.length;
  const completionPct = totalHabits > 0 ? completedToday / totalHabits : 0;
  
  const getLogForDate = async (date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return useStore.getState().logs[dStr] || {};
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Zustand persist to hydrate
    const unsub = useStore.persist.onFinishHydration(() => setLoading(false));
    if (useStore.persist.hasHydrated()) {
      setLoading(false);
    }
    return unsub;
  }, []);

  return {
    habits, todayLog, loading,
    toggleHabit, getLogForDate, addHabit, updateHabit, deleteHabit,
    completedToday, totalHabits, completionPct,
  };
}
