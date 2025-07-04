import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WeatherSettings {
  location: string
  units: 'metric' | 'imperial'
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'ja'
  weather: WeatherSettings
}

interface SettingsStore {
  settings: AppSettings
  updateWeatherLocation: (location: string) => void
  updateWeatherUnits: (units: 'metric' | 'imperial') => void
  updateTheme: (theme: 'light' | 'dark' | 'auto') => void
  updateLanguage: (language: 'en' | 'ja') => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'ja',
  weather: {
    location: 'Tokyo',
    units: 'metric'
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      
      updateWeatherLocation: (location: string) =>
        set((state) => ({
          settings: {
            ...state.settings,
            weather: {
              ...state.settings.weather,
              location
            }
          }
        })),
      
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
      
      resetSettings: () =>
        set(() => ({
          settings: defaultSettings
        }))
    }),
    {
      name: 'smart-display-settings',
      version: 1,
    }
  )
)