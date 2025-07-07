// Widget types
export interface Widget {
  id: string
  type: WidgetType
  title: string
  config: WidgetConfig
}

export type WidgetType = 'clock' | 'weather' | 'calendar' | 'news' | 'photo' | 'custom'

export interface WidgetConfig {
  refreshInterval?: number
  [key: string]: any
}

// Layout types
export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
}

export type Layout = LayoutItem[]

// Weather types
export interface RainPeriod {
  start: string
  end: string
  probability: number
}

export interface WeatherData {
  location: string
  current: {
    temperature: number
    feelsLike: number
    tempMin: number
    tempMax: number
    humidity: number
    pressure: number
    seaLevel: number
    groundLevel: number
    description: string
    icon: string
    windSpeed: number
    windDirection: number
    windGust: number
    visibility: number
    cloudiness: number
    sunrise: string
    sunset: string
    uvIndex: number
    precipitationProbability: number
    rainPeriods: RainPeriod[]
  }
  forecast: WeatherForecast[]
  lastUpdated: string
}

export interface WeatherForecast {
  date: string
  temperature: {
    min: number
    max: number
  }
  description: string
  icon: string
  precipitation: number
}

// Socket.io event types
export interface ServerToClientEvents {
  'layout-updated': (layout: Layout) => void
  'widget-data-updated': (widgetId: string, data: any) => void
  'weather-updated': (data: WeatherData) => void
}

export interface ClientToServerEvents {
  'layout-update': (layout: Layout) => void
  'widget-data-request': (widgetType: WidgetType) => void
  'weather-request': (location?: string) => void
}

// City search types
export interface CitySearchResult {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
  displayName: string
}

// Calendar types
export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO 8601 datetime
  end: string // ISO 8601 datetime
  location?: string
  description?: string
  isAllDay: boolean
  calendarId: string
  calendarName?: string
  attendees?: string[]
  status: 'confirmed' | 'tentative' | 'cancelled'
  recurring?: boolean
}

export interface CalendarData {
  events: CalendarEvent[]
  nextWeekEvents: CalendarEvent[]
  lastUpdated: string
  isAuthenticated: boolean
  authUrl?: string
}

// API response types
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// Configuration types
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'ja'
  weather: {
    location: string
    units: 'metric' | 'imperial'
    apiKey?: string
  }
  layout: {
    gridSize: number
    margin: number
    autoSave: boolean
  }
  appearance: {
    uiStyle: 'liquid-glass' | 'material-you'
    backgroundType: 'gradient' | 'image'
    backgroundImage?: string
    backgroundOpacity: number
  }
}