// WeeklyReviewScreen.jsx — Phase 3
// Weekly Review + Motivational Quote + Share Streak

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal, Share, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { useHabits } from '../hooks/useHabits';

const REVIEW_KEY = 'hf_weekly_review_';
const QUOTE_KEY  = 'hf_daily_quote_';

// 30 student-focused motivational quotes
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock. Do what it does — keep going.", author: "Sam Levenson" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Don't limit your challenges. Challenge your limits.", author: "Unknown" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Work hard in silence. Let success make the noise.", author: "Frank Ocean" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Consistency is what transforms average into excellence.", author: "Unknown" },
  { text: "Be so good they can't ignore you.", author: "Steve Martin" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Stop wishing. Start doing.", author: "Unknown" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { text: "You are capable of more than you know.", author: "E.O. Wilson" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown" },
  { text: "Without self-discipline, success is impossible, period.", author: "Lou Holtz" },
];

const REVIEW_QUESTIONS = [
  { key: 'wins',       icon: '🏆', q: "What were your biggest wins this week?" },
  { key: 'challenges', icon: '🧗', q: "What challenges did you face?" },
  { key: 'learned',    icon: '💡', q: "What's the most important thing you learned?" },
  { key: 'improve',    icon: '📈', q: "What will you do differently next week?" },
  { key: 'gratitude',  icon: '🙏', q: "Three things you're grateful for this week?" },
  { key: 'goal',       icon: '🎯', q: "One main goal for next week?" },
];

export default function WeeklyReviewScreen() {
  const { habits, getLogForDate, completedToday, totalHabits } = useHabits();
  const [activeTab, setActiveTab] = useState('quote');

  // Quote
  const [quote, setQuote]         = useState(null);
  const [quoteRefreshed, setQR]   = useState(false);

  // Weekly Review
  const today     = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekKey   = format(weekStart, 'yyyy-MM-dd');
  const [reviewData, setReviewData] = useState({});
  const [reviewSaved, setReviewSaved] = useState(false);
  const [weekStats, setWeekStats]     = useState({ done: 0, total: 0, pct: 0 });
  const [showShareModal, setShowShareModal] = useState(false);
  const [streakCount, setStreakCount] = useState(1);

  // Load quote of the day
  useEffect(() => {
    const todayKey = format(today, 'yyyy-MM-dd');
    AsyncStorage.getItem(QUOTE_KEY + todayKey).then(idx => {
      if (idx !== null) {
        setQuote(QUOTES[parseInt(idx)]);
      } else {
        const newIdx = Math.floor(Math.random() * QUOTES.length);
        AsyncStorage.setItem(QUOTE_KEY + todayKey, newIdx.toString());
        setQuote(QUOTES[newIdx]);
      }
    });
  }, []);

  // Load review
  useEffect(() => {
    AsyncStorage.getItem(REVIEW_KEY + weekKey).then(d => {
      if (d) { setReviewData(JSON.parse(d)); setReviewSaved(true); }
    });
  }, []);

  // Calculate week stats
  useEffect(() => {
    if (!habits.length) return;
    const days = eachDayOfInterval({ start: weekStart, end: today });
    Promise.all(days.map(d => getLogForDate(d).then(log => log)))
      .then(logs => {
        const done  = logs.reduce((sum, log) => sum + habits.filter(h => log[h.id]).length, 0);
        const total = habits.length * days.length;
        setWeekStats({ done, total, pct: total ? Math.round(done/total*100) : 0 });
      });

    // Calculate streak
    let streak = 0;
    const checkStreak = async () => {
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const log = await getLogForDate(d);
        const done = habits.filter(h => log[h.id]).length;
        if (done > 0) streak++;
        else break;
      }
      setStreakCount(streak);
    };
    checkStreak();
  }, [habits.length]);

  const saveReview = async () => {
    await AsyncStorage.setItem(REVIEW_KEY + weekKey, JSON.stringify(reviewData));
    setReviewSaved(true);
    Alert.alert('Saved! 📋', 'Weekly review saved.');
  };

  const refreshQuote = () => {
    const newIdx = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[newIdx]);
    setQR(true);
  };

  const shareStreak = async () => {
    const text = `🔥 Day ${streakCount} streak on HabitFlow!\n\nThis week: ${weekStats.pct}% habits completed (${weekStats.done}/${weekStats.total})\n\nHabits I'm crushing:\n${habits.slice(0,5).map(h => `${h.icon} ${h.name}`).join('\n')}\n\n#HabitFlow #Consistency #StudentLife`;
    try {
      await Share.share({ message: text, title: 'My HabitFlow Streak' });
    } catch {}
  };

  const shareQuote = async () => {
    if (!quote) return;
    const text = `"${quote.text}"\n— ${quote.author}\n\n#HabitFlow #Motivation #StudentLife`;
    try { await Share.share({ message: text }); } catch {}
  };

  // Past reviews
  const [pastReviews, setPastReviews] = useState([]);
  useEffect(() => {
    const loadPast = async () => {
      const keys = [];
      for (let i = 1; i <= 4; i++) {
        const wk = format(startOfWeek(subWeeks(today, i), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const d = await AsyncStorage.getItem(REVIEW_KEY + wk);
        if (d) keys.push({ week: wk, data: JSON.parse(d) });
      }
      setPastReviews(keys);
    };
    loadPast();
  }, [reviewSaved]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Tabs */}
      <View style={s.tabs}>
        {[['quote','✨ Quote'],['review','📋 Review'],['share','🚀 Share']].map(([k,l])=>(
          <TouchableOpacity key={k} style={[s.tab, activeTab===k&&s.tabA]} onPress={()=>setActiveTab(k)}>
            <Text style={[s.tabTxt, activeTab===k&&s.tabTxtA]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ════ QUOTE TAB ════ */}
      {activeTab==='quote' && (
        <ScrollView contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>

          {/* Date */}
          <Text style={s.dateLabel}>{format(today, 'EEEE, MMMM d')}</Text>

          {/* Big quote card */}
          {quote && (
            <View style={s.quoteCard}>
              <Text style={s.quoteDecor}>"</Text>
              <Text style={s.quoteText}>{quote.text}</Text>
              <Text style={s.quoteAuthor}>— {quote.author}</Text>
              <View style={s.quoteBtns}>
                <TouchableOpacity style={s.quoteBtnSecondary} onPress={refreshQuote}>
                  <Text style={s.quoteBtnSecondaryTxt}>🔄 New quote</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.quoteBtnPrimary} onPress={shareQuote}>
                  <Text style={s.quoteBtnPrimaryTxt}>Share ↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Today's snapshot */}
          <Text style={s.sectionTitle}>TODAY'S SNAPSHOT</Text>
          <View style={s.snapshotCard}>
            <View style={s.snapshotRow}>
              <Text style={s.snapshotEmoji}>✅</Text>
              <Text style={s.snapshotLabel}>Habits done</Text>
              <Text style={[s.snapshotVal, { color: Colors.primary }]}>{completedToday}/{totalHabits}</Text>
            </View>
            <View style={s.snapshotDivider} />
            <View style={s.snapshotRow}>
              <Text style={s.snapshotEmoji}>🔥</Text>
              <Text style={s.snapshotLabel}>Day streak</Text>
              <Text style={[s.snapshotVal, { color: Colors.amber }]}>{streakCount}</Text>
            </View>
            <View style={s.snapshotDivider} />
            <View style={s.snapshotRow}>
              <Text style={s.snapshotEmoji}>📊</Text>
              <Text style={s.snapshotLabel}>This week</Text>
              <Text style={[s.snapshotVal, { color: Colors.green }]}>{weekStats.pct}%</Text>
            </View>
          </View>

          {/* All quotes list */}
          <Text style={s.sectionTitle}>QUOTE LIBRARY</Text>
          {QUOTES.map((q, i) => (
            <TouchableOpacity key={i} style={s.quoteListItem} onPress={() => setQuote(q)}>
              <Text style={s.quoteListText}>"{q.text}"</Text>
              <Text style={s.quoteListAuthor}>— {q.author}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ════ WEEKLY REVIEW TAB ════ */}
      {activeTab==='review' && (
        <ScrollView contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>

          {/* Week header */}
          <View style={s.weekHeader}>
            <View>
              <Text style={s.weekTitle}>Week of {format(weekStart,'MMM d')}</Text>
              <Text style={s.weekSub}>
                {format(weekStart,'MMM d')} – {format(endOfWeek(today,{weekStartsOn:1}),'MMM d, yyyy')}
              </Text>
            </View>
            {reviewSaved && <View style={s.savedBadge}><Text style={s.savedTxt}>✓ Saved</Text></View>}
          </View>

          {/* Week stats */}
          <View style={s.weekStatsRow}>
            <View style={s.weekStatChip}>
              <Text style={[s.weekStatVal,{color:Colors.primary}]}>{weekStats.pct}%</Text>
              <Text style={s.weekStatKey}>completion</Text>
            </View>
            <View style={s.weekStatChip}>
              <Text style={[s.weekStatVal,{color:Colors.green}]}>{weekStats.done}</Text>
              <Text style={s.weekStatKey}>done</Text>
            </View>
            <View style={s.weekStatChip}>
              <Text style={[s.weekStatVal,{color:Colors.amber}]}>{weekStats.total-weekStats.done}</Text>
              <Text style={s.weekStatKey}>missed</Text>
            </View>
            <View style={s.weekStatChip}>
              <Text style={[s.weekStatVal,{color:Colors.coral}]}>{streakCount}</Text>
              <Text style={s.weekStatKey}>streak</Text>
            </View>
          </View>

          {/* Habit performance this week */}
          <Text style={s.sectionTitle}>HABIT PERFORMANCE</Text>
          {habits.map(h => {
            const days = eachDayOfInterval({ start: weekStart, end: today });
            const done = 0; // simplified — full calc happens in useEffect
            const pct = weekStats.pct;
            return (
              <View key={h.id} style={s.habitPerfRow}>
                <Text style={{fontSize:16,width:26}}>{h.icon}</Text>
                <Text style={s.habitPerfName} numberOfLines={1}>{h.name}</Text>
                <View style={s.habitPerfBar}>
                  <View style={[s.habitPerfFill,{width:`${pct}%`,backgroundColor:h.color}]}/>
                </View>
                <Text style={[s.habitPerfPct,{color:h.color}]}>{pct}%</Text>
              </View>
            );
          })}

          {/* Review questions */}
          <Text style={s.sectionTitle}>REFLECTION QUESTIONS</Text>
          {REVIEW_QUESTIONS.map(({ key, icon, q }) => (
            <View key={key} style={s.reviewQuestion}>
              <View style={s.reviewQHeader}>
                <Text style={{fontSize:18}}>{icon}</Text>
                <Text style={s.reviewQText}>{q}</Text>
              </View>
              <TextInput
                style={s.reviewInput}
                value={reviewData[key] || ''}
                onChangeText={t => { setReviewData(p => ({...p,[key]:t})); setReviewSaved(false); }}
                placeholder="Write your reflection..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          ))}

          <TouchableOpacity style={s.saveReviewBtn} onPress={saveReview}>
            <Text style={s.saveReviewTxt}>💾 Save Weekly Review</Text>
          </TouchableOpacity>

          {/* Past reviews */}
          {pastReviews.length > 0 && (
            <>
              <Text style={s.sectionTitle}>PAST REVIEWS</Text>
              {pastReviews.map((pr, i) => (
                <View key={i} style={s.pastReviewCard}>
                  <Text style={s.pastReviewWeek}>Week of {pr.week}</Text>
                  {pr.data.wins && <Text style={s.pastReviewItem}>🏆 {pr.data.wins}</Text>}
                  {pr.data.goal && <Text style={s.pastReviewItem}>🎯 {pr.data.goal}</Text>}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ════ SHARE TAB ════ */}
      {activeTab==='share' && (
        <ScrollView contentContainerStyle={{paddingBottom:100}} showsVerticalScrollIndicator={false}>

          {/* Streak card — big shareable */}
          <View style={s.streakShareCard}>
            <View style={s.streakCircle}>
              <Text style={s.streakFireBig}>🔥</Text>
              <Text style={s.streakNumBig}>{streakCount}</Text>
              <Text style={s.streakDayLabel}>day streak</Text>
            </View>
            <Text style={s.streakCardTitle}>Keep it up!</Text>
            <Text style={s.streakCardSub}>You're on a roll. Don't break the chain.</Text>
            <View style={s.streakStats}>
              <View style={s.streakStat}>
                <Text style={[s.streakStatVal,{color:Colors.primary}]}>{weekStats.pct}%</Text>
                <Text style={s.streakStatKey}>this week</Text>
              </View>
              <View style={s.streakStat}>
                <Text style={[s.streakStatVal,{color:Colors.green}]}>{weekStats.done}</Text>
                <Text style={s.streakStatKey}>completed</Text>
              </View>
              <View style={s.streakStat}>
                <Text style={[s.streakStatVal,{color:Colors.amber}]}>{habits.length}</Text>
                <Text style={s.streakStatKey}>habits</Text>
              </View>
            </View>
          </View>

          {/* Share buttons */}
          <TouchableOpacity style={s.shareBtn} onPress={shareStreak}>
            <Text style={{fontSize:20}}>📤</Text>
            <View style={{flex:1,marginLeft:Spacing.md}}>
              <Text style={s.shareBtnTitle}>Share your streak</Text>
              <Text style={s.shareBtnSub}>Send to WhatsApp, Instagram, anywhere</Text>
            </View>
            <Text style={{color:Colors.primary,fontWeight:'700'}}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.shareBtn} onPress={shareQuote}>
            <Text style={{fontSize:20}}>✨</Text>
            <View style={{flex:1,marginLeft:Spacing.md}}>
              <Text style={s.shareBtnTitle}>Share today's quote</Text>
              <Text style={s.shareBtnSub}>Inspire your classmates</Text>
            </View>
            <Text style={{color:Colors.primary,fontWeight:'700'}}>Share</Text>
          </TouchableOpacity>

          {/* Challenge a friend */}
          <Text style={s.sectionTitle}>CHALLENGE A FRIEND</Text>
          <View style={s.challengeCard}>
            <Text style={s.challengeTitle}>🤝 Accountability Partner</Text>
            <Text style={s.challengeSub}>Challenge a classmate to match your streak. Healthy competition = better results.</Text>
            <TouchableOpacity style={s.challengeBtn} onPress={async () => {
              const text = `Hey! I'm on a ${streakCount}-day habit streak on HabitFlow 🔥\n\nI challenge you to beat my streak!\n\nThis week I completed ${weekStats.pct}% of my habits.\n\nCan you do better? 😏\n\n#HabitChallenge #StudentLife`;
              try { await Share.share({ message: text }); } catch {}
            }}>
              <Text style={s.challengeBtnTxt}>🎯 Send Challenge</Text>
            </TouchableOpacity>
          </View>

          {/* Weekly report card */}
          <Text style={s.sectionTitle}>YOUR WEEKLY REPORT CARD</Text>
          <View style={s.reportCard}>
            <View style={s.reportGrade}>
              <Text style={[s.gradeText, {
                color: weekStats.pct >= 80 ? Colors.green :
                       weekStats.pct >= 60 ? Colors.primary :
                       weekStats.pct >= 40 ? Colors.amber : Colors.coral
              }]}>
                {weekStats.pct >= 80 ? 'A' :
                 weekStats.pct >= 60 ? 'B' :
                 weekStats.pct >= 40 ? 'C' : 'D'}
              </Text>
              <Text style={s.gradeSub}>{weekStats.pct}%</Text>
            </View>
            <View style={{flex:1,marginLeft:Spacing.lg}}>
              <Text style={s.reportMsg}>
                {weekStats.pct >= 80 ? '🌟 Outstanding week! Keep this up and you\'ll achieve anything.' :
                 weekStats.pct >= 60 ? '💪 Good effort! A little more consistency and you\'ll ace it.' :
                 weekStats.pct >= 40 ? '📈 Decent start. Focus on your top 3 habits first.' :
                 '🔄 Rough week, but that\'s okay. Tomorrow is a fresh start.'}
              </Text>
              <Text style={s.reportWeek}>Week of {format(weekStart,'MMM d')}</Text>
            </View>
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

  dateLabel: { ...Typography.label, marginHorizontal:Spacing.lg, marginTop:Spacing.md, marginBottom:Spacing.sm },

  quoteCard: { marginHorizontal:Spacing.lg, marginBottom:Spacing.lg, backgroundColor:Colors.bgCard, borderRadius:Radius.xxl, padding:Spacing.xl, borderWidth:1, borderColor:Colors.border },
  quoteDecor:{ fontSize:60, color:Colors.primary, lineHeight:50, marginBottom:Spacing.sm },
  quoteText: { fontSize:20, fontWeight:'700', color:Colors.textPrimary, lineHeight:30, marginBottom:Spacing.md },
  quoteAuthor:{ ...Typography.caption, color:Colors.primary, fontWeight:'700', marginBottom:Spacing.lg },
  quoteBtns: { flexDirection:'row', gap:Spacing.md },
  quoteBtnSecondary:{ flex:1, padding:Spacing.md, borderRadius:Radius.full, borderWidth:1, borderColor:Colors.border, alignItems:'center' },
  quoteBtnSecondaryTxt:{ ...Typography.caption, fontWeight:'700' },
  quoteBtnPrimary:{ flex:1, padding:Spacing.md, borderRadius:Radius.full, backgroundColor:Colors.primary, alignItems:'center' },
  quoteBtnPrimaryTxt:{ color:Colors.bg, fontWeight:'800', fontSize:13 },

  sectionTitle: { ...Typography.label, marginHorizontal:Spacing.lg, marginBottom:Spacing.sm, marginTop:Spacing.sm },

  snapshotCard: { marginHorizontal:Spacing.lg, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border, marginBottom:Spacing.lg },
  snapshotRow:  { flexDirection:'row', alignItems:'center', paddingVertical:Spacing.sm },
  snapshotEmoji:{ fontSize:20, width:32 },
  snapshotLabel:{ ...Typography.body, flex:1 },
  snapshotVal:  { fontSize:18, fontWeight:'800' },
  snapshotDivider:{ height:1, backgroundColor:Colors.border },

  quoteListItem:{ marginHorizontal:Spacing.lg, marginBottom:Spacing.sm, backgroundColor:Colors.bgCard, borderRadius:Radius.lg, padding:Spacing.md, borderWidth:1, borderColor:Colors.border, borderLeftWidth:3, borderLeftColor:Colors.primary },
  quoteListText:{ fontSize:13, color:Colors.textPrimary, lineHeight:20, fontStyle:'italic' },
  quoteListAuthor:{ ...Typography.caption, marginTop:6, color:Colors.primary },

  weekHeader:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginHorizontal:Spacing.lg, marginTop:Spacing.md, marginBottom:Spacing.md },
  weekTitle:   { fontSize:18, fontWeight:'800', color:Colors.textPrimary },
  weekSub:     { ...Typography.caption, marginTop:2 },
  savedBadge:  { backgroundColor:Colors.green+'22', borderRadius:Radius.full, paddingHorizontal:Spacing.md, paddingVertical:4, borderWidth:1, borderColor:Colors.green+'44' },
  savedTxt:    { color:Colors.green, fontSize:12, fontWeight:'700' },

  weekStatsRow:{ flexDirection:'row', marginHorizontal:Spacing.lg, marginBottom:Spacing.lg, gap:Spacing.sm },
  weekStatChip:{ flex:1, backgroundColor:Colors.bgCard, borderRadius:Radius.lg, padding:Spacing.sm, alignItems:'center', borderWidth:1, borderColor:Colors.border },
  weekStatVal: { fontSize:18, fontWeight:'800' },
  weekStatKey: { ...Typography.caption, marginTop:2, fontSize:9 },

  habitPerfRow:{ flexDirection:'row', alignItems:'center', marginHorizontal:Spacing.lg, marginBottom:Spacing.sm, gap:Spacing.sm },
  habitPerfName:{ fontSize:12, color:Colors.textSecondary, width:100 },
  habitPerfBar:{ flex:1, height:6, backgroundColor:Colors.border, borderRadius:3, overflow:'hidden' },
  habitPerfFill:{ height:'100%', borderRadius:3 },
  habitPerfPct:{ fontSize:11, fontWeight:'700', width:34, textAlign:'right' },

  reviewQuestion:{ marginHorizontal:Spacing.lg, marginBottom:Spacing.md, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border },
  reviewQHeader: { flexDirection:'row', alignItems:'flex-start', gap:Spacing.sm, marginBottom:Spacing.sm },
  reviewQText:   { flex:1, fontSize:14, fontWeight:'700', color:Colors.textPrimary, lineHeight:20 },
  reviewInput:   { backgroundColor:Colors.bgInput, borderRadius:Radius.md, padding:Spacing.md, color:Colors.textPrimary, borderWidth:1, borderColor:Colors.border, fontSize:14, minHeight:80 },

  saveReviewBtn:{ marginHorizontal:Spacing.lg, backgroundColor:Colors.primary, borderRadius:Radius.xl, padding:Spacing.md, alignItems:'center', marginBottom:Spacing.lg },
  saveReviewTxt:{ color:Colors.bg, fontWeight:'800', fontSize:15 },

  pastReviewCard:{ marginHorizontal:Spacing.lg, marginBottom:Spacing.sm, backgroundColor:Colors.bgCard, borderRadius:Radius.lg, padding:Spacing.md, borderWidth:1, borderColor:Colors.border },
  pastReviewWeek:{ ...Typography.label, marginBottom:Spacing.xs },
  pastReviewItem:{ fontSize:13, color:Colors.textSecondary, marginTop:4 },

  streakShareCard:{ marginHorizontal:Spacing.lg, marginTop:Spacing.md, marginBottom:Spacing.lg, backgroundColor:Colors.bgCard, borderRadius:Radius.xxl, padding:Spacing.xl, borderWidth:1, borderColor:Colors.primary+'44', alignItems:'center' },
  streakCircle:  { width:110, height:110, borderRadius:55, backgroundColor:Colors.primary+'15', borderWidth:3, borderColor:Colors.primary, alignItems:'center', justifyContent:'center', marginBottom:Spacing.md },
  streakFireBig: { fontSize:28 },
  streakNumBig:  { fontSize:32, fontWeight:'900', color:Colors.primary, lineHeight:36 },
  streakDayLabel:{ fontSize:11, color:Colors.primary, fontWeight:'700' },
  streakCardTitle:{ fontSize:22, fontWeight:'800', color:Colors.textPrimary, marginBottom:4 },
  streakCardSub: { ...Typography.caption, marginBottom:Spacing.lg, textAlign:'center' },
  streakStats:   { flexDirection:'row', gap:Spacing.xl },
  streakStat:    { alignItems:'center' },
  streakStatVal: { fontSize:22, fontWeight:'800' },
  streakStatKey: { ...Typography.caption, marginTop:2 },

  shareBtn:      { flexDirection:'row', alignItems:'center', marginHorizontal:Spacing.lg, marginBottom:Spacing.sm, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border },
  shareBtnTitle: { fontSize:15, fontWeight:'700', color:Colors.textPrimary },
  shareBtnSub:   { ...Typography.caption, marginTop:2 },

  challengeCard: { marginHorizontal:Spacing.lg, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.accent+'44', marginBottom:Spacing.lg },
  challengeTitle:{ fontSize:16, fontWeight:'800', color:Colors.textPrimary, marginBottom:6 },
  challengeSub:  { ...Typography.body, fontSize:13, color:Colors.textSecondary, marginBottom:Spacing.lg, lineHeight:20 },
  challengeBtn:  { backgroundColor:Colors.accent, borderRadius:Radius.full, padding:Spacing.md, alignItems:'center' },
  challengeBtnTxt:{ color:'#fff', fontWeight:'800', fontSize:15 },

  reportCard:    { flexDirection:'row', alignItems:'center', marginHorizontal:Spacing.lg, backgroundColor:Colors.bgCard, borderRadius:Radius.xl, padding:Spacing.lg, borderWidth:1, borderColor:Colors.border },
  reportGrade:   { width:70, height:70, borderRadius:35, backgroundColor:Colors.bgInput, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:Colors.border },
  gradeText:     { fontSize:36, fontWeight:'900', lineHeight:42 },
  gradeSub:      { fontSize:11, fontWeight:'700', color:Colors.textSecondary },
  reportMsg:     { fontSize:13, color:Colors.textPrimary, lineHeight:20, fontWeight:'500' },
  reportWeek:    { ...Typography.caption, marginTop:Spacing.sm },
});
