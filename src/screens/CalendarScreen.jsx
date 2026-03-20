import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isToday, isFuture } from 'date-fns';
import { useHabits } from '../hooks/useHabits';
import { Colors, Spacing, Radius, Typography } from '../theme';

const DAY_LABELS = ['S','M','T','W','T','F','S'];

export default function CalendarScreen() {
  const { habits, getLogForDate } = useHabits();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthLogs, setMonthLogs] = useState({});
  const [selectedHabit, setSelectedHabit] = useState(null);

  useEffect(() => { if (habits.length && !selectedHabit) setSelectedHabit(habits[0]); }, [habits]);

  useEffect(() => {
    if (!habits.length) return;
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    Promise.all(days.map(d => getLogForDate(d).then(log => [format(d,'yyyy-MM-dd'), log])))
      .then(entries => setMonthLogs(Object.fromEntries(entries)));
  }, [currentMonth, habits.length]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const padDays = getDay(startOfMonth(currentMonth));
  const done = days.filter(d => !isFuture(d) && monthLogs[format(d,'yyyy-MM-dd')]?.[selectedHabit?.id]).length;
  const elapsed = days.filter(d => !isFuture(d)).length;
  const pct = elapsed ? Math.round(done/elapsed*100) : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.nav}>
          <TouchableOpacity onPress={() => setCurrentMonth(d => subMonths(d,1))} style={s.navBtn}><Text style={s.arrow}>‹</Text></TouchableOpacity>
          <Text style={s.title}>{format(currentMonth,'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(d => addMonths(d,1))} style={s.navBtn}><Text style={s.arrow}>›</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills}>
          {habits.map(h => (
            <TouchableOpacity key={h.id} style={[s.pill, selectedHabit?.id===h.id && {backgroundColor:h.color+'33',borderColor:h.color}]} onPress={() => setSelectedHabit(h)}>
              <Text>{h.icon}</Text><Text style={[s.pillText, selectedHabit?.id===h.id && {color:h.color}]}> {h.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.stats}>
          {[['Done',done,selectedHabit?.color],['Left',days.length-done,Colors.textSecondary],['Rate',`${pct}%`,selectedHabit?.color]].map(([l,v,c])=>(
            <View key={l} style={s.chip}><Text style={[s.chipV,{color:c||Colors.primary}]}>{v}</Text><Text style={s.chipL}>{l}</Text></View>
          ))}
        </View>

        <View style={s.card}>
          <View style={s.labels}>{DAY_LABELS.map((d,i)=><Text key={i} style={s.dayL}>{d}</Text>)}</View>
          <View style={s.grid}>
            {Array.from({length:padDays}).map((_,i)=><View key={`p${i}`} style={s.cell}/>)}
            {days.map(date => {
              const key = format(date,'yyyy-MM-dd');
              const done = !!(monthLogs[key]?.[selectedHabit?.id]);
              const future = isFuture(date);
              const today = isToday(date);
              return (
                <View key={key} style={[s.cell, today&&s.cellToday, done&&{backgroundColor:selectedHabit?.color+'33'}]}>
                  <Text style={[s.cellDay, today&&{color:selectedHabit?.color||Colors.primary,fontWeight:'700'}, done&&{color:selectedHabit?.color}, future&&{color:Colors.textMuted}]}>
                    {format(date,'d')}
                  </Text>
                  {done && <Text style={[s.check,{color:selectedHabit?.color}]}>✓</Text>}
                </View>
              );
            })}
          </View>
        </View>
        <View style={{height:100}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},
  nav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.lg,paddingTop:Spacing.lg,paddingBottom:Spacing.sm},
  navBtn:{padding:Spacing.sm},arrow:{color:Colors.textPrimary,fontSize:28,fontWeight:'300'},
  title:{...Typography.h2},
  pills:{paddingHorizontal:Spacing.lg,paddingBottom:Spacing.md,gap:8,flexDirection:'row'},
  pill:{flexDirection:'row',alignItems:'center',backgroundColor:Colors.bgCard,borderRadius:Radius.full,paddingHorizontal:Spacing.md,paddingVertical:Spacing.xs,borderWidth:1,borderColor:Colors.border},
  pillText:{...Typography.caption,color:Colors.textSecondary},
  stats:{flexDirection:'row',marginHorizontal:Spacing.lg,marginBottom:Spacing.md,gap:Spacing.sm},
  chip:{flex:1,backgroundColor:Colors.bgCard,borderRadius:Radius.md,padding:Spacing.md,alignItems:'center',borderWidth:1,borderColor:Colors.border},
  chipV:{fontSize:20,fontWeight:'700'},chipL:{...Typography.caption,marginTop:2},
  card:{marginHorizontal:Spacing.lg,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:Spacing.md,borderWidth:1,borderColor:Colors.border},
  labels:{flexDirection:'row',marginBottom:Spacing.sm},
  dayL:{flex:1,textAlign:'center',...Typography.caption,color:Colors.textMuted,fontWeight:'700'},
  grid:{flexDirection:'row',flexWrap:'wrap'},
  cell:{width:'14.28%',aspectRatio:1,alignItems:'center',justifyContent:'center',borderRadius:Radius.sm,marginVertical:1},
  cellToday:{borderWidth:1,borderColor:Colors.primary+'60'},
  cellDay:{...Typography.caption,color:Colors.textPrimary},
  check:{fontSize:9,fontWeight:'700'},
});
