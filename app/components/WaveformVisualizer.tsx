// ==========================================
// JARVIS — Waveform Visualizer Component
// Animated audio level bars for recording feedback
// ==========================================

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface WaveformVisualizerProps {
  metering: number; // -160 to 0
  isActive: boolean;
  barCount?: number;
}

export function WaveformVisualizer({
  metering,
  isActive,
  barCount = 24,
}: WaveformVisualizerProps) {
  const barAnimations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    if (!isActive) {
      // Reset all bars
      barAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    // Normalize metering from [-160, 0] to [0, 1]
    const normalized = Math.max(0, Math.min(1, (metering + 160) / 160));

    barAnimations.forEach((anim, index) => {
      // Create varied heights based on position and metering
      const centerDistance = Math.abs(index - barCount / 2) / (barCount / 2);
      const variance = Math.random() * 0.3;
      const height = Math.max(
        0.1,
        normalized * (1 - centerDistance * 0.5) + variance * normalized
      );

      Animated.spring(anim, {
        toValue: height,
        friction: 5,
        tension: 40,
        useNativeDriver: false,
      }).start();
    });
  }, [metering, isActive, barAnimations, barCount]);

  return (
    <View style={styles.container}>
      {barAnimations.map((anim, index) => {
        const centerDistance = Math.abs(index - barCount / 2) / (barCount / 2);
        const opacity = 1 - centerDistance * 0.4;

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 60],
                }),
                opacity: isActive ? opacity : 0.3,
                backgroundColor: isActive
                  ? theme.colors.primary
                  : theme.colors.textMuted,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    gap: 3,
    paddingHorizontal: 16,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
});
