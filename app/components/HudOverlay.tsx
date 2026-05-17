// ==========================================
// JARVIS — HUD Overlay Component
// Concentric rings and corner brackets only
// ==========================================

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HudOverlayProps {
  isRecording: boolean;
}

export function HudOverlay({ isRecording }: HudOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const ringOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  const outerRingScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Concentric rings */}
      <View style={styles.ringsContainer}>
        {/* Outer ring */}
        <Animated.View
          style={[
            styles.ring,
            styles.outerRing,
            {
              opacity: ringOpacity,
              transform: [{ scale: outerRingScale }],
            },
          ]}
        />
        {/* Middle ring */}
        <Animated.View
          style={[
            styles.ring,
            styles.middleRing,
            { opacity: isRecording ? 0.5 : 0.25 },
          ]}
        />
        {/* Inner ring - main glow */}
        <View style={[styles.ring, styles.innerRing]} />

        {/* Corner brackets on inner ring */}
        <View style={[styles.bracket, styles.bracketTopLeft]} />
        <View style={[styles.bracket, styles.bracketTopRight]} />
        <View style={[styles.bracket, styles.bracketBottomLeft]} />
        <View style={[styles.bracket, styles.bracketBottomRight]} />
      </View>
    </View>
  );
}

const RING_SIZE_OUTER = Math.min(SCREEN_WIDTH * 0.82, 320);
const RING_SIZE_MIDDLE = RING_SIZE_OUTER * 0.85;
const RING_SIZE_INNER = RING_SIZE_OUTER * 0.7;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsContainer: {
    width: RING_SIZE_OUTER,
    height: RING_SIZE_OUTER,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  outerRing: {
    width: RING_SIZE_OUTER,
    height: RING_SIZE_OUTER,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    borderWidth: 1.5,
  },
  middleRing: {
    width: RING_SIZE_MIDDLE,
    height: RING_SIZE_MIDDLE,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    borderWidth: 1,
  },
  innerRing: {
    width: RING_SIZE_INNER,
    height: RING_SIZE_INNER,
    borderColor: 'rgba(0, 242, 254, 0.6)',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 20, 30, 0.4)',
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  bracket: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: 'rgba(0, 242, 254, 0.7)',
  },
  bracketTopLeft: {
    top: RING_SIZE_OUTER * 0.15 - 9,
    left: RING_SIZE_OUTER * 0.15 - 9,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  bracketTopRight: {
    top: RING_SIZE_OUTER * 0.15 - 9,
    right: RING_SIZE_OUTER * 0.15 - 9,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bracketBottomLeft: {
    bottom: RING_SIZE_OUTER * 0.15 - 9,
    left: RING_SIZE_OUTER * 0.15 - 9,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bracketBottomRight: {
    bottom: RING_SIZE_OUTER * 0.15 - 9,
    right: RING_SIZE_OUTER * 0.15 - 9,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});
