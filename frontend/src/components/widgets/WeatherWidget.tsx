import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cloud, Sun, CloudRain, Droplets, Wind, Settings, Search } from 'lucide-react'
import type { WeatherData, CitySearchResult, APIResponse } from '../../../../shared/types'
import { useSettingsStore } from '../../stores/settingsStore'

interface WeatherWidgetProps {
  location?: string
  showForecast?: boolean
  onLocationChange?: (location: string) => void
}

const weatherIcons = {
  'clear-day': Sun,
  'clear-night': Sun,
  'partly-cloudy-day': Cloud,
  'partly-cloudy-night': Cloud,
  'cloudy': Cloud,
  'rain': CloudRain,
  'snow': CloudRain,
  'default': Cloud,
}

export default function WeatherWidget({ 
  onLocationChange
}: WeatherWidgetProps) {
  const { settings, updateWeatherLocation } = useSettingsStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Weather data query
  const { data: weather, isLoading, error, refetch } = useQuery<WeatherData>({
    queryKey: ['weather', settings.weather.location],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/api/weather?location=${encodeURIComponent(settings.weather.location)}`)
      const result: APIResponse<WeatherData> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch weather data')
      }
      
      return result.data!
    },
    refetchInterval: 30 * 60 * 1000, // Refresh every 30 minutes
    retry: 2,
  })

  // City search query
  const { data: cities, isLoading: isSearching } = useQuery<CitySearchResult[]>({
    queryKey: ['cities', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return []
      
      const response = await fetch(`http://localhost:3001/api/weather/cities?q=${encodeURIComponent(searchQuery)}`)
      const result: APIResponse<CitySearchResult[]> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search cities')
      }
      
      return result.data || []
    },
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const handleLocationSelect = (cityName: string) => {
    updateWeatherLocation(cityName)
    onLocationChange?.(cityName)
    setIsSettingsOpen(false)
    setSearchQuery('')
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="text-center">
          <Cloud className="mx-auto mb-2 text-white/60" size={32} />
          <p className="text-sm text-white/80">天気情報を取得できません</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-white/10 rounded text-xs hover:bg-white/20 transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const IconComponent = weatherIcons[weather.current.icon as keyof typeof weatherIcons] || weatherIcons.default

  return (
    <div className="h-full flex flex-col justify-between p-2 text-white relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconComponent size={24} className="text-white/80" />
          <span className="text-lg font-medium text-white/80">天気</span>
        </div>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <Settings size={16} className="text-white/60" />
        </button>
      </div>

      {/* Settings panel */}
      {isSettingsOpen && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/90 backdrop-blur-sm rounded-lg p-3 z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">地点を選択</h3>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-white/60 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="mb-3">
            <p className="text-xs text-white/60 mb-2">
              現在の地点: {settings.weather.location}
            </p>
            <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
              <Search size={14} className="text-white/60" />
              <input
                type="text"
                placeholder="都市名を入力..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white text-sm flex-1 outline-none placeholder-white/60"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-32 overflow-y-auto">
            {isSearching && searchQuery.length >= 2 && (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60 mx-auto"></div>
              </div>
            )}
            
            {cities && cities.length > 0 && (
              <div className="space-y-1">
                {cities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(city.name)}
                    className="w-full text-left px-2 py-1 text-sm text-white/80 hover:bg-white/10 rounded transition-colors"
                  >
                    {city.displayName}
                  </button>
                ))}
              </div>
            )}
            
            {searchQuery.length >= 2 && cities && cities.length === 0 && !isSearching && (
              <div className="text-center py-2 text-white/60 text-sm">
                該当する都市が見つかりません
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold mb-1">
            {weather.current.temperature}°C
          </div>
          <div className="text-sm text-white/80 mb-2">
            {weather.current.description}
          </div>
          <div className="text-xs text-white/60">
            {weather.location}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Droplets size={12} className="text-white/60" />
            <span className="text-white/80">湿度 {weather.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind size={12} className="text-white/60" />
            <span className="text-white/80">風速 {weather.current.windSpeed}m/s</span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-white/60 text-center">
        最終更新: {new Date(weather.lastUpdated).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  )
}