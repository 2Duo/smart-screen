import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cloud, Sun, CloudRain, Droplets, Wind, Settings, Search } from 'lucide-react'
import type { WeatherData, CitySearchResult, APIResponse } from '../../../../shared/types'
import { useWidgetStore } from '../../stores/widgetStore'

interface WeatherWidgetProps {
  location?: string
  showForecast?: boolean
  onLocationChange?: (location: string) => void
  widgetId?: string
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
  location: propLocation,
  onLocationChange,
  widgetId
}: WeatherWidgetProps) {
  const { updateWidget, getWidget } = useWidgetStore()
  const widget = widgetId ? getWidget(widgetId) : null
  const currentLocation = propLocation || widget?.config?.location || 'Tokyo'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Weather data query
  const { data: weather, isLoading, error, refetch } = useQuery<WeatherData>({
    queryKey: ['weather', currentLocation, widgetId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/api/weather?location=${encodeURIComponent(currentLocation)}`)
      const result: APIResponse<WeatherData> = await response.json()
      
      if (!result.success) {
        const errorObj = new Error(result.error || 'Failed to fetch weather data')
        // Add status code to error for better handling
        ;(errorObj as any).statusCode = response.status
        throw errorObj
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
    if (widgetId) {
      updateWidget(widgetId, { ...widget?.config, location: cityName })
    }
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
    const is404Error = (error as any).statusCode === 404
    
    return (
      <div className="h-full flex flex-col justify-between p-2 text-white relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Cloud size={24} className="text-white/80" />
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
                現在の地点: {currentLocation}
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

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Cloud className="mx-auto mb-4 text-white/60" size={48} />
            <p className="text-xl text-white/80 font-medium mb-2">
              {is404Error ? '地点が見つかりません' : '天気情報を取得できません'}
            </p>
            <p className="text-base text-white/60 mt-2">
              {is404Error ? `"${currentLocation}"は存在しません` : (error as any)?.message || 'エラーが発生しました'}
            </p>
            <div className="mt-4 flex gap-3 justify-center">
              {is404Error && (
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
                >
                  地点を変更
                </button>
              )}
              <button 
                onClick={() => refetch()}
                className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const IconComponent = weatherIcons[weather.current.icon as keyof typeof weatherIcons] || weatherIcons.default

  return (
    <div className="h-full flex flex-col justify-between p-4 text-white relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <IconComponent size={32} className="text-white/80" />
          <span className="text-2xl font-semibold text-white/80">天気</span>
        </div>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 rounded hover:bg-white/10 transition-colors"
        >
          <Settings size={20} className="text-white/60" />
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
              現在の地点: {currentLocation}
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
        <div className="text-center mb-6">
          <div className="text-6xl font-bold mb-3 leading-tight">
            {weather.current.temperature}°C
          </div>
          <div className="text-xl text-white/80 mb-3 font-medium">
            {weather.current.description}
          </div>
          <div className="text-lg text-white/60 font-medium">
            {weather.location}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-base">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-white/60" />
            <span className="text-white/80 font-medium">湿度 {weather.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={18} className="text-white/60" />
            <span className="text-white/80 font-medium">風速 {weather.current.windSpeed}m/s</span>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-white/60 text-center font-medium">
        最終更新: {new Date(weather.lastUpdated).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  )
}