// src/screens/AICoachScreen.jsx
// Phase 4: AI Coach (Claude API) + Mood Tracker + PDF/Text Report

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays, eachDayOfInterval, startOfWeek } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHabits } from '../hooks/useHabits';
import { Colors, Spacing, Radius, Typography } from '../theme';

const MOOD_KEY    = 'hf_mood_';
const CHAT_KEY    = 'hf_coach_chat';

const MOODS = [
  { val: 5, emoji: '🤩', label: 'Amazing',  color: '#00E5A0' },
  { val: 4, emoji: '😊', label: 'Good',     color: '#00E5CC' },
  { val: 3, emoji: '😐', label: 'Okay',     color: '#FFB800' },
  { val: 2, emoji: '😔', label: 'Low',      color: '#FF8C42' },
  { val: 1, emoji: '😫', label: 'Rough',    color: '#FF5E5E' },
];

const QUICK_PROMPTS = [
  "Analyze my habit patterns and give me 3 specific improvements",
  "Which habit should I focus on most this week?",
  "Give me a 7-day challenge to boost my consistency",
  "Why do I keep missing my habits and how do I fix it?",
  "Create a personalized morning routine for me",
  "How can I build a study streak that actually lasts?",
];

export default function AICoachScreen() {
  const { habits, getLogForDate, completedToday, totalHabits, completionPct } = useHabits();
  const [activeTab, setActiveTab] = useState('coach');

  // ── AI COACH ──
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm your AI habit coach 🤖\n\nI can see all your habits, streaks, and patterns. Ask me anything — I'll give you personalised advice based on YOUR actual data.\n\nTry asking me to analyze your patterns or suggest improvements!",
    }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const scrollRef               = useRef(null);
  const [weekStats, setWeekStats] = useState({ pct: 0, done: 0, total: 0 });

  // ── MOOD TRACKER ──
  const today = format(new Date(), 'yyyy-MM-dd');
  const [todayMood, setTodayMood]   = useState(null);
  const [moodNote, setMoodNote]     = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [moodSaved, setMoodSaved]   = useState(false);

  useEffect(() => {
    // Load mood
    AsyncStorage.getItem(MOOD_KEY + today).then(d => {
      if (d) { const m = JSON.parse(d); setTodayMood(m.val); setMoodNote(m.note||''); setMoodSaved(true); }
    });
    // Load last 7 days mood
    const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    Promise.all(last7.map(d => AsyncStorage.getItem(MOOD_KEY + format(d,'yyyy-MM-dd')).then(v => v ? JSON.parse(v) : null)))
      .then(vals => setMoodHistory(vals.map((v,i) => ({ date: last7[i], mood: v }))));
    // Load chat
    AsyncStorage.getItem(CHAT_KEY).then(d => { if (d) setMessages(JSON.parse(d)); });
    // Week stats
    if (!habits.length) return;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: new Date() });
    Promise.all(days.map(d => getLogForDate(d))).then(logs => {
      const done  = logs.reduce((sum, log) => sum + habits.filter(h => log[h.id]).length, 0);
      const total = habits.length * days.length;
      setWeekStats({ pct: total ? Math.round(done/total*100):0, done, total });
    });
  }, [habits.length]);

  const saveMood = async () => {
    if (!todayMood) return;
    const data = { val: todayMood, note: moodNote, date: today };
    await AsyncStorage.setItem(MOOD_KEY + today, JSON.stringify(data));
    setMoodSaved(true);
    // reload history
    const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    const vals = await Promise.all(last7.map(d => AsyncStorage.getItem(MOOD_KEY + format(d,'yyyy-MM-dd')).then(v => v ? JSON.parse(v) : null)));
    setMoodHistory(vals.map((v,i) => ({ date: last7[i], mood: v })));
  };

  // Build rich context for Claude
  const buildContext = () => {
    const habitSummary = habits.map(h => `- ${h.icon} ${h.name} (reminder: ${h.reminderTime})`).join('\n');
    const moodAvg = moodHistory.filter(m => m.mood).map(m => m.mood.val);
    const avgMood = moodAvg.length ? (moodAvg.reduce((a,b) => a+b,0)/moodAvg.length).toFixed(1) : 'N/A';

    return `You are an expert habit coach and productivity mentor for a student. Be specific, actionable, and encouraging. Always reference their actual data.

STUDENT'S HABIT DATA:
- Total habits: ${totalHabits}
- Completed today: ${completedToday}/${totalHabits} (${Math.round(completionPct*100)}%)
- This week: ${weekStats.done}/${weekStats.total} (${weekStats.pct}%)
- Average mood (last 7 days): ${avgMood}/5
- Today's mood: ${todayMood ? MOODS.find(m=>m.val===todayMood)?.label : 'Not logged'}

THEIR HABITS:
${habitSummary}

Keep responses concise (under 200 words), use bullet points, be direct and specific to THEIR data. Use relevant emojis.`;
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    setLoading(true);

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Uses secure proxy server — API key never stored in app
      const { COACH_ENDPOINT } = require('../config/env');
      const response = await fetch(COACH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: buildContext(),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't connect. Check your internet and try again.";

      const updated = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(updated);
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(updated.slice(-30)));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      const updated = [...newMessages, { role: 'assistant', content: "⚠️ Connection error. Make sure you're online and try again!" }];
      setMessages(updated);
    }
    setLoading(false);
  };

  const clearChat = () => {
    Alert.alert('Clear chat?', 'This will reset your conversation history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        const reset = [{ role: 'assistant', content: "Hey! I'm your AI habit coach 🤖\n\nAsk me anything about your habits and I'll give you personalised advice!" }];
        setMessages(reset);
        await AsyncStorage.removeItem(CHAT_KEY);
      }},
    ]);
  };

  // ── REPORT GENERATOR ──
  const generateReport = async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: new Date() });
    const logs = await Promise.all(days.map(d => getLogForDate(d)));

    const moodData = moodHistory.filter(m => m.mood);
    const avgMood  = moodData.length ? (moodData.reduce((a,b) => a+b.mood.val, 0)/moodData.length).toFixed(1) : 'N/A';

    const habitRows = habits.map(h => {
      const done = logs.filter(log => log[h.id]).length;
      const pct  = Math.round(done/days.length*100);
      const bar  = '█'.repeat(Math.round(pct/10)) + '░'.repeat(10-Math.round(pct/10));
      return `${h.icon} ${h.name.padEnd(22)} ${bar} ${pct}%`;
    }).join('\n');

    const report = `
╔══════════════════════════════════════╗
║         HABITFLOW WEEKLY REPORT       ║
╚══════════════════════════════════════╝

📅 Week of ${format(weekStart, 'MMMM d, yyyy')}
🕐 Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}

──────────────────────────────────────
📊 WEEKLY SUMMARY
──────────────────────────────────────
✅ Habits completed : ${weekStats.done} / ${weekStats.total}
📈 Completion rate  : ${weekStats.pct}%
😊 Avg mood score   : ${avgMood} / 5
🔥 Current streak   : Active

──────────────────────────────────────
📋 HABIT BREAKDOWN
──────────────────────────────────────
${habitRows}

──────────────────────────────────────
😊 MOOD THIS WEEK
──────────────────────────────────────
${moodHistory.map(m => `${format(m.date,'EEE dd')} : ${m.mood ? MOODS.find(x=>x.val===m.mood.val)?.emoji + ' ' + MOODS.find(x=>x.val===m.mood.val)?.label : '— not logged'}`).join('\n')}

──────────────────────────────────────
💬 COACH INSIGHTS
──────────────────────────────────────
${weekStats.pct >= 80 ? '🌟 Outstanding week! You\'re building serious momentum.' :
  weekStats.pct >= 60 ? '💪 Solid effort. Stay consistent and results will follow.' :
  weekStats.pct >= 40 ? '📈 Room to grow. Focus on your top 3 habits this week.' :
  '🔄 Challenging week. Start fresh tomorrow — every day is a new chance.'}

Grade: ${weekStats.pct >= 80 ? 'A' : weekStats.pct >= 60 ? 'B' : weekStats.pct >= 40 ? 'C' : 'D'} (${weekStats.pct}%)

──────────────────────────────────────
Generated by HabitFlow v1.0
`.trim();

    try {
      await Share.share({ message: report, title: 'HabitFlow Weekly Report' });
    } catch (e) {}
  };

  // Mood correlation insight
  const moodHabitCorrelation = () => {
    const highMoodDays = moodHistory.filter(m => m.mood && m.mood.val >= 4).length;
    const lowMoodDays  = moodHistory.filter(m => m.mood && m.mood.val <= 2).length;
    if (highMoodDays > lowMoodDays) return "📈 Your mood tends to be higher on productive days — your habits are working!";
    if (lowMoodDays > highMoodDays) return "⚠️ Rough week emotionally. Try focusing on just 2-3 key habits to rebuild momentum.";
    return "😐 Mood has been neutral. A consistent habit day often boosts mood significantly.";
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Tabs */}
      <View style={s.tabs}>
        {[['coach','🤖 Coach'],['mood','😊 Mood'],['report','📄 Report']].map(([k,l])=>(
          <TouchableOpacity key={k} style={[s.tab, activeTab===k&&s.tabA]} onPress={()=>setActiveTab(k)}>
            <Text style={[s.tabTxt, activeTab===k&&s.tabTxtA]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ════ AI COACH ════ */}
      {activeTab==='coach' && (
        <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={90}>
          {/* Quick prompts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickPrompts}>
            {QUICK_PROMPTS.map((p,i) => (
              <TouchableOpacity key={i} style={s.quickPrompt} onPress={() => sendMessage(p)}>
                <Text style={s.quickPromptTxt} numberOfLines={2}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chat messages */}
          <ScrollView ref={scrollRef} style={s.chatArea} contentContainerStyle={{ paddingVertical: Spacing.md, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}>
            {messages.map((msg, i) => (
              <View key={i} style={[s.bubble, msg.role==='user' ? s.bubbleUser : s.bubbleBot]}>
                {msg.role==='assistant' && (
                  <View style={s.botAvatar}><Text style={{fontSize:14}}>🤖</Text></View>
                )}
                <View style={[s.bubbleInner, msg.role==='user' ? s.bubbleInnerUser : s.bubbleInnerBot]}>
                  <Text style={[s.bubbleTxt, msg.role==='user' && s.bubbleTxtUser]}>{msg.content}</Text>
                </View>
              </View>
            ))}
            {loading && (
              <View style={[s.bubble, s.bubbleBot]}>
                <View style={s.botAvatar}><Text style={{fontSize:14}}>🤖</Text></View>
                <View style={[s.bubbleInner, s.bubbleInnerBot, {paddingVertical:14}]}>
                  <ActivityIndicator color={Colors.primary} size="small"/>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={s.inputBar}>
            <TouchableOpacity onPress={clearChat} style={s.clearBtn}>
              <Text style={{fontSize:16}}>🗑</Text>
            </TouchableOpacity>
            <TextInput
              style={s.chatInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask your coach anything..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxHeight={80}
              onSubmitEditing={() => sendMessage()}
            />
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: input.trim() ? Colors.primary : Colors.border }]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}>
              <Text style={[s.sendBtnTxt, { color: input.trim() ? Colors.bg : Colors.textMuted }]}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ════ MOOD TRACKER ════ */}
      {activeTab==='mood' && (
        <ScrollView contentContainerStyle={{ paddingBottom:100 }} showsVerticalScrollIndicator={false}>

          {/* Log today's mood */}
          <View style={s.moodCard}>
            <View style={s.moodCardHeader}>
              <Text style={s.moodCardTitle}>How are you feeling today?</Text>
              <Text style={s.moodCardDate}>{format(new Date(),'EEE, MMM d')}</Text>
            </View>
            <View style={s.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m.val} style={[s.moodBtn, todayMood===m.val && { backgroundColor:m.color+'30', borderColor:m.color, borderWidth:2 }]}
                  onPress={() => { setTodayMood(m.val); setMoodSaved(false); }}>
                  <Text style={s.moodEmoji}>{m.emoji}</Text>
                  <Text style={[s.moodLabel, todayMood===m.val && { color:m.color }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.moodNote} value={moodNote} onChangeText={t => { setMoodNote(t); setMoodSaved(false); }}
              placeholder="Any notes? (optional)" placeholderTextColor={Colors.textMuted} multiline/>
            <TouchableOpacity style={[s.saveMoodBtn, !todayMood && { opacity:0.4 }]} onPress={saveMood} disabled={!todayMood}>
              <Text style={s.saveMoodTxt}>{moodSaved ? '✓ Mood Saved' : '💾 Save Mood'}</Text>
            </TouchableOpacity>
          </View>

          {/* 7-day mood chart */}
          <Text style={s.sectionTitle}>MOOD THIS WEEK</Text>
          <View style={s.moodChartCard}>
            <View style={s.moodChart}>
              {moodHistory.map(({ date, mood }, i) => {
                const m = mood ? MOODS.find(x => x.val===mood.val) : null;
                return (
                  <View key={i} style={s.moodChartCol}>
                    <View style={s.moodBarTrack}>
                      {m && <View style={[s.moodBarFill, { height:`${m.val*20}%`, backgroundColor:m.color }]}/>}
                    </View>
                    <Text style={s.moodBarEmoji}>{m?.emoji || '—'}</Text>
                    <Text style={s.moodBarDay}>{format(date,'EEE')}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Mood-habit correlation */}
          <View style={s.insightCard}>
            <Text style={s.insightTitle}>🔍 Insight</Text>
            <Text style={s.insightTxt}>{moodHabitCorrelation()}</Text>
          </View>

          {/* Mood stats */}
          <Text style={s.sectionTitle}>MOOD PATTERNS</Text>
          <View style={s.moodStatsRow}>
            {MOODS.map(m => {
              const count = moodHistory.filter(h => h.mood?.val === m.val).length;
              return (
                <View key={m.val} style={s.moodStatChip}>
                  <Text style={s.moodStatEmoji}>{m.emoji}</Text>
                  <Text style={[s.moodStatCount, { color:m.color }]}>{count}</Text>
                  <Text style={s.moodStatLabel}>{m.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Mood tips */}
          <View style={s.tipsCard}>
            <Text style={s.tipsTitle}>💡 Mood Boosters</Text>
            {[
              ['🏃','Exercise for 20+ mins — instant mood lift'],
              ['😴','7-8h sleep — biggest mood factor for students'],
              ['📚','Complete 3 habits in morning — builds momentum'],
              ['🌿','5 min outside — reduces stress significantly'],
              ['🧘','Deep breathing for 2 min — resets anxiety'],
            ].map(([e,t],i) => (
              <View key={i} style={s.tipRow}>
                <Text style={{fontSize:16,width:24}}>{e}</Text>
                <Text style={s.tipTxt}>{t}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ════ REPORT ════ */}
      {activeTab==='report' && (
        <ScrollView contentContainerStyle={{ paddingBottom:100 }} showsVerticalScrollIndicator={false}>

          {/* Report card preview */}
          <View style={s.reportPreview}>
            <View style={s.reportHeader}>
              <Text style={s.reportLogo}>HabitFlow</Text>
              <Text style={s.reportWeek}>Week of {format(startOfWeek(new Date(),{weekStartsOn:1}),'MMM d, yyyy')}</Text>
            </View>

            <View style={s.reportStats}>
              {[
                [weekStats.pct+'%','Completion',Colors.primary],
                [weekStats.done+'/'+weekStats.total,'Habits Done',Colors.green],
                [weekStats.pct>=80?'A':weekStats.pct>=60?'B':weekStats.pct>=40?'C':'D','Grade',
                  weekStats.pct>=80?Colors.green:weekStats.pct>=60?Colors.primary:weekStats.pct>=40?Colors.amber:Colors.coral],
              ].map(([v,l,c])=>(
                <View key={l} style={s.reportStatChip}>
                  <Text style={[s.reportStatVal,{color:c}]}>{v}</Text>
                  <Text style={s.reportStatKey}>{l}</Text>
                </View>
              ))}
            </View>

            <Text style={s.reportSectionTitle}>HABIT BREAKDOWN</Text>
            {habits.map(h => {
              const pct = weekStats.pct;
              return (
                <View key={h.id} style={s.reportHabitRow}>
                  <Text style={{fontSize:14,width:22}}>{h.icon}</Text>
                  <Text style={s.reportHabitName} numberOfLines={1}>{h.name}</Text>
                  <View style={s.reportBarTrack}>
                    <View style={[s.reportBarFill,{width:`${pct}%`,backgroundColor:h.color}]}/>
                  </View>
                  <Text style={[s.reportPct,{color:h.color}]}>{pct}%</Text>
                </View>
              );
            })}

            <Text style={s.reportSectionTitle}>MOOD THIS WEEK</Text>
            <View style={s.reportMoodRow}>
              {moodHistory.map(({date,mood},i) => {
                const m = mood ? MOODS.find(x=>x.val===mood.val) : null;
                return (
                  <View key={i} style={s.reportMoodCell}>
                    <Text style={{fontSize:16}}>{m?.emoji||'—'}</Text>
                    <Text style={s.reportMoodDay}>{format(date,'EEE')}</Text>
                  </View>
                );
              })}
            </View>

            <View style={[s.reportGradeBanner,{
              backgroundColor: weekStats.pct>=80?Colors.green+'22':weekStats.pct>=60?Colors.primary+'22':Colors.amber+'22',
              borderColor:     weekStats.pct>=80?Colors.green:weekStats.pct>=60?Colors.primary:Colors.amber,
            }]}>
              <Text style={[s.reportGradeMsg,{color:weekStats.pct>=80?Colors.green:weekStats.pct>=60?Colors.primary:Colors.amber}]}>
                {weekStats.pct>=80?'🌟 Outstanding week!':weekStats.pct>=60?'💪 Solid effort!':weekStats.pct>=40?'📈 Keep building!':'🔄 New week, fresh start!'}
              </Text>
            </View>
          </View>

          {/* Export button */}
          <TouchableOpacity style={s.exportBtn} onPress={generateReport}>
            <Text style={{fontSize:22}}>📤</Text>
            <View style={{flex:1,marginLeft:Spacing.md}}>
              <Text style={s.exportBtnTitle}>Export Weekly Report</Text>
              <Text style={s.exportBtnSub}>Share as text via WhatsApp, email, anywhere</Text>
            </View>
          </TouchableOpacity>

          {/* What's inside */}
          <View style={s.reportInfoCard}>
            <Text style={s.reportInfoTitle}>📋 Report includes:</Text>
            {['Weekly completion rate & grade','Habit-by-habit breakdown with progress bars','Daily mood tracker summary','AI coach personalised message','Formatted for easy sharing'].map((item,i)=>(
              <View key={i} style={s.reportInfoRow}>
                <Text style={{color:Colors.primary,fontWeight:'700'}}>✓</Text>
                <Text style={s.reportInfoTxt}>{item}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex:1, backgroundColor:Colors.bg },
  tabs:      { flexDirection:'row', marginHorizontal:Spacing.lg, marginTop:Spacing.md, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:4, borderWidth:1, borderColor:Colors.border, gap:4 },
  tab:       { flex:1, paddingVertical:9, borderRadius:Radius.lg, alignItems:'center' },
  tabA:      { backgroundColor:Colors.primary },
  tabTxt:    { ...Typography.caption, fontWeight:'700', color:Colors.textMuted },
  tabTxtA:   { color:Colors.bg, fontWeight:'800' },

  // Chat
  quickPrompts:  { paddingHorizontal:Spacing.lg, paddingVertical:Spacing.sm, gap:8, flexDirection:'row' },
  quickPrompt:   { backgroundColor:Colors.bgCard, borderRadius:Radius.lg, padding:Spacing.sm, borderWidth:1, borderColor:Colors.primary+'44', maxWidth:160 },
  quickPromptTxt:{ fontSize:11, color:Colors.primary, fontWeight:'600', lineHeight:16 },

  chatArea:      { flex:1, paddingHorizontal:Spacing.lg },
  bubble:        { flexDirection:'row', marginBottom:Spacing.md, alignItems:'flex-end' },
  bubbleBot:     { justifyContent:'flex-start' },
  bubbleUser:    { justifyContent:'flex-end' },
  botAvatar:     { width:28, height:28, borderRadius:14, backgroundColor:Colors.primaryDim, alignItems:'center', justifyContent:'center', marginRight:8, marginBottom:2 },
  bubbleInner:   { maxWidth:'80%', borderRadius:Radius.xl, padding:Spacing.md },
  bubbleInnerBot:{ backgroundColor:Colors.bgCard, borderWidth:1, borderColor:Colors.border, borderBottomLeftRadius:4 },
  bubbleInnerUser:{ backgroundColor:Colors.primary, borderBottomRightRadius:4 },
  bubbleTxt:     { fontSize:14, color:Colors.textPrimary, lineHeight:21 },
  bubbleTxtUser: { color:Colors.bg },

  inputBar:      { flexDirection:'row', alignItems:'flex-end', paddingHorizontal:Spacing.lg, paddingVertical:Spacing.md, borderTopWidth:1, borderColor:Colors.border, gap:Spacing.sm, backgroundColor:Colors.bg },
  clearBtn:      { width:36, height:36, borderRadius:18, backgroundColor:Colors.bgCard, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:Colors.border },
  chatInput:     { flex:1, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, paddingHorizontal:Spacing.md, paddingVertical:10, color:Colors.textPrimary, borderWidth:1, borderColor:Colors.border, fontSize:14, minHeight:40 },
  sendBtn:       { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  sendBtnTxt:    { fontSize:18, fontWeight:'800' },

  // Mood
  moodCard:      { marginHorizontal:Spacing.lg, marginTop:Spacing.md, backgroundColor:Colors.bgCard, borderRadius:Radius.xxl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border, marginBottom:Spacing.lg },
  moodCardHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:Spacing.md },
  moodCardTitle: { fontSize:16, fontWeight:'700', color:Colors.textPrimary },
  moodCardDate:  { ...Typography.caption },
  moodRow:       { flexDirection:'row', justifyContent:'space-between', marginBottom:Spacing.md },
  moodBtn:       { alignItems:'center', padding:Spacing.sm, borderRadius:Radius.lg, flex:1, marginHorizontal:2, borderWidth:1, borderColor:Colors.border },
  moodEmoji:     { fontSize:24 },
  moodLabel:     { fontSize:9, fontWeight:'700', color:Colors.textMuted, marginTop:3 },
  moodNote:      { backgroundColor:Colors.bgInput, borderRadius:Radius.md, padding:Spacing.md, color:Colors.textPrimary, borderWidth:1, borderColor:Colors.border, fontSize:14, marginBottom:Spacing.md },
  saveMoodBtn:   { backgroundColor:Colors.primary, borderRadius:Radius.full, padding:Spacing.md, alignItems:'center' },
  saveMoodTxt:   { color:Colors.bg, fontWeight:'800', fontSize:14 },

  sectionTitle:  { ...Typography.label, marginHorizontal:Spacing.lg, marginBottom:Spacing.sm, marginTop:Spacing.sm },

  moodChartCard: { marginHorizontal:Spacing.lg, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border, marginBottom:Spacing.lg },
  moodChart:     { flexDirection:'row', height:100, alignItems:'flex-end', gap:6 },
  moodChartCol:  { flex:1, alignItems:'center', height:'100%', justifyContent:'flex-end' },
  moodBarTrack:  { flex:1, width:'70%', backgroundColor:Colors.border, borderRadius:4, justifyContent:'flex-end', overflow:'hidden' },
  moodBarFill:   { width:'100%', borderRadius:4, minHeight:4 },
  moodBarEmoji:  { fontSize:14, marginTop:4 },
  moodBarDay:    { ...Typography.caption, fontSize:9, marginTop:2 },

  insightCard:   { marginHorizontal:Spacing.lg, backgroundColor:Colors.primaryDim, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.primary+'44', marginBottom:Spacing.lg },
  insightTitle:  { fontSize:14, fontWeight:'700', color:Colors.primary, marginBottom:6 },
  insightTxt:    { fontSize:14, color:Colors.textPrimary, lineHeight:21 },

  moodStatsRow:  { flexDirection:'row', marginHorizontal:Spacing.lg, gap:Spacing.sm, marginBottom:Spacing.lg },
  moodStatChip:  { flex:1, backgroundColor:Colors.bgCard, borderRadius:Radius.lg, padding:Spacing.sm, alignItems:'center', borderWidth:1, borderColor:Colors.border },
  moodStatEmoji: { fontSize:18 },
  moodStatCount: { fontSize:18, fontWeight:'800', marginTop:2 },
  moodStatLabel: { ...Typography.caption, fontSize:9, marginTop:2 },

  tipsCard:      { marginHorizontal:Spacing.lg, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border },
  tipsTitle:     { fontSize:15, fontWeight:'700', color:Colors.textPrimary, marginBottom:Spacing.md },
  tipRow:        { flexDirection:'row', alignItems:'center', gap:Spacing.sm, marginBottom:Spacing.sm },
  tipTxt:        { fontSize:13, color:Colors.textSecondary, flex:1, lineHeight:18 },

  // Report
  reportPreview: { marginHorizontal:Spacing.lg, marginTop:Spacing.md, backgroundColor:Colors.bgCard, borderRadius:Radius.xxl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border, marginBottom:Spacing.lg },
  reportHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:Spacing.lg, paddingBottom:Spacing.md, borderBottomWidth:1, borderColor:Colors.border },
  reportLogo:    { fontSize:18, fontWeight:'900', color:Colors.primary },
  reportWeek:    { ...Typography.caption },
  reportStats:   { flexDirection:'row', gap:Spacing.sm, marginBottom:Spacing.lg },
  reportStatChip:{ flex:1, alignItems:'center', backgroundColor:Colors.bgInput, borderRadius:Radius.lg, padding:Spacing.md, borderWidth:1, borderColor:Colors.border },
  reportStatVal: { fontSize:20, fontWeight:'900' },
  reportStatKey: { ...Typography.caption, marginTop:2, fontSize:9 },
  reportSectionTitle:{ ...Typography.label, marginBottom:Spacing.sm, marginTop:Spacing.md },
  reportHabitRow:{ flexDirection:'row', alignItems:'center', marginBottom:6, gap:6 },
  reportHabitName:{ fontSize:12, color:Colors.textSecondary, width:90 },
  reportBarTrack:{ flex:1, height:5, backgroundColor:Colors.border, borderRadius:3, overflow:'hidden' },
  reportBarFill: { height:'100%', borderRadius:3 },
  reportPct:     { fontSize:11, fontWeight:'700', width:32, textAlign:'right' },
  reportMoodRow: { flexDirection:'row', gap:Spacing.sm, flexWrap:'wrap', marginBottom:Spacing.md },
  reportMoodCell:{ alignItems:'center', gap:2 },
  reportMoodDay: { ...Typography.caption, fontSize:9 },
  reportGradeBanner:{ borderRadius:Radius.lg, padding:Spacing.md, borderWidth:1, alignItems:'center', marginTop:Spacing.sm },
  reportGradeMsg:{ fontSize:14, fontWeight:'700' },

  exportBtn:     { flexDirection:'row', alignItems:'center', marginHorizontal:Spacing.lg, backgroundColor:Colors.primary, borderRadius:Radius.xl, padding:Spacing.lg, marginBottom:Spacing.lg },
  exportBtnTitle:{ fontSize:15, fontWeight:'800', color:Colors.bg },
  exportBtnSub:  { fontSize:12, color:Colors.bg, opacity:0.8, marginTop:2 },

  reportInfoCard:{ marginHorizontal:Spacing.lg, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border },
  reportInfoTitle:{ fontSize:14, fontWeight:'700', color:Colors.textPrimary, marginBottom:Spacing.md },
  reportInfoRow: { flexDirection:'row', gap:Spacing.sm, marginBottom:Spacing.sm, alignItems:'flex-start' },
  reportInfoTxt: { fontSize:13, color:Colors.textSecondary, flex:1 },
});
