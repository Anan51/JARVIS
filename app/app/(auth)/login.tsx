import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { login } from '../../services/auth';
import { theme } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin() {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.isSignedIn) {
        if (Platform.OS === 'web') {
          window.location.replace('/');
        } else {
          router.replace('/(tabs)');
        }
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        router.push({ pathname: '/(auth)/confirm', params: { email: email.trim(), password } });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[theme.colors.background, '#0f1629', theme.colors.background]} style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        {/* Logo */}
        <View style={s.logoContainer}>
          <LinearGradient colors={[theme.colors.primaryStart, theme.colors.primaryEnd]} style={s.logoCircle}>
            <Ionicons name="mic" size={40} color="#fff" />
          </LinearGradient>
          <Text style={s.appName}>JARVIS</Text>
          <Text style={s.subtitle}>Your AI Voice Assistant</Text>
        </View>

        {errorMessage ? <Text style={s.errorText}>{errorMessage}</Text> : null}

        {/* Form */}
        <View style={s.form}>
          <View style={s.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={[theme.colors.primaryStart, theme.colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.button}>
              <Text style={s.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={s.linkButton}>
            <Text style={s.linkText}>Don't have an account? <Text style={s.linkBold}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 36, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  errorText: { color: theme.colors.danger, marginBottom: 16, textAlign: 'center', fontSize: 14 },
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
