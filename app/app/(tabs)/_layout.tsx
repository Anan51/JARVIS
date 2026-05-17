import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';


export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'rgba(0, 242, 254, 0.3)',
        tabBarStyle: {
          backgroundColor: 'rgba(13, 17, 23, 0.95)',
          borderTopColor: 'rgba(0, 242, 254, 0.15)',
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 64 + Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: {
          fontFamily: 'Courier',
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontFamily: 'Courier',
          fontWeight: '700',
          fontSize: 18,
          marginTop: insets.top / 2,
          letterSpacing: 4,
          color: theme.colors.primary,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: (e) => console.log('index tab pressed'),
        }}
        options={{
          title: 'Record',
          tabBarLabel: 'RECORD',
          tabBarIcon: ({ color, size }) => (
            <View style={color === theme.colors.primary ? styles.activeIconContainer : undefined}>
              <Ionicons name="mic" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        listeners={{
          tabPress: (e) => console.log('tasks tab pressed'),
        }}
        options={{
          title: 'Tasks',
          tabBarLabel: 'TASKS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={{
          tabPress: (e) => console.log('settings tab pressed'),
        }}
        options={{
          title: 'Settings',
          tabBarLabel: 'SETTINGS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
});
