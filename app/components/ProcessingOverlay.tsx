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
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={s.title}>Processing Actions</Text>
          <Text style={s.sub}>{currentAction}</Text>
          <View style={s.list}>
            {intents.map((intent, i) => (
              <View key={i} style={s.row}>
                <Ionicons
                  name={i < currentIndex ? 'checkmark-circle' : i === currentIndex ? 'ellipse' : 'ellipse-outline'}
                  size={20}
                  color={i < currentIndex ? theme.colors.success : i === currentIndex ? theme.colors.primary : theme.colors.textMuted}
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 32, width: '100%', maxWidth: 360, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  title: { fontSize: 20, fontWeight: '600', color: theme.colors.textPrimary, marginTop: 16, marginBottom: 4 },
  sub: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24, textAlign: 'center' },
  list: { width: '100%', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 16, color: theme.colors.textMuted, flex: 1 },
  done: { color: theme.colors.success, textDecorationLine: 'line-through' },
  active: { color: theme.colors.textPrimary, fontWeight: '600' },
});
