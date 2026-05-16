// ==========================================
// JARVIS — Design System & Theme Tokens
// ==========================================

export const theme = {
  colors: {
    // Primary palette — deep metallic space
    background: '#0d1117',
    surface: '#161b22',
    surfaceElevated: '#21262d',
    surfaceGlass: 'rgba(22, 27, 34, 0.85)',

    // Accent gradient - JARVIS Cyan
    primaryStart: '#00f2fe',
    primaryEnd: '#4facfe',
    primary: '#00f2fe',
    primaryMuted: 'rgba(0, 242, 254, 0.15)',

    // Semantic colors
    success: '#10b981',
    successMuted: 'rgba(16, 185, 129, 0.15)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.15)',
    danger: '#ef4444',
    dangerMuted: 'rgba(239, 68, 68, 0.15)',
    info: '#3b82f6',
    infoMuted: 'rgba(59, 130, 246, 0.15)',

    // Text
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textInverse: '#0a0e1a',

    // Borders - Cyan tinted
    border: 'rgba(0, 242, 254, 0.2)',
    borderFocus: 'rgba(0, 242, 254, 0.6)',

    // Task type colors
    alarm: '#f97316',
    alarmMuted: 'rgba(249, 115, 22, 0.15)',
    reminder: '#8b5cf6',
    reminderMuted: 'rgba(139, 92, 246, 0.15)',
    message: '#06b6d4',
    messageMuted: 'rgba(6, 182, 212, 0.15)',
    task: '#10b981',
    taskMuted: 'rgba(16, 185, 129, 0.15)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#00f2fe',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 25,
      elevation: 12,
    },
  },
} as const;

// Task type config for consistent styling
export const taskTypeConfig: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  alarm: {
    icon: 'alarm',
    color: theme.colors.alarm,
    bgColor: theme.colors.alarmMuted,
    label: 'Alarm',
  },
  reminder: {
    icon: 'notifications',
    color: theme.colors.reminder,
    bgColor: theme.colors.reminderMuted,
    label: 'Reminder',
  },
  message: {
    icon: 'chatbubble',
    color: theme.colors.message,
    bgColor: theme.colors.messageMuted,
    label: 'Message',
  },
  task: {
    icon: 'checkmark-circle',
    color: theme.colors.task,
    bgColor: theme.colors.taskMuted,
    label: 'Task',
  },
};
