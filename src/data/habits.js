// Default habits — all start fresh at 0
// Users can edit/delete these and add their own in Settings

export const DEFAULT_HABITS = [
  { id: 'reading',    name: 'Reading',           icon: '📚', color: '#00E5CC', reminderTime: '20:00', goal: 30, historicalCompletion: 0 },
  { id: 'exercise',   name: 'Exercise',           icon: '🏃', color: '#7B61FF', reminderTime: '07:00', goal: 30, historicalCompletion: 0 },
  { id: 'meditation', name: 'Meditation',         icon: '🧘', color: '#4DA6FF', reminderTime: '06:30', goal: 30, historicalCompletion: 0 },
  { id: 'water',      name: 'Drink 2L of Water',  icon: '💧', color: '#00E5A0', reminderTime: '09:00', goal: 30, historicalCompletion: 0 },
  { id: 'sleep',      name: 'Sleep by 11 PM',     icon: '😴', color: '#9B6DFF', reminderTime: '22:30', goal: 30, historicalCompletion: 0 },
  { id: 'journal',    name: 'Journaling',         icon: '📝', color: '#FF61DC', reminderTime: '21:00', goal: 30, historicalCompletion: 0 },
  { id: 'eating',     name: 'Eat Healthy',        icon: '🥗', color: '#FFB800', reminderTime: '12:00', goal: 30, historicalCompletion: 0 },
];

export const GOAL_CATEGORIES = [
  { id: 'health',    name: 'Health & Fitness',  icon: '🧘', color: '#00E5A0' },
  { id: 'career',    name: 'Career Growth',      icon: '💼', color: '#4DA6FF' },
  { id: 'finance',   name: 'Finances & Wealth',  icon: '💰', color: '#FFB800' },
  { id: 'relations', name: 'Relationships',       icon: '🤝', color: '#FF61DC' },
  { id: 'romance',   name: 'Romance & Love',      icon: '❤️', color: '#FF5E5E' },
  { id: 'spirit',    name: 'Spirituality',        icon: '✨', color: '#9B6DFF' },
  { id: 'home',      name: 'Home',                icon: '🏡', color: '#00E5CC' },
  { id: 'travel',    name: 'Adventure & Travel',  icon: '✈️', color: '#7B61FF' },
  { id: 'hobbies',   name: 'Fun & Hobbies',       icon: '🎨', color: '#FFB800' },
  { id: 'community', name: 'Community',           icon: '🌍', color: '#00E5A0' },
];
