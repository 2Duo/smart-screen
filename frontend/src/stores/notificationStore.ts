import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random()}`
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification,
    }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }))
    
    // Auto-remove after duration (unless persistent)
    if (!newNotification.persistent) {
      setTimeout(() => {
        get().removeNotification(id)
      }, newNotification.duration)
    }
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }))
  },
  
  clearAllNotifications: () => {
    set({ notifications: [] })
  },
}))

// Helper functions for common notification types
export const showSuccessNotification = (title: string, message: string) => {
  useNotificationStore.getState().addNotification({
    type: 'success',
    title,
    message,
  })
}

export const showErrorNotification = (title: string, message: string, persistent = false) => {
  useNotificationStore.getState().addNotification({
    type: 'error',
    title,
    message,
    persistent,
    duration: persistent ? undefined : 7000, // Longer duration for errors
  })
}

export const showWarningNotification = (title: string, message: string) => {
  useNotificationStore.getState().addNotification({
    type: 'warning',
    title,
    message,
    duration: 6000,
  })
}

export const showInfoNotification = (title: string, message: string) => {
  useNotificationStore.getState().addNotification({
    type: 'info',
    title,
    message,
  })
}