import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { login } from '../../services/auth';
import { theme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
    ])).start();
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const ringScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  async function handleLogin() {
    setErrorMessage('');
    if (!email || !password) { setErrorMessage('ALL FIELDS REQUIRED'); return; }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.isSignedIn) { router.replace('/(tabs)'); }
      else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        router.push({ pathname: '/(auth)/confirm', params: { email: email.trim(), password } });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'AUTHENTICATION FAILED');
    } finally { setLoading(false); }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <Animated.View style={[s.content, { opacity: fadeIn }]}>
          {/* Logo */}
          <View style={s.logoWrap}>
            <Animated.View style={[s.outerRing, { opacity: glowOpacity, transform: [{ scale: ringScale }] }]} />
            <View style={s.innerRing} />
            <View style={s.micCircle}>
              <Ionicons name="mic" size={36} color={theme.colors.primary} />
            </View>
            <Text style={s.title}>J A R V I S</Text>
            <Text style={s.sub}>VOICE AUTHENTICATION SYSTEM</Text>
          </View>

          {/* Form */}
          <View style={s.formBox}>
            <View style={[s.corner, s.cTL]} /><View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} /><View style={[s.corner, s.cBR]} />
            <View style={s.hdrRow}>
              <View style={s.hdrLine} /><Text style={s.hdrText}>AUTHENTICATION</Text><View style={s.hdrLine} />
            </View>

            {errorMessage ? (
              <View style={s.errBox}>
                <Ionicons name="warning" size={14} color="#ff4444" />
                <Text style={s.errText}>{errorMessage}</Text>
              </View>
            ) : null}

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
                <Text style={s.label}>PASSWORD</Text>
              </View>
              <View style={s.pwRow}>
                <TextInput style={[s.input, s.pwInput]} placeholder="••••••••" placeholderTextColor="rgba(0,242,254,0.2)"
                  value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(0,242,254,0.4)" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.7}>
              <View style={s.btn}>
                <Text style={s.btnText}>{loading ? '[ AUTHENTICATING... ]' : '[ SIGN IN ]'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={s.link}>
              <Text style={s.linkText}>NO ACCOUNT? <Text style={s.linkBold}>REGISTER</Text></Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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

  logoWrap: { alignItems: 'center', marginBottom: 40 },
  outerRing: { position: 'absolute', top: -20, width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(0,242,254,0.3)' },
  innerRing: { position: 'absolute', top: -8, width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderColor: 'rgba(0,242,254,0.15)' },
  micCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,20,30,0.6)', borderWidth: 2, borderColor: 'rgba(0,242,254,0.4)', shadowColor: '#00f2fe', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, marginBottom: 20 },
  title: { fontFamily: 'Courier', fontSize: 30, fontWeight: '700', color: 'rgba(0,242,254,0.85)', letterSpacing: 10, textShadowColor: 'rgba(0,242,254,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  sub: { fontFamily: 'Courier', fontSize: 10, letterSpacing: 3, color: 'rgba(0,242,254,0.35)', marginTop: 8 },

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
  pwRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,20,30,0.5)', borderWidth: 1, borderColor: 'rgba(0,242,254,0.15)' },
  pwInput: { flex: 1, borderWidth: 0 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },

  btn: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,242,254,0.3)', backgroundColor: 'rgba(0,242,254,0.08)' },
  btnText: { fontFamily: 'Courier', color: 'rgba(0,242,254,0.9)', fontSize: 13, fontWeight: '700', letterSpacing: 3 },
  link: { alignItems: 'center' },
  linkText: { fontFamily: 'Courier', color: 'rgba(0,242,254,0.3)', fontSize: 11, letterSpacing: 1 },
  linkBold: { color: 'rgba(0,242,254,0.7)', fontWeight: '700' },

  bottomBar: { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,242,254,0.08)' },
  bottomText: { fontFamily: 'Courier', fontSize: 9, letterSpacing: 3, color: 'rgba(0,242,254,0.2)' },
});
