import { create } from 'zustand'

export type Route = '/login' | '/dashboard' | '/inventory' | '/alerts' | '/messages' | '/settings' | '/item'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  createdAt: Date
}

export interface Modal {
  id: string
  type: 'confirm' | 'form' | 'info'
  title: string
  content?: React.ReactNode
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}

interface UIState {
  // Navigation
  currentRoute: Route
  previousRoute: Route | null
  
  // Modals
  modals: Modal[]
  
  // Notifications
  notifications: Notification[]
  
  // Loading states
  globalLoading: boolean
  
  // Sidebar
  sidebarCollapsed: boolean
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Actions
  navigate: (route: Route) => void
  goBack: () => void
  
  // Modal actions
  openModal: (modal: Omit<Modal, 'id'>) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // UI actions
  setGlobalLoading: (loading: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  currentRoute: '/dashboard',
  previousRoute: null,
  modals: [],
  notifications: [],
  globalLoading: false,
  sidebarCollapsed: false,
  theme: 'light',

  // Navigation actions
  navigate: (route) => {
    const currentRoute = get().currentRoute
    set({ 
      previousRoute: currentRoute,
      currentRoute: route 
    })
  },

  goBack: () => {
    const { previousRoute } = get()
    if (previousRoute) {
      set(state => ({
        currentRoute: previousRoute,
        previousRoute: state.currentRoute
      }))
    }
  },

  // Modal actions
  openModal: (modalData) => {
    const id = generateId()
    const modal: Modal = { ...modalData, id }
    set(state => ({ modals: [...state.modals, modal] }))
    return id
  },

  closeModal: (id) => {
    set(state => ({
      modals: state.modals.filter(modal => modal.id !== id)
    }))
  },

  closeAllModals: () => {
    set({ modals: [] })
  },

  // Notification actions
  addNotification: (notificationData) => {
    const id = generateId()
    const notification: Notification = {
      ...notificationData,
      id,
      createdAt: new Date(),
      duration: notificationData.duration ?? 5000
    }
    
    set(state => ({ 
      notifications: [...state.notifications, notification] 
    }))

    // Auto-remove notification after duration (unless persistent)
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, notification.duration)
    }

    return id
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(notification => notification.id !== id)
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  // UI actions
  setGlobalLoading: (loading) => {
    set({ globalLoading: loading })
  },

  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed })
  },

  setTheme: (theme) => {
    set({ theme })
    
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }
}))

// Helper hooks for specific UI functionality
export const useNotifications = () => {
  const notifications = useUIStore(state => state.notifications)
  const addNotification = useUIStore(state => state.addNotification)
  const removeNotification = useUIStore(state => state.removeNotification)
  const clearNotifications = useUIStore(state => state.clearNotifications)
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    // Convenience methods
    success: (title: string, message?: string) => 
      addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      addNotification({ type: 'error', title, message, persistent: true }),
    warning: (title: string, message?: string) => 
      addNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) => 
      addNotification({ type: 'info', title, message })
  }
}

export const useModals = () => {
  const modals = useUIStore(state => state.modals)
  const openModal = useUIStore(state => state.openModal)
  const closeModal = useUIStore(state => state.closeModal)
  const closeAllModals = useUIStore(state => state.closeAllModals)
  
  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    // Convenience methods
    confirm: (title: string, message?: string, onConfirm?: () => void) => 
      openModal({
        type: 'confirm',
        title,
        content: message,
        onConfirm,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
      })
  }
}

export const useNavigation = () => {
  const currentRoute = useUIStore(state => state.currentRoute)
  const previousRoute = useUIStore(state => state.previousRoute)
  const navigate = useUIStore(state => state.navigate)
  const goBack = useUIStore(state => state.goBack)
  
  return {
    currentRoute,
    previousRoute,
    navigate,
    goBack
  }
}