import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { register } from '../../services/auth';
import { theme } from '../../constants/theme';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await register(email.trim(), password, name.trim() || undefined);
      if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        router.push({ pathname: '/(auth)/confirm', params: { email: email.trim() } });
      }
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[theme.colors.background, '#0f1629', theme.colors.background]} style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join JARVIS to get started</Text>

        <View style={s.form}>
          <View style={s.inputContainer}>
            <Ionicons name="person-outline" size={20} color={theme.colors.textMuted} style={s.inputIcon} />
            <TextInput style={s.input} placeholder="Full Name (optional)" placeholderTextColor={theme.colors.textMuted} value={name} onChangeText={setName} autoCapitalize="words" />
          </View>

          <View style={s.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} style={s.inputIcon} />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={theme.colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <View style={s.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={s.inputIcon} />
            <TextInput style={s.input} placeholder="Password (min 8 chars)" placeholderTextColor={theme.colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity onPress={handleSignup} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={[theme.colors.primaryStart, theme.colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.button}>
              <Text style={s.buttonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={s.linkButton}>
            <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  header: { position: 'absolute', top: 60, left: 0 },
  title: { fontSize: 32, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 32 },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, height: 52 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: theme.colors.textPrimary, fontSize: 16 },
  button: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  linkText: { color: theme.colors.textSecondary, fontSize: 14 },
  linkBold: { color: theme.colors.primary, fontWeight: '600' },
});
