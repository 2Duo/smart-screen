import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  Layout, 
  WidgetType 
} from '../../../shared/types'

interface SocketState {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  emitLayoutUpdate: (layout: Layout) => void
  emitWidgetDataRequest: (widgetType: WidgetType) => void
  emitWeatherRequest: (location?: string) => void
}

// Dynamic Socket.IO URL - force HTTP for LAN access
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? `http://${window.location.hostname}:3001` 
    : 'http://localhost:3001')

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  
  connect: () => {
    const socket = io(SOCKET_URL, {
      // Force HTTP transport and disable HTTPS
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: false,
      forceNew: true,
      // Explicitly force HTTP protocol
      secure: false,
      // Additional options for LAN/cross-origin access
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // Force polling first for better compatibility
      forceBase64: false,
      withCredentials: false,
    })
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO Connected to server')
      set({ isConnected: true })
    })
    
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO Disconnected from server:', reason)
      set({ isConnected: false })
    })
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO Connection error:', {
        error: error,
        message: error.message,
        description: error.description,
        context: {
          socketUrl: SOCKET_URL,
          currentUrl: typeof window !== 'undefined' ? window.location.href : 'undefined'
        }
      })
    })
    
    socket.on('reconnect', (attempt) => {
      console.log('🔄 Socket.IO Reconnected after attempt:', attempt)
    })
    
    socket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO Reconnection error:', error)
    })
    
    socket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO Reconnection failed completely')
    })
    
    socket.on('layout-updated', (layout: Layout) => {
      console.log('Layout updated from server:', layout)
      // Update layout store if needed
    })
    
    socket.on('widget-data-updated', (widgetId: string, data: any) => {
      console.log('Widget data updated:', widgetId, data)
      // Handle widget data updates
    })
    
    socket.on('weather-updated', (data) => {
      console.log('Weather data updated:', data)
      // Handle weather data updates
    })
    
    set({ socket })
  },
  
  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },
  
  emitLayoutUpdate: (layout: Layout) => {
    const { socket } = get()
    if (socket?.connected) {
      socket.emit('layout-update', layout)
    }
  },
  
  emitWidgetDataRequest: (widgetType: WidgetType) => {
    const { socket } = get()
    if (socket?.connected) {
      socket.emit('widget-data-request', widgetType)
    }
  },
  
  emitWeatherRequest: (location?: string) => {
    const { socket } = get()
    if (socket?.connected) {
      socket.emit('weather-request', location)
    }
  },
}))