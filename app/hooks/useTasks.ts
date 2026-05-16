// ==========================================
// JARVIS — Tasks Hook
// Manages task state with auto-refresh
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import * as api from '../services/api';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const fetchedTasks = await api.fetchTasks();
      // Sort by creation date, newest first
      fetchedTasks.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTask = useCallback(async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  }, []);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      await api.updateTask(taskId, { status: 'completed' });
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId ? { ...t, status: 'completed' as const } : t
        )
      );
    } catch (err) {
      console.error('Error completing task:', err);
      throw err;
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { tasks, loading, error, refresh, removeTask, completeTask };
}
