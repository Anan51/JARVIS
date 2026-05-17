import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { logout, getUser } from '../../services/auth';
import { useNotifications } from '../../hooks/useNotifications';
import { useContacts } from '../../hooks/useContacts';
import { theme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [user, setUser] = useState<any>(null);
  const { expoPushToken, requestPermission } = useNotifications();
  const { hasPermission: contactsPermission, requestPermission: requestContacts } = useContacts();
  const [notificationsEnabled, setNotificationsEnabled] = useState(!!expoPushToken);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  async function handleNotificationToggle(value: boolean) {
    if (value) {
      await requestPermission();
      setNotificationsEnabled(!!expoPushToken);
    }
  }


  useEffect(() => {
    getUser().then(setUser).catch(() => { });
    setNotificationsEnabled(!!expoPushToken);
  }, [expoPushToken]);

  function handleLogout() {
    setLogoutModalVisible(true);
  }

  async function confirmLogout() {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  }

  async function handleContactsPermission() {
    const granted = await requestContacts();
    if (!granted) {
      Alert.alert('Permission Denied', 'Go to Settings to enable contacts access for JARVIS.');
    }
  }

  return (
    <ScrollView style={[s.container, { paddingTop: insets.top + 10 }]} contentContainerStyle={s.content}>
      {/* User Card */}
      <View style={[s.card, s.userCard]}>
        <LinearGradient colors={[theme.colors.primaryStart, theme.colors.primaryEnd]} style={s.avatar}>
          <Text style={s.avatarText}>{user?.attributes?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'J'}</Text>
        </LinearGradient>
        <View style={s.userInfo}>
          <Text style={s.userName}>{user?.attributes?.name || user?.username || 'Loading...'}</Text>
          <Text style={s.userEmail}>{user?.attributes?.email || user?.signInDetails?.loginId || ''}</Text>
        </View>
      </View>

      {/* Permissions Section */}
      <Text style={s.sectionTitle}>Permissions</Text>
      <View style={s.card}>
        <SettingRow
          icon="notifications"
          title="Push Notifications"
          subtitle={expoPushToken ? 'Registered' : 'Not registered'}
          trailing={<Switch value={notificationsEnabled} onValueChange={handleNotificationToggle} trackColor={{ true: theme.colors.primary }} thumbColor="#fff" />}
        />

        {/* <View style={s.divider} />
        <SettingRow
          icon="people"
          title="Contacts Access"
          subtitle={contactsPermission ? 'Granted' : 'Not granted'}
          onPress={contactsPermission ? undefined : handleContactsPermission}
          trailing={
            contactsPermission ? (
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
            ) : (
              <TouchableOpacity onPress={handleContactsPermission} style={s.grantBtn}>
                <Text style={s.grantText}>Grant</Text>
              </TouchableOpacity>
            )
          }
        /> */}
      </View>



      {/* Sign Out */}
      <TouchableOpacity onPress={handleLogout} style={s.logoutButton} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Logout Modal */}
      {logoutModalVisible && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Sign Out</Text>
              <Text style={s.modalText}>Are you sure you want to sign out?</Text>
              <View style={s.modalButtons}>
                <TouchableOpacity onPress={() => setLogoutModalVisible(false)} style={[s.modalButton, s.modalButtonCancel]}>
                  <Text style={s.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmLogout} style={[s.modalButton, s.modalButtonConfirm]}>
                  <Text style={s.modalButtonTextConfirm}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

function SettingRow({ icon, title, subtitle, trailing, onPress }: {
  icon: string; title: string; subtitle: string; trailing?: React.ReactNode; onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} style={s.row} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={22} color={theme.colors.primary} />
      <View style={s.rowContent}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{subtitle}</Text>
      </View>
      {trailing}
    </Wrapper>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 48 },
  card: { backgroundColor: theme.colors.surfaceElevated, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border },
  userCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary },
  userEmail: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.textPrimary },
  rowSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
  grantBtn: { backgroundColor: theme.colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  grantText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: theme.colors.dangerMuted, borderRadius: 12, marginTop: 8 },
  logoutText: { color: theme.colors.danger, fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.surfaceElevated, borderRadius: 16, padding: 24, width: '80%', maxWidth: 340, borderWidth: 1, borderColor: theme.colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  modalText: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalButtonCancel: { backgroundColor: theme.colors.surface },
  modalButtonConfirm: { backgroundColor: theme.colors.danger },
  modalButtonTextCancel: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600' },
  modalButtonTextConfirm: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
