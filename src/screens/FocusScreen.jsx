// src/screens/FocusScreen.jsx
// Focus Timer with FaceDown mode — inspired by FaceDown app
// Uses expo-sensors Accelerometer to detect phone orientation

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Platform, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography } from '../theme';

// Try to import Accelerometer — gracefully degrade on web
let Accelerometer = null;
try {
  Accelerometer = require('expo-sensors').Accelerometer;
} catch (e) {}

const SESSION_TYPES = [
  { key: 'study',  label: 'Study',  color: '#00E5A0', emoji: '📚' },
  { key: 'focus',  label: 'Focus',  color: '#00E5CC', emoji: '🎯' },
  { key: 'break',  label: 'Break',  color: '#FFB800', emoji: '☕' },
  { key: 'review', label: 'Review', color: '#7B61FF', emoji: '🔁' },
];

const PRESETS = [5, 10, 15, 25, 30, 45, 50, 60];

const SESSIONS_KEY = 'hf_focus_sessions';
const TOTAL_KEY    = 'hf_focus_total_mins';

export default function FocusScreen() {
  // Timer state
  const [selectedMins, setSelectedMins] = useState(25);
  const [timeLeft, setTimeLeft]         = useState(25 * 60); // seconds
  const [isRunning, setIsRunning]       = useState(false);
  const [sessionType, setSessionType]   = useState(SESSION_TYPES[0]);
  const [faceDownMode, setFaceDownMode] = useState(false);
  const [isFaceDown, setIsFaceDown]     = useState(false);
  const [liftWarning, setLiftWarning]   = useState(0); // countdown 10→0

  // Sessions
  const [sessions, setSessions]   = useState([]);
  const [totalMins, setTotalMins] = useState(0);
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'stats'

  // Refs
  const timerRef    = useRef(null);
  const warningRef  = useRef(null);
  const accelRef    = useRef(null);
  const sessionStart = useRef(null);

  // Load sessions on mount
  useEffect(() => {
    (async () => {
      const s = await AsyncStorage.getItem(SESSIONS_KEY);
      if (s) setSessions(JSON.parse(s));
      const t = await AsyncStorage.getItem(TOTAL_KEY);
      if (t) setTotalMins(parseInt(t));
    })();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (timerRef.current)   clearInterval(timerRef.current);
    if (warningRef.current) clearInterval(warningRef.current);
    if (accelRef.current)   accelRef.current.remove?.();
  };

  // Update timeLeft when preset changes (only if not running)
  useEffect(() => {
    if (!isRunning) setTimeLeft(selectedMins * 60);
  }, [selectedMins]);

  // Accelerometer for FaceDown detection
  useEffect(() => {
    if (!faceDownMode || !isRunning || !Accelerometer) return;

    Accelerometer.setUpdateInterval(500);
    const sub = Accelerometer.addListener(({ z }) => {
      const down = z < -0.7; // screen facing down = negative z
      setIsFaceDown(down);

      if (!down && isRunning) {
        // Phone lifted — start 10s warning
        if (!warningRef.current) {
          setLiftWarning(10);
          warningRef.current = setInterval(() => {
            setLiftWarning(prev => {
              if (prev <= 1) {
                // Time's up — pause timer
                clearInterval(warningRef.current);
                warningRef.current = null;
                pauseTimer();
                Vibration.vibrate([0, 200, 100, 200]);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else if (down && warningRef.current) {
        // Put back down — cancel warning
        clearInterval(warningRef.current);
        warningRef.current = null;
        setLiftWarning(0);
      }
    });

    accelRef.current = sub;
    return () => {
      sub.remove();
      accelRef.current = null;
    };
  }, [faceDownMode, isRunning]);

  const startTimer = useCallback(() => {
    if (timeLeft === 0) setTimeLeft(selectedMins * 60);
    setIsRunning(true);
    sessionStart.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timeLeft, selectedMins]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(selectedMins * 60);
    setLiftWarning(0);
    if (warningRef.current) { clearInterval(warningRef.current); warningRef.current = null; }
  };

  const completeSession = useCallback(async () => {
    pauseTimer();
    Vibration.vibrate([0, 300, 150, 300]);
    const elapsed = Math.round((Date.now() - (sessionStart.current || Date.now())) / 60000);
    const mins = Math.max(elapsed, selectedMins);

    const newSession = {
      id:    Date.now().toString(),
      type:  sessionType.key,
      label: sessionType.label,
      mins,
      date:  format(new Date(), 'dd MMM'),
      color: sessionType.color,
      emoji: sessionType.emoji,
    };

    const updated = [newSession, ...sessions].slice(0, 50);
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));

    const newTotal = totalMins + mins;
    setTotalMins(newTotal);
    await AsyncStorage.setItem(TOTAL_KEY, newTotal.toString());

    // Mark today's focus in daily log
    const today = format(new Date(), 'yyyy-MM-dd');
    await AsyncStorage.setItem(`hf_focus_${today}`, (newTotal).toString());

    setTimeLeft(selectedMins * 60);
  }, [sessions, sessionType, totalMins, selectedMins]);

  // Format time as MM:SS
  const fmt = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = 1 - (timeLeft / (selectedMins * 60));
  const totalHours = Math.floor(totalMins / 60);
  const remainMins = totalMins % 60;

  // Consistency grid — last 90 days
  const last90 = eachDayOfInterval({ start: subDays(new Date(), 89), end: new Date() });
  const [focusGrid, setFocusGrid] = useState({});

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        last90.map(async d => {
          const key = `hf_focus_${format(d, 'yyyy-MM-dd')}`;
          const val = await AsyncStorage.getItem(key);
          return [format(d, 'yyyy-MM-dd'), val ? parseInt(val) : 0];
        })
      );
      setFocusGrid(Object.fromEntries(entries));
    })();
  }, [sessions]);

  const months = [...new Set(last90.map(d => format(d, 'MMM')))];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Tab bar */}
      <View style={s.topTabs}>
        {[['timer','Timer'],['stats','Stats']].map(([k,l]) => (
          <TouchableOpacity key={k} style={[s.topTab, activeTab===k && s.topTabActive]} onPress={() => setActiveTab(k)}>
            <Text style={[s.topTabText, activeTab===k && s.topTabTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'timer' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Session type pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.typePills}>
            {SESSION_TYPES.map(t => (
              <TouchableOpacity key={t.key}
                style={[s.typePill, sessionType.key===t.key && { backgroundColor: t.color+'33', borderColor: t.color }]}
                onPress={() => setSessionType(t)}>
                <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                <Text style={[s.typePillText, sessionType.key===t.key && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Big circular timer */}
          <View style={s.timerWrap}>
            {/* Outer decorative ring */}
            <View style={[s.timerRingOuter, { borderColor: sessionType.color + '20' }]}>
              <View style={[s.timerRingMid, { borderColor: sessionType.color + '40', borderTopColor: sessionType.color }]}>
                <View style={s.timerInner}>
                  {liftWarning > 0 ? (
                    <>
                      <Text style={[s.timerWarningNum, { color: Colors.coral }]}>{liftWarning}</Text>
                      <Text style={[s.timerLabel, { color: Colors.coral }]}>put it down!</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[s.timerDisplay, { color: isRunning ? sessionType.color : Colors.textPrimary }]}>
                        {fmt(timeLeft)}
                      </Text>
                      <Text style={s.timerLabel}>
                        {isRunning ? (faceDownMode && !isFaceDown ? '⬆️ flip down' : sessionType.label) : 'ready'}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Ends at label */}
            {isRunning && (
              <View style={s.endsAtPill}>
                <Text style={s.endsAtText}>
                  ⏰ Ends at {format(new Date(Date.now() + timeLeft * 1000), 'HH:mm')}
                </Text>
              </View>
            )}
          </View>

          {/* Preset buttons */}
          <View style={s.presetsGrid}>
            {PRESETS.map(m => (
              <TouchableOpacity key={m}
                style={[s.presetBtn, selectedMins===m && !isRunning && { backgroundColor: sessionType.color, borderColor: sessionType.color }]}
                onPress={() => { if (!isRunning) setSelectedMins(m); }}
                disabled={isRunning}>
                <Text style={[s.presetText, selectedMins===m && !isRunning && { color: Colors.bg }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FaceDown toggle */}
          <TouchableOpacity style={[s.faceDownToggle, faceDownMode && { borderColor: sessionType.color, backgroundColor: sessionType.color+'15' }]}
            onPress={() => setFaceDownMode(!faceDownMode)}>
            <Text style={{ fontSize: 20 }}>📱</Text>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={[s.faceDownTitle, faceDownMode && { color: sessionType.color }]}>FaceDown mode</Text>
              <Text style={s.faceDownSub}>Flip phone face-down to start • Lift = 10s warning</Text>
            </View>
            <View style={[s.toggleDot, faceDownMode && { backgroundColor: sessionType.color }]} />
          </TouchableOpacity>

          {/* Control buttons */}
          <View style={s.controls}>
            <TouchableOpacity style={s.resetBtn} onPress={resetTimer}>
              <Text style={s.resetBtnText}>↺</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.startBtn, { backgroundColor: isRunning ? Colors.coral + 'CC' : sessionType.color }]}
              onPress={isRunning ? pauseTimer : startTimer}>
              <Text style={s.startBtnText}>{isRunning ? 'Pause' : 'Start focus'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.resetBtn} onPress={completeSession} disabled={!isRunning}>
              <Text style={[s.resetBtnText, !isRunning && { color: Colors.textMuted }]}>✓</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      ) : (
        /* ── STATS TAB ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Big stat cards */}
          <View style={s.statsCards}>
            <View style={[s.statBig, { backgroundColor: '#1A0A0A' }]}>
              <Text style={{ fontSize: 28 }}>🔥</Text>
              <Text style={[s.statBigNum, { color: Colors.coral }]}>{sessions.length > 0 ? 1 : 0}</Text>
              <Text style={s.statBigLabel}>Day streak</Text>
            </View>
            <View style={[s.statBig, { backgroundColor: '#0A1A14' }]}>
              <Text style={{ fontSize: 28 }}>⏱</Text>
              <Text style={[s.statBigNum, { color: Colors.green }]}>{totalHours}h {remainMins}m</Text>
              <Text style={s.statBigLabel}>Total focus</Text>
            </View>
          </View>

          {/* Consistency Grid */}
          <View style={s.gridCard}>
            <View style={s.gridHeader}>
              <Text style={s.gridTitle}>Consistency Grid</Text>
              <View style={s.gridLegend}>
                <Text style={s.legendText}>Less</Text>
                {['20','40','60','80'].map(o => (
                  <View key={o} style={[s.legendDot, { backgroundColor: Colors.primary + o }]} />
                ))}
                <Text style={s.legendText}>More</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={s.consistencyGrid}>
                  {last90.map(d => {
                    const key = format(d, 'yyyy-MM-dd');
                    const mins = focusGrid[key] || 0;
                    const opacity = mins === 0 ? '15' : mins < 30 ? '40' : mins < 60 ? '70' : 'FF';
                    return (
                      <View key={key} style={[s.gridSquare, {
                        backgroundColor: mins > 0 ? Colors.primary + opacity : Colors.border,
                        borderRadius: 3,
                      }]} />
                    );
                  })}
                </View>
                {/* Month labels */}
                <View style={s.monthLabels}>
                  {months.map(m => <Text key={m} style={s.monthLabel}>{m}</Text>)}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Recent Sessions */}
          <View style={s.sessionsHeader}>
            <Text style={s.sessionsTitle}>Recent Sessions</Text>
          </View>
          {sessions.length === 0 && (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 40 }}>🎯</Text>
              <Text style={s.emptyText}>No sessions yet</Text>
              <Text style={s.emptySub}>Start your first focus session!</Text>
            </View>
          )}
          {sessions.slice(0, 15).map(session => (
            <View key={session.id} style={s.sessionRow}>
              <View style={[s.sessionTypeBadge, { backgroundColor: session.color + '22', borderColor: session.color + '60' }]}>
                <Text style={[s.sessionTypeTxt, { color: session.color }]}>{session.label.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={s.sessionName}>{session.emoji} {session.label} session</Text>
                <Text style={s.sessionDate}>{session.date}</Text>
              </View>
              <View style={[s.sessionMins, { backgroundColor: session.color + '22' }]}>
                <Text style={[s.sessionMinsText, { color: session.color }]}>{session.mins}m</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg },

  // Top tabs
  topTabs:       { flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radius.full, padding: 3, borderWidth: 1, borderColor: Colors.border },
  topTab:        { flex: 1, paddingVertical: 8, borderRadius: Radius.full, alignItems: 'center' },
  topTabActive:  { backgroundColor: Colors.primary },
  topTabText:    { ...Typography.caption, fontWeight: '700', color: Colors.textMuted },
  topTabTextActive: { color: Colors.bg, fontWeight: '800' },

  // Session type pills
  typePills:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 8, flexDirection: 'row' },
  typePill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bgCard, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border },
  typePillText:  { ...Typography.caption, fontWeight: '700', color: Colors.textSecondary },

  // Timer
  timerWrap:     { alignItems: 'center', marginVertical: Spacing.lg },
  timerRingOuter:{ width: 240, height: 240, borderRadius: 120, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  timerRingMid:  { width: 210, height: 210, borderRadius: 105, borderWidth: 5, alignItems: 'center', justifyContent: 'center', borderLeftColor: 'transparent', borderBottomColor: 'transparent' },
  timerInner:    { alignItems: 'center' },
  timerDisplay:  { fontSize: 52, fontWeight: '800', letterSpacing: -2 },
  timerWarningNum:{ fontSize: 64, fontWeight: '900' },
  timerLabel:    { ...Typography.caption, marginTop: 4, fontSize: 13 },
  endsAtPill:    { marginTop: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  endsAtText:    { ...Typography.caption, fontWeight: '600' },

  // Presets
  presetsGrid:   { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: Spacing.lg, gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.md },
  presetBtn:     { width: 70, height: 56, borderRadius: Radius.lg, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  presetText:    { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  // FaceDown
  faceDownToggle:{ flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  faceDownTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  faceDownSub:   { ...Typography.caption, marginTop: 2, fontSize: 11 },
  toggleDot:     { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.textMuted },

  // Controls
  controls:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.lg, gap: Spacing.md },
  resetBtn:      { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  resetBtnText:  { fontSize: 22, color: Colors.textSecondary },
  startBtn:      { flex: 1, height: 56, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  startBtnText:  { fontSize: 18, fontWeight: '800', color: Colors.bg },

  // Stats
  statsCards:    { flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.md },
  statBig:       { flex: 1, borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'flex-start', gap: 4, borderWidth: 1, borderColor: Colors.border },
  statBigNum:    { fontSize: 28, fontWeight: '900', marginTop: Spacing.sm },
  statBigLabel:  { ...Typography.caption },

  // Consistency Grid
  gridCard:      { marginHorizontal: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  gridHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  gridTitle:     { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  gridLegend:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText:    { ...Typography.caption, fontSize: 10 },
  legendDot:     { width: 10, height: 10, borderRadius: 2 },
  consistencyGrid:{ flexDirection: 'row', flexWrap: 'wrap', width: 13 * 15, gap: 3 },
  gridSquare:    { width: 12, height: 12 },
  monthLabels:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  monthLabel:    { ...Typography.caption, fontSize: 10 },

  // Sessions
  sessionsHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sessionsTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sessionRow:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sessionTypeBadge:{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, borderWidth: 1 },
  sessionTypeTxt:{ fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  sessionName:   { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  sessionDate:   { ...Typography.caption, marginTop: 2 },
  sessionMins:   { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sessionMinsText:{ fontSize: 14, fontWeight: '800' },

  emptyState:    { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyText:     { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySub:      { ...Typography.caption },
});
