import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cloud, Sun, CloudRain, Thermometer, Droplets, Wind } from 'lucide-react'
import type { WeatherData } from '../../../../shared/types'

interface WeatherWidgetProps {
  location?: string
  showForecast?: boolean
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
  location = 'Tokyo', 
  showForecast = true 
}: WeatherWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const { data: weather, isLoading, error } = useQuery<WeatherData>({
    queryKey: ['weather', location],
    queryFn: async () => {
      // Placeholder for weather API call
      // In a real implementation, this would call the backend API
      return {
        location: location,
        current: {
          temperature: 24,
          humidity: 65,
          description: '晴れ',
          icon: 'clear-day',
          windSpeed: 3.2,
          windDirection: 180,
        },
        forecast: [
          {
            date: '2024-01-01',
            temperature: { min: 18, max: 26 },
            description: '晴れ',
            icon: 'clear-day',
            precipitation: 0,
          },
        ],
        lastUpdated: new Date().toISOString(),
      }
    },
    refetchInterval: 30 * 60 * 1000, // Refresh every 30 minutes
  })

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
        </div>
      </div>
    )
  }

  if (!weather) return null

  const IconComponent = weatherIcons[weather.current.icon as keyof typeof weatherIcons] || weatherIcons.default

  return (
    <div className="h-full flex flex-col justify-between p-2 text-white">
      <div className="flex items-center gap-2 mb-2">
        <IconComponent size={24} className="text-white/80" />
        <span className="text-lg font-medium text-white/80">天気</span>
      </div>
      
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