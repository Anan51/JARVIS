import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { confirmRegistration, resendConfirmation, login } from '../../services/auth';
import { theme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { email, password } = useLocalSearchParams<{ email: string; password?: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleConfirm() {
    setErrorMessage('');
    if (!code || code.length < 6) { setErrorMessage('ENTER 6-DIGIT VERIFICATION CODE'); return; }
    setLoading(true);
    try {
      await confirmRegistration(email!, code);
      if (password) {
        await login(email!, password);
        if (Platform.OS === 'web') { window.location.replace('/'); }
        else { router.replace('/(tabs)'); }
      } else {
        if (Platform.OS === 'web') { window.alert('Account verified! Please sign in.'); }
        else { Alert.alert('Success', 'Account verified! Please sign in.'); }
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'INVALID CODE');
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setErrorMessage('');
    try {
      await resendConfirmation(email!);
      if (Platform.OS === 'web') { window.alert('Verification code resent'); }
      else { Alert.alert('Success', 'Verification code resent'); }
    } catch (err: any) { setErrorMessage(err.message || 'COULD NOT RESEND'); }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.content}>
          <View style={s.iconWrap}>
            <View style={s.iconCircle}>
              <Ionicons name="mail-open-outline" size={36} color={theme.colors.primary} />
            </View>
          </View>
          <Text style={s.title}>VERIFY EMAIL</Text>
          <Text style={s.sub}>CODE SENT TO {email}</Text>

          <View style={s.formBox}>
            <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />
            <View style={s.hdrRow}>
              <View style={s.hdrLine} /><Text style={s.hdrText}>VERIFICATION</Text><View style={s.hdrLine} />
            </View>

            {errorMessage ? (
              <View style={s.errBox}>
                <Ionicons name="warning" size={14} color="#ff4444" />
                <Text style={s.errText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={s.codeWrap}>
              <TextInput style={s.codeInput} placeholder="000000" placeholderTextColor="rgba(0,242,254,0.2)"
                value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} textAlign="center" />
            </View>

            <TouchableOpacity onPress={handleConfirm} disabled={loading} activeOpacity={0.7}>
              <View style={s.btn}>
                <Text style={s.btnText}>{loading ? '[ VERIFYING... ]' : '[ VERIFY ]'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResend} style={s.link}>
              <Text style={s.linkText}>NO CODE? <Text style={s.linkBold}>RESEND</Text></Text>
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

  iconWrap: { alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,20,30,0.6)', borderWidth: 2, borderColor: 'rgba(0,242,254,0.4)', shadowColor: '#00f2fe', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
  title: { fontFamily: 'Courier', fontSize: 22, fontWeight: '700', color: 'rgba(0,242,254,0.85)', letterSpacing: 6, textAlign: 'center', marginBottom: 4 },
  sub: { fontFamily: 'Courier', fontSize: 10, letterSpacing: 2, color: 'rgba(0,242,254,0.35)', textAlign: 'center', marginBottom: 24 },

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

  codeWrap: { alignItems: 'center' },
  codeInput: { fontFamily: 'Courier', fontSize: 32, fontWeight: '700', color: 'rgba(0,242,254,0.9)', backgroundColor: 'rgba(0,20,30,0.5)', borderWidth: 1, borderColor: 'rgba(0,242,254,0.15)', paddingHorizontal: 24, paddingVertical: 14, letterSpacing: 12, width: '100%', textAlign: 'center' },

  btn: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,242,254,0.3)', backgroundColor: 'rgba(0,242,254,0.08)' },
  btnText: { fontFamily: 'Courier', color: 'rgba(0,242,254,0.9)', fontSize: 13, fontWeight: '700', letterSpacing: 3 },
  link: { alignItems: 'center' },
  linkText: { fontFamily: 'Courier', color: 'rgba(0,242,254,0.3)', fontSize: 11, letterSpacing: 1 },
  linkBold: { color: 'rgba(0,242,254,0.7)', fontWeight: '700' },

  bottomBar: { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,242,254,0.08)' },
  bottomText: { fontFamily: 'Courier', fontSize: 9, letterSpacing: 3, color: 'rgba(0,242,254,0.2)' },
});
