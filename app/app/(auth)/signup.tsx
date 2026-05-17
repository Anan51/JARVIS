import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { register } from '../../services/auth';
import { theme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSignup() {
    setErrorMessage('');
    if (!email || !password) { setErrorMessage('ALL REQUIRED FIELDS MUST BE FILLED'); return; }
    if (password.length < 8) { setErrorMessage('PASSWORD: MIN 8 CHARACTERS'); return; }
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim() || undefined);
      if (Platform.OS === 'web') { window.alert('Account created! Please sign in.'); }
      else { Alert.alert('Success', 'Account created! Please sign in.'); }
      router.replace('/(auth)/login');
    } catch (err: any) {
      setErrorMessage(err.message || 'REGISTRATION FAILED');
    } finally { setLoading(false); }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.content}>
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color="rgba(0,242,254,0.6)" />
            <Text style={s.backText}>BACK</Text>
          </TouchableOpacity>

          <Text style={s.title}>CREATE ACCOUNT</Text>
          <Text style={s.sub}>REGISTER NEW OPERATOR</Text>

          <View style={s.formBox}>
            <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />
            <View style={s.hdrRow}>
              <View style={s.hdrLine} /><Text style={s.hdrText}>REGISTRATION</Text><View style={s.hdrLine} />
            </View>

            {errorMessage ? (
              <View style={s.errBox}>
                <Ionicons name="warning" size={14} color="#ff4444" />
                <Text style={s.errText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={s.fieldGroup}>
              <View style={s.labelRow}>
                <Ionicons name="person-outline" size={14} color="rgba(0,242,254,0.4)" />
                <Text style={s.label}>CALLSIGN (OPTIONAL)</Text>
              </View>
              <TextInput style={s.input} placeholder="Operator Name" placeholderTextColor="rgba(0,242,254,0.2)"
                value={name} onChangeText={setName} autoCapitalize="words" />
            </View>

            <View style={s.fieldGroup}>
              <View style={s.labelRow}>
                <Ionicons name="mail-outline" size={14} color="rgba(0,242,254,0.4)" />
                <Text style={s.label}>EMAIL</Text>
              </View>
              <TextInput style={s.input} placeholder="user@domain.com" placeholderTextColor="rgba(0,242,254,0.2)"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            <View style={s.fieldGroup}>
              <View style={s.labelRow}>
                <Ionicons name="lock-closed-outline" size={14} color="rgba(0,242,254,0.4)" />
                <Text style={s.label}>PASSWORD (MIN 8 CHARS)</Text>
              </View>
              <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="rgba(0,242,254,0.2)"
                value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <TouchableOpacity onPress={handleSignup} disabled={loading} activeOpacity={0.7}>
              <View style={s.btn}>
                <Text style={s.btnText}>{loading ? '[ REGISTERING... ]' : '[ CREATE ACCOUNT ]'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={s.link}>
              <Text style={s.linkText}>HAVE AN ACCOUNT? <Text style={s.linkBold}>SIGN IN</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <View style={s.bottomBar}><Text style={s.bottomText}>SECURE CHANNEL ● ENCRYPTED</Text></View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1117' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  sysText: { fontFamily: 'Courier', fontSize: 11, letterSpacing: 1.5, color: 'rgba(0,242,254,0.4)' },
  onText: { color: 'rgba(0,242,254,0.8)', fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,242,254,0.15)' },
  dotOn: { backgroundColor: 'rgba(0,242,254,0.7)' },
  divider: { height: 1, backgroundColor: 'rgba(0,242,254,0.12)' },
  inner: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 32, maxWidth: 420, width: '100%', alignSelf: 'center' },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backText: { fontFamily: 'Courier', fontSize: 11, letterSpacing: 2, color: 'rgba(0,242,254,0.6)' },
  title: { fontFamily: 'Courier', fontSize: 22, fontWeight: '700', color: 'rgba(0,242,254,0.85)', letterSpacing: 6, marginBottom: 4 },
  sub: { fontFamily: 'Courier', fontSize: 10, letterSpacing: 3, color: 'rgba(0,242,254,0.35)', marginBottom: 24 },

  formBox: { borderWidth: 1, borderColor: 'rgba(0,242,254,0.1)', backgroundColor: 'rgba(0,10,20,0.4)', padding: 24, gap: 16, position: 'relative' },
  corner: { position: 'absolute', width: 16, height: 16, borderColor: 'rgba(0,242,254,0.5)' },
  cTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  cBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  cBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  hdrRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hdrLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,242,254,0.15)' },
  hdrText: { fontFamily: 'Courier', fontSize: 10, letterSpacing: 4, color: 'rgba(0,242,254,0.4)' },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(255,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(255,68,68,0.2)' },
  errText: { fontFamily: 'Courier', color: '#ff4444', fontSize: 11, letterSpacing: 1 },

  fieldGroup: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: 'Courier', fontSize: 9, letterSpacing: 2, color: 'rgba(0,242,254,0.4)' },
  input: { fontFamily: 'Courier', fontSize: 15, color: 'rgba(0,242,254,0.9)', backgroundColor: 'rgba(0,20,30,0.5)', borderWidth: 1, borderColor: 'rgba(0,242,254,0.15)', paddingHorizontal: 14, paddingVertical: 12, letterSpacing: 1 },

  btn: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,242,254,0.3)', backgroundColor: 'rgba(0,242,254,0.08)' },
  btnText: { fontFamily: 'Courier', color: 'rgba(0,242,254,0.9)', fontSize: 13, fontWeight: '700', letterSpacing: 3 },
  link: { alignItems: 'center' },
  linkText: { fontFamily: 'Courier', color: 'rgba(0,242,254,0.3)', fontSize: 11, letterSpacing: 1 },
  linkBold: { color: 'rgba(0,242,254,0.7)', fontWeight: '700' },

  bottomBar: { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,242,254,0.08)' },
  bottomText: { fontFamily: 'Courier', fontSize: 9, letterSpacing: 3, color: 'rgba(0,242,254,0.2)' },
});
