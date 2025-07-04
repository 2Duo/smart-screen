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

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  
  connect: () => {
    const socket = io(SOCKET_URL)
    
    socket.on('connect', () => {
      console.log('Connected to server')
      set({ isConnected: true })
    })
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      set({ isConnected: false })
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