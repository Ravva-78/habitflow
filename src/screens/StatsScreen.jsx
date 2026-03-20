// src/screens/StatsScreen.jsx — Excel-style leaderboard + glass
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval, endOfWeek, startOfWeek } from 'date-fns';
import { useHabits } from '../hooks/useHabits';
import { Colors, Spacing, Radius, Typography } from '../theme';

export default function StatsScreen() {
  const { habits, getLogForDate } = useHabits();
  const [weekLogs, setWeekLogs] = useState({});
  const [monthLogs, setMonthLogs] = useState({});

  const last7  = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  const today  = new Date();
  const monthDays = eachDayOfInterval({ start: startOfMonth(today), end: today });

  useEffect(() => {
    Promise.all(last7.map(d => getLogForDate(d).then(log => [format(d,'yyyy-MM-dd'),log])))
      .then(e => setWeekLogs(Object.fromEntries(e)));
    Promise.all(monthDays.map(d => getLogForDate(d).then(log => [format(d,'yyyy-MM-dd'),log])))
      .then(e => setMonthLogs(Object.fromEntries(e)));
  }, [habits.length]);

  // Per-habit stats for leaderboard
  const habitStats = habits.map(h => {
    const weekDone  = last7.filter(d => weekLogs[format(d,'yyyy-MM-dd')]?.[h.id]).length;
    const monthDone = monthDays.filter(d => monthLogs[format(d,'yyyy-MM-dd')]?.[h.id]).length;
    const monthPct  = monthDays.length ? monthDone / monthDays.length : 0;
    return { ...h, weekDone, monthDone, monthPct, weekPct: weekDone / 7 };
  }).sort((a,b) => b.monthPct - a.monthPct);

  // Weekly scores for bar chart
  const weekScores = last7.map(day => {
    const key  = format(day, 'yyyy-MM-dd');
    const log  = weekLogs[key] || {};
    const done = habits.filter(h => log[h.id]).length;
    return { day, score: habits.length ? done/habits.length : 0, done, label: format(day,'EEE') };
  });
  const avg = weekScores.length ? weekScores.reduce((s,d) => s+d.score, 0)/weekScores.length : 0;

  // Monthly overall
  const totalMonthDone = monthDays.reduce((sum, d) => sum + habits.filter(h => monthLogs[format(d,'yyyy-MM-dd')]?.[h.id]).length, 0);
  const monthMax = habits.length * monthDays.length;
  const monthOverallPct = monthMax ? Math.round(totalMonthDone/monthMax*100) : 0;

  // Weekly breakdown for month
  const weeks = eachWeekOfInterval({ start: startOfMonth(today), end: today }, { weekStartsOn: 1 });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={s.title}>Stats</Text>

        {/* Monthly overview */}
        <View style={s.overviewRow}>
          {[
            [totalMonthDone, 'completed', Colors.primary],
            [monthMax - totalMonthDone, 'remaining', Colors.textSecondary],
            [`${monthOverallPct}%`, format(today,'MMM'), Colors.green],
          ].map(([v,l,c]) => (
            <View key={l} style={s.overviewChip}>
              <Text style={[s.overviewVal, { color: c }]}>{v}</Text>
              <Text style={s.overviewLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Weekly bar chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>THIS WEEK</Text>
          <View style={s.barChart}>
            {weekScores.map(({ day, score, label, done }) => (
              <View key={day.toISOString()} style={s.barCol}>
                <Text style={s.barDone}>{done > 0 ? done : ''}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, {
                    height: `${Math.max(score*100, 2)}%`,
                    backgroundColor: score >= 0.8 ? Colors.green : score >= 0.5 ? Colors.primary : Colors.coral,
                  }]} />
                </View>
                <Text style={[s.barLabel, format(day,'yyyy-MM-dd') === format(today,'yyyy-MM-dd') && { color: Colors.primary }]}>{label}</Text>
              </View>
            ))}
          </View>
          <Text style={s.avg}>Weekly average: {Math.round(avg*100)}%</Text>
        </View>

        {/* Weekly breakdown circles - Excel style */}
        <View style={s.card}>
          <Text style={s.cardTitle}>WEEKLY BREAKDOWN — {format(today,'MMMM').toUpperCase()}</Text>
          <View style={s.weekCircles}>
            {weeks.map((wStart, idx) => {
              const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
              const wDays = eachDayOfInterval({ start: wStart, end: wEnd > today ? today : wEnd });
              const wDone = wDays.reduce((sum, d) => sum + habits.filter(h => monthLogs[format(d,'yyyy-MM-dd')]?.[h.id]).length, 0);
              const wMax = habits.length * wDays.length;
              const wPct = wMax ? Math.round(wDone/wMax*100) : 0;
              const color = wPct >= 80 ? Colors.green : wPct >= 50 ? Colors.primary : wPct > 0 ? Colors.amber : Colors.textMuted;
              return (
                <View key={idx} style={s.weekCircle}>
                  <View style={[s.circleRing, { borderColor: color }]}>
                    <Text style={[s.circleVal, { color }]}>{wPct}%</Text>
                  </View>
                  <Text style={s.circleLabel}>Wk {idx+1}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* TOP 10 Leaderboard — Excel style */}
        <View style={s.card}>
          <Text style={s.cardTitle}>TOP HABITS — {format(today,'MMMM').toUpperCase()}</Text>
          <View style={s.leaderHeader}>
            <Text style={[s.leaderCol, { flex: 0.4 }]}>#</Text>
            <Text style={[s.leaderCol, { flex: 3 }]}>HABIT</Text>
            <Text style={[s.leaderCol, { flex: 1, textAlign:'right' }]}>DONE</Text>
            <Text style={[s.leaderCol, { flex: 1.5, textAlign:'right' }]}>PROGRESS</Text>
          </View>
          {habitStats.map((h, i) => (
            <View key={h.id} style={[s.leaderRow, i % 2 === 0 && s.leaderRowAlt]}>
              <View style={[s.leaderCol, { flex: 0.4 }]}>
                <Text style={[s.leaderRank, i < 3 && { color: [Colors.amber, Colors.textSecondary, Colors.coral][i] }]}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : `${i+1}`}
                </Text>
              </View>
              <View style={[s.leaderCol, { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <Text style={{ fontSize: 14 }}>{h.icon}</Text>
                <Text style={s.leaderName} numberOfLines={1}>{h.name}</Text>
              </View>
              <Text style={[s.leaderCol, { flex: 1, textAlign:'right', color: Colors.primary, fontWeight:'700' }]}>
                {h.monthDone}/{monthDays.length}
              </Text>
              <View style={[s.leaderCol, { flex: 1.5 }]}>
                <View style={s.miniBarTrack}>
                  <View style={[s.miniBarFill, { width: `${h.monthPct*100}%`, backgroundColor: h.monthPct >= 0.5 ? Colors.primary : Colors.coral }]} />
                </View>
                <Text style={[s.miniPct, { color: h.monthPct >= 0.5 ? Colors.primary : Colors.coral }]}>{Math.round(h.monthPct*100)}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* All-time best — only shows when user has history */}
        {habits.some(h => h.historicalCompletion > 0) && (
          <View style={s.card}>
            <Text style={s.cardTitle}>ALL-TIME BEST</Text>
            {habits.filter(h => h.historicalCompletion > 0).map(h => (
              <View key={h.id} style={s.allTimeRow}>
                <Text style={{ fontSize: 14, width: 22 }}>{h.icon}</Text>
                <Text style={[s.leaderName, { width: 140 }]} numberOfLines={1}>{h.name}</Text>
                <View style={[s.allTimeBar, { flex: 1 }]}>
                  <View style={[s.allTimeFill, { width: `${h.historicalCompletion*100}%`, backgroundColor: h.color }]} />
                </View>
                <Text style={[s.miniPct, { color: h.color, width: 38, textAlign:'right' }]}>{Math.round(h.historicalCompletion*100)}%</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  title:         { ...Typography.h1, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.md },
  card:          { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardTitle:     { ...Typography.label, marginBottom: Spacing.md },

  overviewRow:   { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, gap: Spacing.sm },
  overviewChip:  { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  overviewVal:   { fontSize: 24, fontWeight: '800' },
  overviewLabel: { ...Typography.caption, marginTop: 2 },

  barChart:      { flexDirection: 'row', height: 90, alignItems: 'flex-end', gap: 6, marginBottom: Spacing.sm },
  barCol:        { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barDone:       { fontSize: 10, color: Colors.primary, fontWeight: '700', marginBottom: 2 },
  barTrack:      { flex: 1, width: '80%', backgroundColor: Colors.border, borderRadius: Radius.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill:       { width: '100%', borderRadius: Radius.sm, minHeight: 3 },
  barLabel:      { ...Typography.caption, marginTop: 4, fontSize: 10 },
  avg:           { ...Typography.caption, textAlign: 'center', marginTop: Spacing.sm },

  weekCircles:   { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: Spacing.md },
  weekCircle:    { alignItems: 'center', gap: 6 },
  circleRing:    { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  circleVal:     { fontSize: 13, fontWeight: '800' },
  circleLabel:   { ...Typography.caption, fontSize: 10 },

  leaderHeader:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: Colors.border, marginBottom: 4 },
  leaderCol:     { ...Typography.label, fontSize: 9 },
  leaderRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  leaderRowAlt:  { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: Radius.sm },
  leaderRank:    { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  leaderName:    { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  miniBarTrack:  { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 2 },
  miniBarFill:   { height: '100%', borderRadius: 2 },
  miniPct:       { fontSize: 10, fontWeight: '700' },

  allTimeRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 6 },
  allTimeBar:    { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  allTimeFill:   { height: '100%', borderRadius: 3 },
  excelNote:     { ...Typography.caption, marginTop: Spacing.md, textAlign: 'center', color: Colors.textMuted },
});
