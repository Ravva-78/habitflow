// src/screens/OnboardingScreen.jsx
// First-time user onboarding — shown only on first launch

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Dimensions, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Typography } from '../theme';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'hf_onboarded';
const PROFILE_KEY    = 'hf_profile';

const SLIDES = [
  {
    emoji:    '⚔️',
    title:    'Welcome to HabitFlow',
    subtitle: 'Build habits. Earn XP. Level up your life.',
    color:    Colors.primary,
  },
  {
    emoji:    '🎯',
    title:    'Daily Quests',
    subtitle: 'Your habits become quests. Complete them to earn XP and level up from Novice to Mythic.',
    color:    Colors.accent,
  },
  {
    emoji:    '📊',
    title:    'Track Everything',
    subtitle: 'Weekly grids, productivity radar, mood tracker, study sessions — all in one place.',
    color:    Colors.green,
  },
  {
    emoji:    '🤖',
    title:    'Your AI Coach',
    subtitle: 'A personal habit coach powered by Claude AI. Knows your data and gives advice just for you.',
    color:    Colors.amber,
  },
  {
    emoji:    '🔥',
    title:    "Let's set you up!",
    subtitle: 'Tell us a bit about yourself so we can personalise your experience.',
    color:    Colors.coral,
    isSetup:  true,
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [page, setPage]       = useState(0);
  const [name, setName]       = useState('');
  const [why, setWhy]         = useState('');
  const [goal, setGoal]       = useState('');
  const scrollRef             = useRef(null);

  const GOALS = [
    { id: 'student',  label: '📚 Student', sub: 'Study + grades' },
    { id: 'fitness',  label: '💪 Fitness', sub: 'Health + exercise' },
    { id: 'career',   label: '💼 Career',  sub: 'Skills + work' },
    { id: 'balance',  label: '⚖️ Balance', sub: 'All-round growth' },
  ];

  const goNext = () => {
    if (page < SLIDES.length - 1) {
      const next = page + 1;
      setPage(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    }
  };

  const finish = async () => {
    const profile = {
      name:     name.trim() || 'Champion',
      why:      why.trim(),
      goal,
      joinDate: new Date().toISOString(),
    };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete(profile);
  };

  const slide = SLIDES[page];

  return (
    <SafeAreaView style={s.safe}>
      {/* Progress dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[s.dot, i === page && s.dotActive, i === page && { backgroundColor: slide.color }]} />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}>

        {SLIDES.map((sl, i) => (
          <View key={i} style={[s.slide, { width }]}>

            {/* Emoji hero */}
            <View style={[s.emojiWrap, { backgroundColor: sl.color + '15', borderColor: sl.color + '30' }]}>
              <Text style={s.emoji}>{sl.emoji}</Text>
            </View>

            <Text style={[s.slideTitle, { color: sl.color }]}>{sl.title}</Text>
            <Text style={s.slideSub}>{sl.subtitle}</Text>

            {/* Setup form on last slide */}
            {sl.isSetup && (
              <View style={s.setupForm}>

                <Text style={s.fieldLabel}>YOUR NAME</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="What should we call you?"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />

                <Text style={s.fieldLabel}>YOUR MAIN GOAL</Text>
                <View style={s.goalsGrid}>
                  {GOALS.map(g => (
                    <TouchableOpacity
                      key={g.id}
                      style={[s.goalChip, goal === g.id && { backgroundColor: Colors.primaryDim, borderColor: Colors.primary }]}
                      onPress={() => setGoal(g.id)}>
                      <Text style={[s.goalLabel, goal === g.id && { color: Colors.primary }]}>{g.label}</Text>
                      <Text style={s.goalSub}>{g.sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.fieldLabel}>YOUR "WHY" (OPTIONAL)</Text>
                <TextInput
                  style={[s.input, { minHeight: 70 }]}
                  value={why}
                  onChangeText={setWhy}
                  placeholder="Why do you want to build better habits?"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom button */}
      <View style={s.bottom}>
        {page < SLIDES.length - 1 ? (
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: slide.color }]} onPress={goNext}>
            <Text style={s.nextBtnTxt}>
              {page === 0 ? "Let's Go! →" : 'Next →'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: Colors.primary }, (!name.trim() || !goal) && s.btnDisabled]}
            onPress={finish}
            disabled={!name.trim() || !goal}>
            <Text style={s.nextBtnTxt}>🚀 Start My Journey!</Text>
          </TouchableOpacity>
        )}

        {page > 0 && page < SLIDES.length - 1 && (
          <TouchableOpacity style={s.skipBtn} onPress={() => { setPage(SLIDES.length - 1); scrollRef.current?.scrollTo({ x: (SLIDES.length - 1) * width, animated: true }); }}>
            <Text style={s.skipTxt}>Skip intro</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 24, borderRadius: 4 },

  slide:     { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  emojiWrap: { width: 120, height: 120, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: Spacing.xl },
  emoji:     { fontSize: 56 },
  slideTitle:{ fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: Spacing.md, letterSpacing: -0.5 },
  slideSub:  { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },

  setupForm: { width: '100%', marginTop: Spacing.sm },
  fieldLabel:{ ...Typography.label, marginBottom: Spacing.sm, marginTop: Spacing.md },
  input:     { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, fontSize: 15, marginBottom: Spacing.sm },

  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  goalChip:  { flex: 1, minWidth: '45%', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  goalLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  goalSub:   { fontSize: 11, color: Colors.textMuted },

  bottom:    { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.sm },
  nextBtn:   { borderRadius: Radius.full, padding: Spacing.lg, alignItems: 'center' },
  nextBtnTxt:{ fontSize: 16, fontWeight: '900', color: Colors.bg },
  btnDisabled:{ opacity: 0.4 },
  skipBtn:   { alignItems: 'center', padding: Spacing.sm },
  skipTxt:   { ...Typography.caption, color: Colors.textMuted },
});
