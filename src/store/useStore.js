import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_HABITS } from '../data/habits';
import { format } from 'date-fns';

export const useStore = create(
  persist(
    (set, get) => ({
      // --- HABITS ---
      habits: DEFAULT_HABITS,
      logs: {}, // { '2026-07-07': { 'reading': true, 'water': true } }
      totalXP: 0,
      streak: 1,

      toggleHabit: (habitId, dateStr = format(new Date(), 'yyyy-MM-dd')) => set((state) => {
        const dateLog = state.logs[dateStr] || {};
        const wasDone = !!dateLog[habitId];
        
        const newLogs = {
          ...state.logs,
          [dateStr]: { ...dateLog, [habitId]: !wasDone }
        };

        // If toggling on for today, give XP
        let newXP = state.totalXP;
        if (!wasDone && dateStr === format(new Date(), 'yyyy-MM-dd')) {
          const xpEarned = state.streak >= 7 ? 40 : state.streak >= 3 ? 30 : 20;
          newXP += xpEarned;
        }

        return { logs: newLogs, totalXP: newXP };
      }),

      addHabit: (habit) => set((state) => {
        const id = habit.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        return { habits: [...state.habits, { ...habit, id, historicalCompletion: 0 }] };
      }),

      updateHabit: (id, updates) => set((state) => ({
        habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
      })),

      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter(h => h.id !== id)
      })),

      setTotalXP: (xp) => set({ totalXP: xp }),
      setStreak: (s) => set({ streak: s }),

      // --- FOCUS TIMER ---
      focusSessions: [],
      focusTotalMins: 0,
      focusGrid: {}, // { '2026-07-07': 30 }
      
      addFocusSession: (session) => set((state) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return {
          focusSessions: [session, ...state.focusSessions].slice(0, 50),
          focusTotalMins: state.focusTotalMins + session.mins,
          focusGrid: {
            ...state.focusGrid,
            [today]: (state.focusGrid[today] || 0) + session.mins
          }
        };
      }),

      // --- STUDY & JOURNAL ---
      subjects: [],
      studySessions: [],
      exams: [],
      journal: {}, // { '2026-07-07': { morning: [], night: [], braindump: '' } }
      reviews: {}, // { '2026-07-05': { wins: '', challenges: '' } }

      addSubject: (sub) => set((state) => ({ subjects: [...state.subjects, sub] })),
      logStudySession: (sess, curSub) => set((state) => {
        const uSub = state.subjects.map(s => s.id === curSub.id ? { ...s, totalMins: s.totalMins + sess.mins } : s);
        return {
          studySessions: [sess, ...state.studySessions],
          subjects: uSub
        };
      }),

      addExam: (exam) => set((state) => ({
        exams: [...state.exams, exam].sort((a,b) => new Date(a.date)-new Date(b.date))
      })),
      deleteExam: (id) => set((state) => ({
        exams: state.exams.filter(e => e.id !== id)
      })),

      saveJournal: (date, data) => set((state) => ({
        journal: { ...state.journal, [date]: data }
      })),

      saveReview: (weekKey, data) => set((state) => ({
        reviews: { ...state.reviews, [weekKey]: data }
      }))

    }),
    {
      name: 'habitflow-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
