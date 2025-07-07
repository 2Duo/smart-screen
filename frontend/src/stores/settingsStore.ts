import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { InputSanitizer } from '../utils/cryptoUtils'

interface WeatherSettings {
  location: string
  units: 'metric' | 'imperial'
}

interface AppearanceSettings {
  uiStyle: 'liquid-glass' | 'material-you'
  backgroundType: 'gradient' | 'image'
  backgroundImage?: string
  backgroundOpacity: number
  autoFontSize?: boolean
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'ja'
  weather: WeatherSettings
  appearance: AppearanceSettings
}

interface SettingsStore {
  settings: AppSettings
  updateWeatherLocation: (location: string) => void
  updateWeatherUnits: (units: 'metric' | 'imperial') => void
  updateTheme: (theme: 'light' | 'dark' | 'auto') => void
  updateLanguage: (language: 'en' | 'ja') => void
  updateUIStyle: (style: 'liquid-glass' | 'material-you') => void
  updateBackgroundType: (type: 'gradient' | 'image') => void
  updateBackgroundImage: (image: string) => void
  updateBackgroundOpacity: (opacity: number) => void
  updateAutoFontSize: (enabled: boolean) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'ja',
  weather: {
    location: 'Tokyo',
    units: 'metric'
  },
  appearance: {
    uiStyle: 'liquid-glass',
    backgroundType: 'gradient',
    backgroundImage: undefined,
    backgroundOpacity: 0.8,
    autoFontSize: true,
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      
      updateWeatherLocation: (location: string) => {
        // Sanitize input to prevent XSS
        const sanitizedLocation = InputSanitizer.sanitizeText(location)
        if (!InputSanitizer.validateInput(sanitizedLocation, 100)) {
          console.warn('Invalid location input')
          return
        }
        
        set((state) => ({
          settings: {
            ...state.settings,
            weather: {
              ...state.settings.weather,
              location: sanitizedLocation
            }
          }
        }))
      },
      
      updateWeatherUnits: (units: 'metric' | 'imperial') =>
        set((state) => ({
          settings: {
            ...state.settings,
            weather: {
              ...state.settings.weather,
              units
            }
          }
        })),
      
      updateTheme: (theme: 'light' | 'dark' | 'auto') =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme
          }
        })),
      
      updateLanguage: (language: 'en' | 'ja') =>
        set((state) => ({
          settings: {
            ...state.settings,
            language
          }
        })),
      
      updateUIStyle: (style: 'liquid-glass' | 'material-you') =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: {
              ...state.settings.appearance,
              uiStyle: style
            }
          }
        })),
      
      updateBackgroundType: (type: 'gradient' | 'image') =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: {
              ...state.settings.appearance,
              backgroundType: type
            }
          }
        })),
      
      updateBackgroundImage: (image: string) => {
        // Sanitize and validate URL
        const sanitizedImage = InputSanitizer.sanitizeUrl(image)
        if (!InputSanitizer.validateInput(sanitizedImage, 2000)) {
          console.warn('Invalid background image URL')
          return
        }
        
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: {
              ...state.settings.appearance,
              backgroundImage: sanitizedImage
            }
          }
        }))
      },
      
      updateBackgroundOpacity: (opacity: number) =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: {
              ...state.settings.appearance,
              backgroundOpacity: opacity
            }
          }
        })),
      
      updateAutoFontSize: (enabled: boolean) =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: {
              ...state.settings.appearance,
              autoFontSize: enabled
            }
          }
        })),
      
      resetSettings: () =>
        set(() => ({
          settings: defaultSettings
        }))
    }),
    {
      name: 'smart-display-settings',
      version: 1,
      // Ensure proper initialization
      onRehydrateStorage: () => (state, error) => {
        console.log('Settings rehydrated:', state)
        console.log('Rehydration error:', error)
        
        // If settings are corrupted or missing, we need to reset
        if (error || !state || !state.settings || !state.settings.appearance) {
          console.warn('Settings corrupted or missing, resetting to defaults')
          // Don't return a new state, instead we'll handle this in the component
        }
      },
    }
  )
)