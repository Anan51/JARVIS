// ==========================================
// JARVIS — Circular Waveform Visualizer
// Animated bars radiating outward from the record button
// ==========================================

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface WaveformVisualizerProps {
  metering: number; // -160 to 0 dB
  isActive: boolean;
  size?: number;      // outer diameter of the ring
  barCount?: number;
}

// How many dB above silence before we start visually reacting.
// Higher = less sensitive (requires louder sound to animate).
const SENSITIVITY_THRESHOLD = -45; // dB — only react above this level
const SILENCE_DB = -160;

function normalize(metering: number): number {
  // Map [SILENCE_DB, SENSITIVITY_THRESHOLD] → [0, 1], clamp
  const clamped = Math.max(SILENCE_DB, Math.min(SENSITIVITY_THRESHOLD, metering));
  return (clamped - SILENCE_DB) / (SENSITIVITY_THRESHOLD - SILENCE_DB);
}

export function WaveformVisualizer({
  metering,
  isActive,
  size = 200,
  barCount = 36,
}: WaveformVisualizerProps) {
  const barAnimations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0))
  ).current;

  // Idle pulse animation — subtle breathing effect when not recording
  const idlePulse = useRef(new Animated.Value(0)).current;
  const idleAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      // Stop any active animations and fade to resting
      idleAnim.current?.stop();
      barAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }).start();
      });

      // Gentle idle pulse
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
      // Each bar gets a slightly randomized height for natural look
      const jitter = (Math.random() * 0.25) - 0.125;
      // Vary slightly by angle position for organic feel
      const angleVariance = Math.sin((index / barCount) * Math.PI * 2) * 0.1;
      const target = Math.max(0, Math.min(1, level + jitter + angleVariance));

      Animated.spring(anim, {
        toValue: target,
        friction: 8,    // higher = less bouncy
        tension: 60,
        useNativeDriver: false,
      }).start();
    });
  }, [metering, isActive, barAnimations, idlePulse, barCount]);

  const CENTER = size / 2;
  const BUTTON_RADIUS = 52;      // slightly larger than the 44px button radius
  const BAR_MIN_LENGTH = 4;
  const BAR_MAX_LENGTH = 22;
  const BAR_WIDTH = 3;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {barAnimations.map((anim, index) => {
        const angle = (index / barCount) * 2 * Math.PI - Math.PI / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Bar base starts at the edge of the button radius
        const x = CENTER + cos * BUTTON_RADIUS - BAR_WIDTH / 2;
        const y = CENTER + sin * BUTTON_RADIUS;

        const barLength = isActive
          ? anim.interpolate({
              inputRange: [0, 1],
              outputRange: [BAR_MIN_LENGTH, BAR_MAX_LENGTH],
            })
          : idlePulse.interpolate({
              inputRange: [0, 1],
              outputRange: [BAR_MIN_LENGTH, BAR_MIN_LENGTH + 3],
            });

        const opacity = isActive
          ? anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] })
          : 0.25;

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
                // Rotate bar to point outward from center
                transform: [{ rotate: `${(angle * 180) / Math.PI + 90}deg` }],
                transformOrigin: 'top center',
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    borderRadius: 2,
  },
});
