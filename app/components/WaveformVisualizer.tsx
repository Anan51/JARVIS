// ==========================================
// JARVIS — Circular Waveform Visualizer
// Animated bars radiating outward around the mic button
// ==========================================

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface WaveformVisualizerProps {
  metering: number; // -160 to 0 dB
  isActive: boolean;
  size?: number;
  barCount?: number;
}

const SENSITIVITY_THRESHOLD = -45;
const SILENCE_DB = -160;

function normalize(metering: number): number {
  const clamped = Math.max(SILENCE_DB, Math.min(SENSITIVITY_THRESHOLD, metering));
  return (clamped - SILENCE_DB) / (SENSITIVITY_THRESHOLD - SILENCE_DB);
}

export function WaveformVisualizer({
  metering,
  isActive,
  size = 220,
  barCount = 48,
}: WaveformVisualizerProps) {
  const barAnimations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0))
  ).current;

  const idlePulse = useRef(new Animated.Value(0)).current;
  const idleAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      idleAnim.current?.stop();
      barAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }).start();
      });

      idleAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(idlePulse, { toValue: 1, duration: 1800, useNativeDriver: false }),
          Animated.timing(idlePulse, { toValue: 0, duration: 1800, useNativeDriver: false }),
        ])
      );
      idleAnim.current.start();
      return () => idleAnim.current?.stop();
    }

    idleAnim.current?.stop();
    const level = normalize(metering);

    barAnimations.forEach((anim, index) => {
      const jitter = (Math.random() * 0.25) - 0.125;
      const angleVariance = Math.sin((index / barCount) * Math.PI * 2) * 0.1;
      const target = Math.max(0, Math.min(1, level + jitter + angleVariance));

      Animated.spring(anim, {
        toValue: target,
        friction: 8,
        tension: 60,
        useNativeDriver: false,
      }).start();
    });
  }, [metering, isActive, barAnimations, idlePulse, barCount]);

  const CENTER = size / 2;
  const INNER_RADIUS = 56;
  const BAR_MIN = 4;
  const BAR_MAX = 24;
  const BAR_WIDTH = 2.5;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {barAnimations.map((anim, index) => {
        const angle = (index / barCount) * 2 * Math.PI - Math.PI / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const x = CENTER + cos * INNER_RADIUS - BAR_WIDTH / 2;
        const y = CENTER + sin * INNER_RADIUS;

        const barLength = isActive
          ? anim.interpolate({
              inputRange: [0, 1],
              outputRange: [BAR_MIN, BAR_MAX],
            })
          : idlePulse.interpolate({
              inputRange: [0, 1],
              outputRange: [BAR_MIN, BAR_MIN + 3],
            });

        const opacity = isActive
          ? anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })
          : 0.2;

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                width: BAR_WIDTH,
                height: barLength,
                left: x,
                top: y,
                opacity,
                transform: [{ rotate: `${(angle * 180) / Math.PI + 90}deg` }],
                transformOrigin: 'top center',
                backgroundColor: isActive
                  ? theme.colors.primary
                  : 'rgba(0, 242, 254, 0.4)',
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
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    borderRadius: 1.5,
  },
});
