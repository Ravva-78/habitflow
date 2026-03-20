// XP + Level System — All three combined

export const LEVELS = [
  { level: 1, name: 'Novice',     minXP: 0,    color: '#888888' },
  { level: 2, name: 'Apprentice', minXP: 200,  color: '#00E5CC' },
  { level: 3, name: 'Warrior',    minXP: 500,  color: '#7B61FF' },
  { level: 4, name: 'Champion',   minXP: 1000, color: '#FFB800' },
  { level: 5, name: 'Legend',     minXP: 2000, color: '#FF5E5E' },
  { level: 6, name: 'Mythic',     minXP: 4000, color: '#FF61DC' },
];

export const XP_PER_HABIT    = 20;
export const XP_STREAK_BONUS = 0.5; // +50% on streak days

export function getLevelInfo(totalXP) {
  let current = LEVELS[0];
  let next    = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next    = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? (totalXP - current.minXP) / (next.minXP - current.minXP)
    : 1;
  return { current, next, progress, totalXP };
}

export function calcXPForSession(habitsCompleted, streakDays, weeklyPct) {
  // 1. Per-habit XP
  let xp = habitsCompleted * XP_PER_HABIT;
  // 2. Streak multiplier
  if (streakDays >= 7)  xp *= 2.0;
  else if (streakDays >= 3) xp *= 1.5;
  // 3. Weekly rank bonus
  if (weeklyPct >= 80) xp += 50;
  else if (weeklyPct >= 60) xp += 25;
  return Math.round(xp);
}

// Radar categories — maps habit IDs to pentagon axes
export const RADAR_MAP = {
  reading:    'MIND',
  journal:    'MIND',
  cs:         'MIND',
  dsa:        'MIND',
  health:     'BODY',
  water:      'BODY',
  eating:     'BODY',
  exercise:   'BODY',
  project:    'STUDY',
  coding:     'STUDY',
  problem:    'STUDY',
  comm:       'STUDY',
  sleep:      'REST',
  meditation: 'REST',
};

export const RADAR_AXES = ['MIND', 'BODY', 'STUDY', 'REST', 'FOCUS'];
export const RADAR_COLORS = {
  MIND:  '#00E5CC',
  BODY:  '#00E5A0',
  STUDY: '#FFB800',
  REST:  '#7B61FF',
  FOCUS: '#FF61DC',
};

export function calcRadarScores(habits, weekLogs, focusMins = 0) {
  const scores = { MIND: 0, BODY: 0, STUDY: 0, REST: 0, FOCUS: 0 };
  const counts = { MIND: 0, BODY: 0, STUDY: 0, REST: 0, FOCUS: 1 };

  habits.forEach(h => {
    const axis = RADAR_MAP[h.id] || 'STUDY';
    counts[axis]++;
    // avg completion across week logs
    const days = Object.values(weekLogs);
    const done = days.filter(log => log[h.id]).length;
    const pct  = days.length ? done / days.length : 0;
    scores[axis] += pct;
  });

  // FOCUS axis from focus minutes this week (max 300 mins = 100%)
  scores.FOCUS = Math.min(focusMins / 300, 1);

  // Average per axis
  RADAR_AXES.forEach(ax => {
    if (ax !== 'FOCUS' && counts[ax] > 0) scores[ax] /= counts[ax];
  });

  return scores; // 0-1 per axis
}
