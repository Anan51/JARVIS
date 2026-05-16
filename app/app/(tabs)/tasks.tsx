import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { TaskCard } from '../../components/TaskCard';
import { useTasks } from '../../hooks/useTasks';
import { sendSMS } from '../../services/sms';
import { theme } from '../../constants/theme';
import { Task } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function TasksScreen() {
  const { tasks, loading, error, refresh, removeTask, completeTask } = useTasks();

  const handleSendMessage = useCallback(async (task: Task) => {
    if (!task.recipient || !task.messageBody) {
      Alert.alert('Error', 'Missing recipient or message body');
      return;
    }
    const result = await sendSMS({
      recipientName: task.recipient,
      messageBody: task.messageBody,
      phoneNumber: task.recipientPhone,
    });
    Alert.alert(result.success ? 'Success' : 'Info', result.message);
    if (result.success) {
      await completeTask(task.taskId);
    }
  }, [completeTask]);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await removeTask(taskId);
    } catch {
      Alert.alert('Error', 'Failed to delete task');
    }
  }, [removeTask]);

  const handleComplete = useCallback(async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch {
      Alert.alert('Error', 'Failed to complete task');
    }
  }, [completeTask]);

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  if (error && tasks.length === 0) {
    return (
      <View style={s.emptyContainer}>
        <Ionicons name="warning-outline" size={48} color={theme.colors.danger} />
        <Text style={s.emptyTitle}>Unable to load tasks</Text>
        <Text style={s.emptySubtitle}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={[...activeTasks, ...completedTasks]}
        keyExtractor={(item) => item.taskId}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onSendMessage={handleSendMessage}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={s.list}
        ListHeaderComponent={
          tasks.length > 0 ? (
            <View style={s.header}>
              <Text style={s.headerTitle}>{activeTasks.length} active</Text>
              {completedTasks.length > 0 && (
                <Text style={s.headerSubtitle}>{completedTasks.length} completed</Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyContainer}>
              <Ionicons name="clipboard-outline" size={64} color={theme.colors.textMuted} />
              <Text style={s.emptyTitle}>No tasks yet</Text>
              <Text style={s.emptySubtitle}>
                Record a voice memo to create tasks, reminders, and alarms
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  headerSubtitle: { fontSize: 14, color: theme.colors.textMuted },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: theme.colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
});
