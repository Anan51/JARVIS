import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert, Modal, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TaskCard } from '../../components/TaskCard';
import { useTasks } from '../../hooks/useTasks';
import { sendSMS } from '../../services/sms';
import { theme } from '../../constants/theme';
import { Task } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function TasksScreen() {
  const { tasks, loading, error, refresh, removeTask, completeTask } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return undefined;
    }, [refresh])
  );

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

  const handleDeleteClick = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    if (task) {
      setTaskToDelete(task);
      setDeleteModalVisible(true);
    }
  }, [tasks]);

  const confirmDelete = useCallback(async () => {
    if (taskToDelete) {
      setDeleteModalVisible(false);
      try {
        await removeTask(taskToDelete.taskId);
      } catch {
        Alert.alert('Error', 'Failed to delete task');
      }
    }
  }, [taskToDelete, removeTask]);

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
        data={activeTasks}
        keyExtractor={(item) => item.taskId}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={handleComplete}
            onDelete={handleDeleteClick}
            onSendMessage={handleSendMessage}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={s.list}
        ListHeaderComponent={
          activeTasks.length > 0 ? (
            <View style={s.header}>
              <Text style={s.headerTitle}>{activeTasks.length} active</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          completedTasks.length > 0 ? (
            <View style={s.completedSection}>
              <TouchableOpacity
                onPress={() => setShowCompleted(!showCompleted)}
                style={s.completedHeader}
                activeOpacity={0.7}
              >
                <Text style={s.completedTitle}>Completed Tasks ({completedTasks.length})</Text>
                <Ionicons name={showCompleted ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
              {showCompleted && completedTasks.map(item => (
                <TaskCard
                  key={item.taskId}
                  task={item}
                  onComplete={handleComplete}
                  onDelete={handleDeleteClick}
                  onSendMessage={handleSendMessage}
                />
              ))}
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

      {/* Delete Modal */}
      {deleteModalVisible && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Delete Task</Text>
              <Text style={s.modalText}>Are you sure you want to delete "{taskToDelete?.title}"?</Text>
              <View style={s.modalButtons}>
                <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={[s.modalButton, s.modalButtonCancel]}>
                  <Text style={s.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDelete} style={[s.modalButton, s.modalButtonConfirm]}>
                  <Text style={s.modalButtonTextConfirm}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  completedSection: { marginTop: 16 },
  completedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, marginBottom: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  completedTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary },
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
