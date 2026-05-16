// ==========================================
// JARVIS — Task Card Component
// Individual task display with actions
// ==========================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';
import { theme, taskTypeConfig } from '../constants/theme';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onSendMessage?: (task: Task) => void;
}

export function TaskCard({ task, onComplete, onDelete, onSendMessage }: TaskCardProps) {
  const config = taskTypeConfig[task.type] || taskTypeConfig.task;
  const isCompleted = task.status === 'completed';
  const isNotified = task.status === 'notified' || task.status === 'sent';

  const handleDelete = () => {
    onDelete(task.taskId);
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return { text: 'Done', color: theme.colors.success, bg: theme.colors.successMuted };
    }
    if (isNotified) {
      return { text: 'Notified', color: theme.colors.info, bg: theme.colors.infoMuted };
    }
    if (task.status === 'failed') {
      return { text: 'Failed', color: theme.colors.danger, bg: theme.colors.dangerMuted };
    }
    return { text: 'Pending', color: theme.colors.warning, bg: theme.colors.warningMuted };
  };

  const statusBadge = getStatusBadge();

  const formatTime = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
  };

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      <View style={styles.header}>
        {/* Type icon + label */}
        <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon as any} size={14} color={config.color} />
          <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.statusText, { color: statusBadge.color }]}>
            {statusBadge.text}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text
        style={[styles.title, isCompleted && styles.titleCompleted]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {/* Description */}
      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      {/* Scheduled time */}
      {task.scheduledTime && (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.timeText}>{formatTime(task.scheduledTime)}</Text>
        </View>
      )}

      {/* Recipient for messages */}
      {task.type === 'message' && task.recipient && (
        <View style={styles.timeRow}>
          <Ionicons name="person-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.timeText}>To: {task.recipient}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => onComplete(task.taskId)}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={18} color={theme.colors.success} />
            <Text style={[styles.actionText, { color: theme.colors.success }]}>Done</Text>
          </TouchableOpacity>
        )}

        {task.type === 'message' && !isCompleted && onSendMessage && (
          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton]}
            onPress={() => onSendMessage(task)}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={16} color={theme.colors.message} />
            <Text style={[styles.actionText, { color: theme.colors.message }]}>Send</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  typeLabel: {
    ...theme.typography.caption,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    ...theme.typography.caption,
    fontSize: 11,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  completeButton: {
    backgroundColor: theme.colors.successMuted,
  },
  sendButton: {
    backgroundColor: theme.colors.messageMuted,
  },
  deleteButton: {
    backgroundColor: theme.colors.dangerMuted,
    marginLeft: 'auto',
  },
  actionText: {
    ...theme.typography.caption,
  },
});
