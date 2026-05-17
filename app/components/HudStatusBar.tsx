// ==========================================
// JARVIS — HUD Status Bar Component
// Top-of-screen system info bar (SYS:ONLINE, version, dots)
// ==========================================

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

interface HudStatusBarProps {
  isOnline?: boolean;
}

export function HudStatusBar({ isOnline = true }: HudStatusBarProps) {
  const insets = useSafeAreaInsets();
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(dotAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const dot4Opacity = dotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <Text style={styles.sysText}>
        SYS:<Text style={isOnline ? styles.onlineText : styles.offlineText}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </Text>
      </Text>

      <Text style={styles.versionText}>v2.4.1</Text>

      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              i < 3 && styles.dotActive,
              i === 3 && { opacity: dot4Opacity },
              i === 3 && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 242, 254, 0.15)',
  },
  sysText: {
    fontFamily: 'Courier',
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(0, 242, 254, 0.5)',
  },
  onlineText: {
    color: 'rgba(0, 242, 254, 0.9)',
    fontWeight: '700',
  },
  offlineText: {
    color: 'rgba(255, 68, 68, 0.8)',
    fontWeight: '700',
  },
  versionText: {
    fontFamily: 'Courier',
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(0, 242, 254, 0.5)',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 242, 254, 0.2)',
  },
  dotActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.8)',
  },
});
