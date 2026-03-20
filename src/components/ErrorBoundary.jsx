// src/components/ErrorBoundary.jsx
// Catches crashes in individual screens — shows friendly error instead of white screen

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info);
    // In production: send to Sentry / Crashlytics
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.emoji}>⚠️</Text>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.subtitle}>
            This screen ran into an error.{'\n'}Your data is safe.
          </Text>
          <TouchableOpacity
            style={s.btn}
            onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={s.btnTxt}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:Colors.bg, alignItems:'center', justifyContent:'center', padding:Spacing.xl },
  emoji:     { fontSize:48, marginBottom:Spacing.lg },
  title:     { fontSize:20, fontWeight:'800', color:Colors.textPrimary, marginBottom:Spacing.sm },
  subtitle:  { ...Typography.body, textAlign:'center', color:Colors.textSecondary, marginBottom:Spacing.xl, lineHeight:24 },
  btn:       { backgroundColor:Colors.primary, borderRadius:Radius.full, paddingHorizontal:Spacing.xl, paddingVertical:Spacing.md },
  btnTxt:    { color:Colors.bg, fontWeight:'800', fontSize:15 },
});
