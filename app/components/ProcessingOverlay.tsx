import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ParsedIntent } from '../types';

interface Props {
  visible: boolean;
  intents: ParsedIntent[];
  currentIndex: number;
  currentAction: string;
}

export function ProcessingOverlay({ visible, intents, currentIndex, currentAction }: Props) {
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Corner brackets */}
          <View style={[s.corner, s.cornerTL]} />
          <View style={[s.corner, s.cornerTR]} />
          <View style={[s.corner, s.cornerBL]} />
          <View style={[s.corner, s.cornerBR]} />

          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={s.title}>PROCESSING ACTIONS</Text>
          <Text style={s.sub}>{currentAction}</Text>
          <View style={s.list}>
            {intents.map((intent, i) => (
              <View key={i} style={s.row}>
                <Ionicons
                  name={i < currentIndex ? 'checkmark-circle' : i === currentIndex ? 'ellipse' : 'ellipse-outline'}
                  size={18}
                  color={i < currentIndex ? theme.colors.success : i === currentIndex ? theme.colors.primary : 'rgba(0, 242, 254, 0.3)'}
                />
                <Text style={[s.text, i < currentIndex && s.done, i === currentIndex && s.active]}>{intent.title}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 5, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    borderRadius: 4,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  corner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: 'rgba(0, 242, 254, 0.6)',
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  title: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    color: 'rgba(0, 242, 254, 0.9)',
    marginTop: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sub: {
    fontFamily: 'Courier',
    fontSize: 11,
    letterSpacing: 1,
    color: 'rgba(0, 242, 254, 0.5)',
    marginBottom: 24,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  list: { width: '100%', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: {
    fontFamily: 'Courier',
    fontSize: 13,
    color: 'rgba(0, 242, 254, 0.3)',
    flex: 1,
    letterSpacing: 0.5,
  },
  done: {
    color: theme.colors.success,
    textDecorationLine: 'line-through',
  },
  active: {
    color: 'rgba(0, 242, 254, 0.9)',
    fontWeight: '700',
  },
});
