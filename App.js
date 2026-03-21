// App.js — PLAY STORE READY
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen         from './src/screens/HomeScreen';
import FocusScreen        from './src/screens/FocusScreen';
import StudyScreen        from './src/screens/StudyScreen';
import WeeklyReviewScreen from './src/screens/WeeklyReviewScreen';
import AICoachScreen      from './src/screens/AICoachScreen';
import OnboardingScreen   from './src/screens/OnboardingScreen';
import ErrorBoundary      from './src/components/ErrorBoundary';
import { Colors, Radius } from './src/theme';

import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';


const Tab = createBottomTabNavigator();
const testFirebase = async () => {
  try {
    await addDoc(collection(db, "testCollection"), {
      message: "Hello from HabitFlow 🚀",
      timestamp: new Date()
    });
    console.log("✅ Data sent to Firebase!");
  } catch (error) {
    console.log("❌ Firebase error:", error);
  }
};
const ONBOARDING_KEY = 'hf_onboarded';

const TABS = {
  Home:   { icon:'⊞',  label:'Home'   },
  Focus:  { icon:'⏱',  label:'Focus'  },
  Study:  { icon:'📚', label:'Study'  },
  Review: { icon:'✨', label:'Review' },
  Coach:  { icon:'🤖', label:'Coach'  },
};

const wrap = (C) => (props) => <ErrorBoundary><C {...props}/></ErrorBoundary>;
const SafeHome   = wrap(HomeScreen);
const SafeFocus  = wrap(FocusScreen);
const SafeStudy  = wrap(StudyScreen);
const SafeReview = wrap(WeeklyReviewScreen);
const SafeCoach  = wrap(AICoachScreen);

export default function App() {
  const [loading, setLoading]     = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(v => setOnboarded(v === 'true'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{flex:1,backgroundColor:Colors.bg,alignItems:'center',justifyContent:'center',gap:16}}>
        <Text style={{fontSize:32,fontWeight:'900',color:Colors.primary,letterSpacing:-1}}>HabitFlow</Text>
        <ActivityIndicator color={Colors.primary} size="large"/>
      </View>
    );
  }

  if (!onboarded) {
    return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <OnboardingScreen onComplete={() => setOnboarded(true)}/>
        </ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarShowLabel: false,
            tabBarIcon: ({ focused }) => {
              const tab = TABS[route.name];
              return (
                <View style={[styles.tabItem, focused && styles.tabItemActive]}>
                  <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{tab?.icon}</Text>
                  <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tab?.label}</Text>
                </View>
              );
            },
          })}
        >
          <Tab.Screen name="Home"   component={SafeHome}/>
          <Tab.Screen name="Focus"  component={SafeFocus}/>
          <Tab.Screen name="Study"  component={SafeStudy}/>
          <Tab.Screen name="Review" component={SafeReview}/>
          <Tab.Screen name="Coach"  component={SafeCoach}/>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar:        {position:'absolute',height:72,borderTopWidth:0,backgroundColor:'rgba(10,10,18,0.97)',elevation:0,shadowColor:'#000',shadowOffset:{width:0,height:-4},shadowOpacity:0.4,shadowRadius:16},
  tabItem:       {alignItems:'center',justifyContent:'center',paddingVertical:6,paddingHorizontal:8,borderRadius:Radius.lg,gap:2,minWidth:52},
  tabItemActive: {backgroundColor:'rgba(0,229,204,0.1)'},
  tabIcon:       {fontSize:20,color:'rgba(255,255,255,0.25)'},
  tabIconActive: {color:Colors.primary},
  tabLabel:      {fontSize:9,fontWeight:'600',color:'rgba(255,255,255,0.25)',letterSpacing:0.3},
  tabLabelActive:{color:Colors.primary,fontWeight:'700'},
});
