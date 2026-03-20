// src/components/ProgressRing.jsx
// Pure View-based ring — no SVG library needed
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';

export default function ProgressRing({ size = 100, progress = 0, color = Colors.primary, children }) {
  const pct = Math.round(progress * 100);
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, borderColor: Colors.border }]}>
      <View style={[styles.fill, {
        width: size, height: size, borderRadius: size / 2,
        borderColor: color,
        borderTopColor: progress > 0.75 ? color : Colors.border,
        borderRightColor: progress > 0.25 ? color : Colors.border,
        borderBottomColor: progress > 0.50 ? color : Colors.border,
        borderLeftColor: progress > 0.00 ? color : Colors.border,
      }]} />
      <View style={styles.inner}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', borderWidth: 6 },
  fill:      { position: 'absolute', borderWidth: 6 },
  inner:     { alignItems: 'center', justifyContent: 'center' },
});
