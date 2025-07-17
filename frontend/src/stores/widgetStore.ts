import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { InputSanitizer } from '../utils/cryptoUtils'
import type { Widget, WidgetType, WidgetConfig } from '../../../shared/types'

interface WidgetState {
  widgets: Widget[]
  isEditMode: boolean
  
  // Widget management
  addWidget: (type: WidgetType, config?: WidgetConfig) => string
  removeWidget: (id: string) => void
  updateWidget: (id: string, config: WidgetConfig) => void
  
  // Edit mode
  toggleEditMode: () => void
  setEditMode: (isEditMode: boolean) => void
  
  // Helper functions
  getWidget: (id: string) => Widget | undefined
  getWidgetsByType: (type: WidgetType) => Widget[]
}

// Default widget configurations
const defaultWidgetConfigs: Record<WidgetType, WidgetConfig> = {
  clock: {
    showSeconds: true,
    format24Hour: true,
    showDate: true,
    fontSize: 96, // Font size in pixels, range 32-128
  },
  weather: {
    location: 'Tokyo',
    showForecast: false,
    layoutConfig: {
      primary: 'temperature',      // メイン表示 (最大サイズ)
      secondary: 'description',    // セカンダリ表示 (中サイズ)
      tertiary: 'location',        // サード表示 (小サイズ)
      details: ['humidity', 'windSpeed', 'precipitationProbability'], // 詳細グリッド
    },
    displayOptions: {
      temperature: true,
      feelsLike: false,
      tempMinMax: false,
      humidity: true,
      pressure: false,
      windSpeed: true,
      windDirection: false,
      windGust: false,
      visibility: false,
      cloudiness: false,
      sunrise: false,
      sunset: false,
      uvIndex: false,
      precipitationProbability: true,
      rainPeriods: true,
      description: true,
      location: true,
    },
  },
  calendar: {
    showWeekNumbers: false,
    firstDayOfWeek: 0,
  },
  'calendar-beta': {
    maxEvents: 5,
    daysPeriod: 7,
    upcomingCount: 3,
    layoutConfig: {
      primary: 'nextEventTitle',
      secondary: 'nextEventTime',
      tertiary: 'nextEventLocation',
      details: ['upcomingEvents', 'todayEvents'],
    },
    displayOptions: {
      nextEventTitle: true,
      nextEventTime: true,
      nextEventLocation: true,
      secondNextEventTitle: false,
      secondNextEventTime: false,
      upcomingEvents: true,
      todayEvents: true,
      tomorrowEvents: true,
      eventCount: true,
    },
  },
  news: {
    sources: ['general'],
    maxItems: 5,
  },
  photo: {
    source: 'unsplash',
    category: 'nature',
    refreshInterval: 3600000, // 1 hour
  },
  custom: {},
}

// Widget metadata for UI
export const widgetMetadata = {
  clock: {
    name: '時計',
    description: '現在時刻と日付を表示',
    icon: 'Clock',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 3, h: 2 },
  },
  weather: {
    name: '天気',
    description: '現在の天気と予報を表示',
    icon: 'Cloud',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
  },
  calendar: {
    name: 'カレンダー',
    description: '月間カレンダーを表示',
    icon: 'Calendar',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
  },
  'calendar-beta': {
    name: 'カレンダー (ベータ)',
    description: 'Googleカレンダーの予定を表示（高機能版）',
    icon: 'Calendar',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
  },
  news: {
    name: 'ニュース',
    description: '最新のニュースを表示',
    icon: 'Newspaper',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  photo: {
    name: '写真',
    description: '写真を表示',
    icon: 'Image',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
  },
  custom: {
    name: 'カスタム',
    description: 'カスタムウィジェット',
    icon: 'Settings',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
  },
} as const

// Initial widgets
const initialWidgets: Widget[] = [
  {
    id: 'clock',
    type: 'clock',
    title: '時計',
    config: defaultWidgetConfigs.clock,
  },
  {
    id: 'weather',
    type: 'weather',
    title: '天気',
    config: defaultWidgetConfigs.weather,
  },
]

export const useWidgetStore = create(
  persist<WidgetState>(
    (set, get) => ({
      widgets: initialWidgets,
      isEditMode: false,
      
      addWidget: (type: WidgetType, config?: WidgetConfig) => {
        // Validate widget type
        if (!widgetMetadata[type]) {
          console.warn('Invalid widget type:', type)
          return ''
        }
        
        const id = `${type}-${Date.now()}`
        
        // Sanitize config if provided
        const sanitizedConfig = config ? InputSanitizer.sanitizeObject(config) : undefined
        
        const newWidget: Widget = {
          id,
          type,
          title: InputSanitizer.sanitizeText(widgetMetadata[type].name),
          config: { ...defaultWidgetConfigs[type], ...sanitizedConfig },
        }
        
        set((state) => ({
          widgets: [...state.widgets, newWidget],
        }))
        
        return id
      },
      
      removeWidget: (id: string) => {
        set((state) => ({
          widgets: state.widgets.filter(widget => widget.id !== id),
        }))
      },
      
      updateWidget: (id: string, config: WidgetConfig) => {
        // Sanitize config
        const sanitizedConfig = InputSanitizer.sanitizeObject(config)
        
        set((state) => ({
          widgets: state.widgets.map(widget =>
            widget.id === id ? { ...widget, config: sanitizedConfig } : widget
          ),
        }))
      },
      
      toggleEditMode: () => {
        set((state) => ({
          isEditMode: !state.isEditMode,
        }))
      },
      
      setEditMode: (isEditMode: boolean) => {
        set({ isEditMode })
      },
      
      getWidget: (id: string) => {
        return get().widgets.find(widget => widget.id === id)
      },
      
      getWidgetsByType: (type: WidgetType) => {
        return get().widgets.filter(widget => widget.type === type)
      },
    }),
    {
      name: 'smart-display-widgets',
      version: 1,
    }
  )
)