// src/screens/HomeScreen.jsx — FINAL VERSION
// EDITH glass UI + XP/Level system + Quest cards + Pentagon radar + Notifications

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHabits } from '../hooks/useHabits';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { getLevelInfo, calcRadarScores, RADAR_AXES, RADAR_COLORS, LEVELS } from '../utils/xpSystem';
import { scheduleAllHabitNotifications, scheduleMorningSummary, scheduleEveningNudge } from '../utils/notifications';

const XP_KEY = 'hf_total_xp';
const STREAK_KEY = 'hf_streak_days';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { habits, todayLog, loading, toggleHabit, completedToday, totalHabits, completionPct, getLogForDate } = useHabits();
  const [weekLogs, setWeekLogs]   = useState({});
  const [activeTab, setActiveTab] = useState('today');
  const [totalXP, setTotalXP]     = useState(0);
  const [streak, setStreak]       = useState(1);
  const [radarScores, setRadarScores] = useState({});
  const [notifSetup, setNotifSetup]   = useState(false);

  const today     = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays  = eachDayOfInterval({ start: weekStart, end: endOfWeek(today, { weekStartsOn: 1 }) });
  const todayStr  = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    AsyncStorage.getItem(XP_KEY).then(v => { if (v) setTotalXP(parseInt(v)); });
    AsyncStorage.getItem(STREAK_KEY).then(v => { if (v) setStreak(parseInt(v)); });
  }, []);

  useEffect(() => {
    if (!habits.length) return;
    Promise.all(weekDays.map(d => getLogForDate(d).then(log => [format(d,'yyyy-MM-dd'), log])))
      .then(entries => {
        const logs = Object.fromEntries(entries);
        setWeekLogs(logs);
        setRadarScores(calcRadarScores(habits, logs));
      });
  }, [habits.length, todayLog]);

  useEffect(() => {
    if (habits.length && !notifSetup) {
      scheduleAllHabitNotifications(habits);
      scheduleMorningSummary();
      scheduleEveningNudge();
      setNotifSetup(true);
    }
  }, [habits.length]);

  const handleToggle = useCallback(async (habitId) => {
    const wasDone = !!todayLog[habitId];
    toggleHabit(habitId);
    if (!wasDone) {
      const xpEarned = streak >= 7 ? 40 : streak >= 3 ? 30 : 20;
      const newXP = totalXP + xpEarned;
      setTotalXP(newXP);
      await AsyncStorage.setItem(XP_KEY, newXP.toString());
    }
  }, [todayLog, totalXP, streak, toggleHabit]);

  const levelInfo = getLevelInfo(totalXP);
  const weekTotal = weekDays.reduce((sum, d) => {
    const key = format(d,'yyyy-MM-dd');
    return sum + habits.filter(h => weekLogs[key]?.[h.id]).length;
  }, 0);
  const weekPct = (habits.length * weekDays.length) > 0
    ? Math.round(weekTotal / (habits.length * weekDays.length) * 100) : 0;

  if (loading) return <View style={s.loading}><ActivityIndicator color={Colors.primary} size="large"/></View>;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:100}}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()} 👋</Text>
            <Text style={s.date}>{format(today,'EEEE, MMMM d')}</Text>
          </View>
          <View style={s.streakPill}>
            <Text style={s.streakFire}>🔥</Text>
            <Text style={s.streakLabel}>Day {streak}</Text>
          </View>
        </View>

        {/* XP Card */}
        <View style={s.xpCard}>
          <View style={s.xpTopRow}>
            <View>
              <Text style={s.levelName}>⚔ {levelInfo.current.name.toUpperCase()}</Text>
              <Text style={s.levelNum}>Level {levelInfo.current.level}</Text>
            </View>
            <View style={s.xpBadge}>
              <Text style={s.xpBadgeTxt}>{totalXP} XP</Text>
            </View>
          </View>
          <View style={s.xpBarTrack}>
            <View style={[s.xpBarFill, {width:`${levelInfo.progress*100}%`, backgroundColor:levelInfo.current.color}]}/>
          </View>
          <View style={s.xpBarRow}>
            <Text style={[s.xpBarLabel,{color:levelInfo.current.color}]}>{totalXP} XP</Text>
            {levelInfo.next && <Text style={s.xpBarLabel}>→ {levelInfo.next.name} @ {levelInfo.next.minXP}</Text>}
          </View>
          <View style={s.levelPips}>
            {LEVELS.map((lv,i) => (
              <View key={i} style={[s.pip, totalXP>=lv.minXP && {backgroundColor:lv.color,borderColor:lv.color}]}>
                <Text style={[s.pipTxt, totalXP>=lv.minXP && {color:Colors.bg}]}>{i+1}</Text>
              </View>
            ))}
            <Text style={s.pipLabel}>{levelInfo.next ? `→ ${levelInfo.next.name}` : '🏆 MAX'}</Text>
          </View>
        </View>

        {/* Streak bonus */}
        {streak >= 3 && (
          <View style={s.bonusBanner}>
            <Text style={{fontSize:18}}>🔥</Text>
            <View style={{flex:1,marginLeft:Spacing.sm}}>
              <Text style={s.bonusTitle}>{streak>=7?'7-Day Streak! 2x XP Active':'3-Day Streak! 1.5x XP Active'}</Text>
              <Text style={s.bonusSub}>Bonus XP on all completions today</Text>
            </View>
            <Text style={s.bonusMult}>{streak>=7?'x2':'x1.5'}</Text>
          </View>
        )}

        {/* Overview chips */}
        <View style={s.overviewRow}>
          <View style={s.overviewChip}>
            <Text style={[s.overviewVal,{color:Colors.primary}]}>{completedToday}/{totalHabits}</Text>
            <Text style={s.overviewKey}>today</Text>
          </View>
          <View style={s.overviewChip}>
            <Text style={[s.overviewVal,{color:Colors.green}]}>{weekPct}%</Text>
            <Text style={s.overviewKey}>this week</Text>
          </View>
          <View style={s.overviewChip}>
            <Text style={[s.overviewVal,{color:Colors.amber}]}>{streak}</Text>
            <Text style={s.overviewKey}>day streak</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {[['today','Today'],['week','This Week'],['radar','Radar']].map(([key,label]) => (
            <TouchableOpacity key={key} style={[s.tab, activeTab===key&&s.tabActive]} onPress={()=>setActiveTab(key)}>
              <Text style={[s.tabText, activeTab===key&&s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TODAY — Quest cards */}
        {activeTab==='today' && (
          <>
            <Text style={s.sectionTitle}>DAILY QUESTS</Text>
            {habits.map(habit => {
              const done = !!todayLog[habit.id];
              const xpVal = streak>=7?40:streak>=3?30:20;
              return (
                <TouchableOpacity key={habit.id}
                  style={[s.questCard, done&&s.questCardDone]}
                  onPress={()=>handleToggle(habit.id)} activeOpacity={0.8}>
                  <View style={[s.questIcon,{backgroundColor:habit.color+'18',borderColor:habit.color+'40'}]}>
                    <Text style={{fontSize:22}}>{habit.icon}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={[s.questName, done&&s.questNameDone]}>{habit.name}</Text>
                    <View style={s.questMeta}>
                      <Text style={s.questTime}>⏰ {habit.reminderTime}</Text>
                      <View style={[s.questDot,{backgroundColor:done?Colors.primary:Colors.textMuted}]}/>
                      <Text style={[s.questStatus,{color:done?Colors.primary:Colors.textMuted}]}>{done?'Done':'Pending'}</Text>
                    </View>
                  </View>
                  <View style={s.questRight}>
                    <Text style={[s.questXP,{color:done?Colors.primary:Colors.textMuted}]}>+{xpVal}XP</Text>
                    <View style={[s.checkBox, done&&{backgroundColor:Colors.primary,borderColor:Colors.primary}]}>
                      {done&&<Text style={s.checkMark}>✓</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {completedToday===totalHabits&&totalHabits>0&&(
              <View style={s.perfectCard}>
                <Text style={{fontSize:32}}>🏆</Text>
                <View style={{marginLeft:Spacing.md}}>
                  <Text style={s.perfectTitle}>Perfect Day!</Text>
                  <Text style={s.perfectSub}>All quests done. Bonus XP earned!</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* WEEK VIEW */}
        {activeTab==='week' && (
          <>
            <Text style={s.sectionTitle}>WEEKLY OVERVIEW</Text>
            <View style={s.weekGrid}>
              <View style={s.gridRow}>
                <View style={s.gridHabitCol}><Text style={s.gridHdrText}>HABIT</Text></View>
                {weekDays.map(d=>(
                  <View key={d.toISOString()} style={[s.gridDayCol, format(d,'yyyy-MM-dd')===todayStr&&s.gridDayToday]}>
                    <Text style={[s.gridDayLabel, format(d,'yyyy-MM-dd')===todayStr&&{color:Colors.primary}]}>{format(d,'EEE')}</Text>
                    <Text style={[s.gridDayNum, format(d,'yyyy-MM-dd')===todayStr&&{color:Colors.primary}]}>{format(d,'d')}</Text>
                  </View>
                ))}
                <View style={s.gridPctCol}><Text style={s.gridHdrText}>%</Text></View>
              </View>
              {habits.map((habit,idx)=>{
                const weekDone=weekDays.filter(d=>weekLogs[format(d,'yyyy-MM-dd')]?.[habit.id]).length;
                const pct=Math.round(weekDone/weekDays.length*100);
                return (
                  <View key={habit.id} style={[s.gridRow,idx%2===0&&s.gridRowAlt]}>
                    <View style={s.gridHabitCol}>
                      <Text style={{fontSize:14}}>{habit.icon}</Text>
                      <Text style={s.gridHabitName} numberOfLines={1}>{habit.name}</Text>
                    </View>
                    {weekDays.map(d=>{
                      const key=format(d,'yyyy-MM-dd');
                      const done=!!weekLogs[key]?.[habit.id];
                      const isToday=key===todayStr;
                      return (
                        <TouchableOpacity key={key} style={s.gridDayCol}
                          onPress={()=>isToday?handleToggle(habit.id):null} activeOpacity={isToday?0.7:1}>
                          <View style={[s.gridCell,done&&{backgroundColor:habit.color+'30',borderColor:habit.color}]}>
                            {done&&<Text style={[s.gridCheck,{color:habit.color}]}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={s.gridPctCol}>
                      <Text style={[s.gridPct,{color:pct>=80?Colors.green:pct>=50?Colors.primary:Colors.coral}]}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
              <View style={[s.gridRow,s.gridFooter]}>
                <View style={s.gridHabitCol}><Text style={s.gridHdrText}>DONE</Text></View>
                {weekDays.map(d=>{
                  const key=format(d,'yyyy-MM-dd');
                  const count=habits.filter(h=>weekLogs[key]?.[h.id]).length;
                  return (
                    <View key={key} style={s.gridDayCol}>
                      <Text style={[s.gridFooterNum,{color:count===habits.length?Colors.green:count>0?Colors.primary:Colors.textMuted}]}>{count}</Text>
                    </View>
                  );
                })}
                <View style={s.gridPctCol}><Text style={[s.gridPct,{color:Colors.primary}]}>{weekPct}%</Text></View>
              </View>
            </View>
          </>
        )}

        {/* RADAR TAB */}
        {activeTab==='radar' && (
          <>
            <Text style={s.sectionTitle}>PRODUCTIVITY RADAR</Text>
            <View style={s.radarCard}>
              <Text style={s.radarOverall}>
                Overall: {Math.round(RADAR_AXES.reduce((sum,ax)=>sum+(radarScores[ax]||0),0)/RADAR_AXES.length*100)}%
              </Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16,justifyContent:'center'}}>
                {RADAR_AXES.map(ax=>(
                  <View key={ax} style={{flexDirection:'row',alignItems:'center',gap:4}}>
                    <View style={{width:8,height:8,backgroundColor:RADAR_COLORS[ax],borderRadius:2}}/>
                    <Text style={{fontSize:10,color:RADAR_COLORS[ax],fontWeight:'700'}}>{ax} {Math.round((radarScores[ax]||0)*100)}%</Text>
                  </View>
                ))}
              </View>
              {RADAR_AXES.map(ax=>(
                <View key={ax} style={{marginBottom:12}}>
                  <View style={{flexDirection:'row',alignItems:'center',marginBottom:5}}>
                    <Text style={{fontSize:12,fontWeight:'700',color:RADAR_COLORS[ax],width:70}}>{ax}</Text>
                    <View style={{flex:1,height:12,backgroundColor:Colors.border,borderRadius:3,overflow:'hidden'}}>
                      <View style={{height:'100%',width:`${Math.round((radarScores[ax]||0)*100)}%`,backgroundColor:RADAR_COLORS[ax],borderRadius:3}}/>
                    </View>
                    <Text style={{fontSize:11,fontWeight:'800',color:RADAR_COLORS[ax],width:40,textAlign:'right'}}>
                      {Math.round((radarScores[ax]||0)*100)}%
                    </Text>
                  </View>
                  <Text style={{fontSize:9,color:Colors.textMuted,marginLeft:70}}>
                    {ax==='MIND'?'Reading, Journal':ax==='BODY'?'Exercise, Water, Eat':ax==='STUDY'?'Study sessions':ax==='REST'?'Sleep, Meditation':'Focus timer sessions'}
                  </Text>
                </View>
              ))}
              <Text style={{fontSize:10,color:Colors.textMuted,textAlign:'center',marginTop:8}}>
                Complete habits daily to raise each axis ↑
              </Text>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         {flex:1,backgroundColor:Colors.bg},
  loading:      {flex:1,backgroundColor:Colors.bg,alignItems:'center',justifyContent:'center'},
  header:       {flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.lg,paddingTop:Spacing.md,paddingBottom:Spacing.sm},
  greeting:     {fontSize:22,fontWeight:'800',color:Colors.textPrimary},
  date:         {...Typography.caption,marginTop:2},
  streakPill:   {flexDirection:'row',alignItems:'center',backgroundColor:'rgba(255,184,0,0.12)',borderRadius:Radius.full,paddingHorizontal:Spacing.md,paddingVertical:Spacing.sm,borderWidth:1,borderColor:'rgba(255,184,0,0.3)',gap:4},
  streakFire:   {fontSize:16},
  streakLabel:  {color:Colors.amber,fontWeight:'700',fontSize:13},
  xpCard:       {marginHorizontal:Spacing.lg,marginBottom:Spacing.md,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:Spacing.lg,borderWidth:1,borderColor:Colors.border},
  xpTopRow:     {flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:Spacing.md},
  levelName:    {fontSize:14,fontWeight:'800',color:Colors.primary},
  levelNum:     {...Typography.caption,marginTop:2},
  xpBadge:      {backgroundColor:Colors.primaryDim,borderRadius:Radius.full,paddingHorizontal:Spacing.md,paddingVertical:4,borderWidth:1,borderColor:Colors.primary+'44'},
  xpBadgeTxt:   {fontSize:12,fontWeight:'800',color:Colors.primary},
  xpBarTrack:   {height:10,backgroundColor:Colors.border,borderRadius:5,overflow:'hidden',marginBottom:6},
  xpBarFill:    {height:'100%',borderRadius:5},
  xpBarRow:     {flexDirection:'row',justifyContent:'space-between',marginBottom:Spacing.md},
  xpBarLabel:   {fontSize:10,fontWeight:'600',color:Colors.textMuted},
  levelPips:    {flexDirection:'row',alignItems:'center',gap:6},
  pip:          {width:22,height:22,borderRadius:Radius.sm,backgroundColor:Colors.bgInput,borderWidth:1,borderColor:Colors.border,alignItems:'center',justifyContent:'center'},
  pipTxt:       {fontSize:9,fontWeight:'800',color:Colors.textMuted},
  pipLabel:     {fontSize:9,color:Colors.textSecondary,marginLeft:4},
  bonusBanner:  {flexDirection:'row',alignItems:'center',marginHorizontal:Spacing.lg,marginBottom:Spacing.md,backgroundColor:'rgba(255,184,0,0.1)',borderRadius:Radius.lg,padding:Spacing.md,borderWidth:1,borderColor:'rgba(255,184,0,0.3)'},
  bonusTitle:   {fontSize:13,fontWeight:'700',color:Colors.amber},
  bonusSub:     {...Typography.caption,marginTop:2},
  bonusMult:    {fontSize:20,fontWeight:'900',color:Colors.amber},
  overviewRow:  {flexDirection:'row',marginHorizontal:Spacing.lg,marginBottom:Spacing.md,gap:Spacing.sm},
  overviewChip: {flex:1,backgroundColor:Colors.bgCard,borderRadius:Radius.lg,padding:Spacing.md,alignItems:'center',borderWidth:1,borderColor:Colors.border},
  overviewVal:  {fontSize:18,fontWeight:'800'},
  overviewKey:  {...Typography.caption,marginTop:2},
  tabRow:       {flexDirection:'row',marginHorizontal:Spacing.lg,marginBottom:Spacing.md,backgroundColor:Colors.bgCard,borderRadius:Radius.full,padding:3,borderWidth:1,borderColor:Colors.border},
  tab:          {flex:1,paddingVertical:Spacing.sm,borderRadius:Radius.full,alignItems:'center'},
  tabActive:    {backgroundColor:Colors.primary},
  tabText:      {...Typography.caption,fontWeight:'700',color:Colors.textMuted},
  tabTextActive:{color:Colors.bg,fontWeight:'800'},
  sectionTitle: {...Typography.label,marginHorizontal:Spacing.lg,marginBottom:Spacing.sm},
  questCard:    {flexDirection:'row',alignItems:'center',marginHorizontal:Spacing.lg,marginBottom:Spacing.sm,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:Spacing.md,borderWidth:1,borderColor:Colors.border},
  questCardDone:{borderColor:'rgba(0,229,204,0.3)',backgroundColor:'rgba(0,229,204,0.08)'},
  questIcon:    {width:46,height:46,borderRadius:Radius.lg,alignItems:'center',justifyContent:'center',marginRight:Spacing.md,borderWidth:1},
  questName:    {fontSize:15,fontWeight:'700',color:Colors.textPrimary},
  questNameDone:{color:Colors.textSecondary,textDecorationLine:'line-through'},
  questMeta:    {flexDirection:'row',alignItems:'center',marginTop:3,gap:6},
  questTime:    {...Typography.caption},
  questDot:     {width:4,height:4,borderRadius:2},
  questStatus:  {...Typography.caption,fontSize:11,fontWeight:'600'},
  questRight:   {alignItems:'center',gap:4},
  questXP:      {fontSize:10,fontWeight:'800'},
  checkBox:     {width:28,height:28,borderRadius:Radius.full,borderWidth:2,borderColor:Colors.border,alignItems:'center',justifyContent:'center'},
  checkMark:    {color:Colors.bg,fontWeight:'800',fontSize:14},
  perfectCard:  {flexDirection:'row',alignItems:'center',marginHorizontal:Spacing.lg,marginTop:Spacing.sm,backgroundColor:'rgba(255,184,0,0.1)',borderRadius:Radius.xl,padding:Spacing.lg,borderWidth:1,borderColor:'rgba(255,184,0,0.3)'},
  perfectTitle: {fontSize:16,fontWeight:'800',color:Colors.amber},
  perfectSub:   {...Typography.caption,marginTop:4},
  radarCard:    {marginHorizontal:Spacing.lg,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,padding:Spacing.lg,borderWidth:1,borderColor:Colors.border},
  radarOverall: {fontSize:16,fontWeight:'800',color:Colors.primary,textAlign:'center',marginBottom:Spacing.md},
  weekGrid:     {marginHorizontal:Spacing.lg,backgroundColor:Colors.bgCard,borderRadius:Radius.xl,borderWidth:1,borderColor:Colors.border,overflow:'hidden'},
  gridRow:      {flexDirection:'row',alignItems:'center',paddingVertical:10,paddingHorizontal:Spacing.sm,borderBottomWidth:1,borderColor:Colors.border},
  gridRowAlt:   {backgroundColor:'rgba(255,255,255,0.02)'},
  gridFooter:   {backgroundColor:'rgba(0,229,204,0.05)',borderBottomWidth:0},
  gridHabitCol: {flex:2.5,flexDirection:'row',alignItems:'center',gap:5},
  gridHabitName:{fontSize:10,color:Colors.textSecondary,flex:1},
  gridDayCol:   {flex:1,alignItems:'center'},
  gridDayToday: {backgroundColor:'rgba(0,229,204,0.1)',borderRadius:Radius.sm},
  gridDayLabel: {fontSize:9,color:Colors.textMuted,fontWeight:'700',textTransform:'uppercase'},
  gridDayNum:   {fontSize:11,color:Colors.textSecondary,fontWeight:'700'},
  gridHdrText:  {fontSize:9,color:Colors.textMuted,fontWeight:'700',letterSpacing:0.5},
  gridCell:     {width:20,height:20,borderRadius:5,borderWidth:1,borderColor:Colors.border,alignItems:'center',justifyContent:'center'},
  gridCheck:    {fontSize:11,fontWeight:'800'},
  gridPctCol:   {width:36,alignItems:'center'},
  gridPct:      {fontSize:11,fontWeight:'700'},
  gridFooterNum:{fontSize:13,fontWeight:'800'},
});
