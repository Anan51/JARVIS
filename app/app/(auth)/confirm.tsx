import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { confirmRegistration, resendConfirmation } from '../../services/auth';
import { theme } from '../../constants/theme';

export default function ConfirmScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }
    setLoading(true);
    try {
      await confirmRegistration(email!, code);
      Alert.alert('Success', 'Account verified! Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendConfirmation(email!);
      Alert.alert('Success', 'Verification code resent to your email');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not resend code');
    }
  }

  return (
    <LinearGradient colors={[theme.colors.background, '#0f1629', theme.colors.background]} style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.iconWrap}>
          <Ionicons name="mail-open-outline" size={48} color={theme.colors.primary} />
        </View>
        <Text style={s.title}>Verify Your Email</Text>
        <Text style={s.subtitle}>We sent a code to {email}</Text>

        <View style={s.inputContainer}>
          <TextInput style={s.input} placeholder="000000" placeholderTextColor={theme.colors.textMuted} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} textAlign="center" />
        </View>

        <TouchableOpacity onPress={handleConfirm} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={[theme.colors.primaryStart, theme.colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.button}>
            <Text style={s.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} style={s.linkButton}>
          <Text style={s.linkText}>Didn't receive a code? <Text style={s.linkBold}>Resend</Text></Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  inputContainer: { backgroundColor: theme.colors.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, height: 56, justifyContent: 'center', marginBottom: 16 },
  input: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: '600', letterSpacing: 8 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  linkText: { color: theme.colors.textSecondary, fontSize: 14 },
  linkBold: { color: theme.colors.primary, fontWeight: '600' },
});
