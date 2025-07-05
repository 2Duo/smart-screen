import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cloud, Sun, CloudRain, Droplets, Wind, Search, Eye, Thermometer, Gauge, Compass, Sunrise, Sunset, Zap, CloudDrizzle, X } from 'lucide-react'
import type { WeatherData, CitySearchResult, APIResponse } from '../../../../shared/types'
import { useWidgetStore } from '../../stores/widgetStore'
import { WidgetTemplate } from './WidgetTemplate'

interface WeatherWidgetProps {
  location?: string
  showForecast?: boolean
  displayOptions?: any
  layoutConfig?: any
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
  displayOptions: propDisplayOptions,
  layoutConfig: propLayoutConfig,
  onLocationChange,
  widgetId
}: WeatherWidgetProps) {
  const { updateWidget, getWidget } = useWidgetStore()
  const widget = widgetId ? getWidget(widgetId) : null
  const currentLocation = propLocation || widget?.config?.location || 'Tokyo'
  const currentLayoutConfig = propLayoutConfig || widget?.config?.layoutConfig || {
    primary: 'temperature',
    secondary: 'description',
    tertiary: 'location',
    details: ['humidity', 'windSpeed', 'precipitationProbability'],
  }
  const currentDisplayOptions = propDisplayOptions || widget?.config?.displayOptions || {
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
    description: true,
    location: true,
  }
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'location' | 'display' | 'layout'>('location')
  const [selectedLayoutArea, setSelectedLayoutArea] = useState<string | null>(null)
  const [isLayoutEditing, setIsLayoutEditing] = useState(false)

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

  const handleDisplayOptionChange = (option: string, value: boolean) => {
    if (widgetId) {
      const newDisplayOptions = { ...currentDisplayOptions, [option]: value }
      updateWidget(widgetId, { ...widget?.config, displayOptions: newDisplayOptions })
    }
  }

  const handleLayoutConfigChange = (area: string, value: string | string[]) => {
    if (widgetId) {
      const newLayoutConfig = { ...currentLayoutConfig, [area]: value }
      updateWidget(widgetId, { ...widget?.config, layoutConfig: newLayoutConfig })
    }
  }

  // Available weather items for layout selection
  const weatherItems = [
    { key: 'temperature', label: '気温', icon: Thermometer },
    { key: 'feelsLike', label: '体感温度', icon: Thermometer },
    { key: 'tempMinMax', label: '最高/最低気温', icon: Thermometer },
    { key: 'description', label: '天気説明', icon: Cloud },
    { key: 'humidity', label: '湿度', icon: Droplets },
    { key: 'pressure', label: '気圧', icon: Gauge },
    { key: 'windSpeed', label: '風速', icon: Wind },
    { key: 'windDirection', label: '風向', icon: Compass },
    { key: 'windGust', label: '突風', icon: Wind },
    { key: 'visibility', label: '視界', icon: Eye },
    { key: 'cloudiness', label: '雲量', icon: Cloud },
    { key: 'sunrise', label: '日の出', icon: Sunrise },
    { key: 'sunset', label: '日の入', icon: Sunset },
    { key: 'uvIndex', label: 'UV指数', icon: Zap },
    { key: 'precipitationProbability', label: '降水確率', icon: CloudDrizzle },
    { key: 'location', label: '地点名', icon: Search },
  ]

  // Settings Panel Component
  const renderSettingsPanel = () => {
    if (!isSettingsOpen) return null
    
    return (
      <div className="absolute top-0 left-0 right-0 bottom-0 backdrop-blur-3xl bg-gradient-to-br from-black/60 via-black/50 to-black/60 border border-white/20 rounded-2xl p-5 z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white tracking-wide">天気設定</h3>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="group p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <X size={16} className="text-white/70 group-hover:text-white transition-colors group-hover:rotate-90" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-gradient-to-r from-white/10 to-white/15 rounded-2xl p-2 backdrop-blur-xl border border-white/20">
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'location'
                ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-white border border-blue-300/30 shadow-lg'
                : 'text-white/60 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            地点
          </button>
          <button
            onClick={() => {
              setIsSettingsOpen(false)
              setIsLayoutEditing(true)
            }}
            className="flex-1 px-4 py-3 text-sm font-semibold rounded-xl text-white/60 hover:text-white/80 hover:bg-white/10"
          >
            レイアウト編集
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'display'
                ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-white border border-blue-300/30 shadow-lg'
                : 'text-white/60 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            表示項目
          </button>
        </div>

        {activeTab === 'location' && (
          <>
            <div className="mb-5">
              <p className="text-sm text-white/80 font-medium mb-3">
                現在の地点: <span className="text-white bg-gradient-to-r from-blue-400/20 to-purple-400/20 px-3 py-1 rounded-xl">{currentLocation}</span>
              </p>
              <div className="flex items-center gap-3 bg-gradient-to-r from-white/10 to-white/15 rounded-2xl px-4 py-3 backdrop-blur-xl border border-white/20">
                <Search size={18} className="text-white/60" />
                <input
                  type="text"
                  placeholder="都市名を入力..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white text-base flex-1 outline-none placeholder-white/60 font-medium"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {isSearching && searchQuery.length >= 2 && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60 mx-auto"></div>
                </div>
              )}
              
              {cities && cities.length > 0 && (
                <div className="space-y-2">
                  {cities.map((city, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(city.name)}
                      className="w-full text-left px-4 py-3 text-sm text-white/80 hover:text-white bg-gradient-to-r from-white/5 to-white/10 hover:from-white/15 hover:to-white/20 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 font-medium"
                    >
                      {city.displayName}
                    </button>
                  ))}
                </div>
              )}
              
              {searchQuery.length >= 2 && cities && cities.length === 0 && !isSearching && (
                <div className="text-center py-4 text-white/60 text-sm font-medium">
                  該当する都市が見つかりません
                </div>
              )}
            </div>
          </>
        )}



        {activeTab === 'display' && (
          <div className="max-h-64 overflow-y-auto space-y-3">
            {[
              { key: 'temperature', label: '気温', icon: Thermometer },
              { key: 'feelsLike', label: '体感温度', icon: Thermometer },
              { key: 'tempMinMax', label: '最高/最低気温', icon: Thermometer },
              { key: 'description', label: '天気説明', icon: Cloud },
              { key: 'humidity', label: '湿度', icon: Droplets },
              { key: 'pressure', label: '気圧', icon: Gauge },
              { key: 'windSpeed', label: '風速', icon: Wind },
              { key: 'windDirection', label: '風向', icon: Compass },
              { key: 'windGust', label: '突風', icon: Wind },
              { key: 'visibility', label: '視界', icon: Eye },
              { key: 'cloudiness', label: '雲量', icon: Cloud },
              { key: 'sunrise', label: '日の出', icon: Sunrise },
              { key: 'sunset', label: '日の入', icon: Sunset },
              { key: 'uvIndex', label: 'UV指数', icon: Zap },
              { key: 'precipitationProbability', label: '降水確率', icon: CloudDrizzle },
              { key: 'location', label: '地点名', icon: Search },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-white/60" />
                  <span className="text-sm text-white/80 font-medium">{label}</span>
                </div>
                <button
                  onClick={() => handleDisplayOptionChange(key, !currentDisplayOptions[key])}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                    currentDisplayOptions[key]
                      ? 'bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg'
                      : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-lg ${
                      currentDisplayOptions[key]
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <WidgetTemplate
        icon={Cloud}
        title="天気"
        onSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        settingsPanel={renderSettingsPanel()}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-lg text-white/80 mt-4">読み込み中...</p>
        </div>
      </WidgetTemplate>
    )
  }

  if (error) {
    const is404Error = (error as any).statusCode === 404
    
    return (
      <WidgetTemplate
        icon={Cloud}
        title="天気"
        onSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        settingsPanel={renderSettingsPanel()}
      >
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
      </WidgetTemplate>
    )
  }

  if (!weather) return null

  const IconComponent = weatherIcons[weather.current.icon as keyof typeof weatherIcons] || weatherIcons.default

  return (
    <WidgetTemplate
      icon={IconComponent}
      title="天気"
      onSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      settingsPanel={renderSettingsPanel()}
      footer={`最終更新: ${new Date(weather.lastUpdated).toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`}
    >
      <div className="space-y-4">
        {/* Dynamic Layout - Primary Display */}
        {currentLayoutConfig.primary && currentLayoutConfig.primary !== 'none' && (
          <div
            className={isLayoutEditing ? 'text-center p-2 rounded-xl border border-blue-400 cursor-pointer' : 'text-center'}
            onClick={isLayoutEditing ? () => setSelectedLayoutArea('primary') : undefined}
          >
            {(() => {
              switch (currentLayoutConfig.primary) {
                case 'temperature':
                  return <div className="text-6xl font-bold leading-tight">{weather.current.temperature}°C</div>
                case 'feelsLike':
                  return <div className="text-6xl font-bold leading-tight">体感 {weather.current.feelsLike}°C</div>
                case 'tempMinMax':
                  return <div className="text-6xl font-bold leading-tight">{weather.current.tempMin}°C / {weather.current.tempMax}°C</div>
                case 'description':
                  return <div className="text-6xl font-bold leading-tight">{weather.current.description}</div>
                case 'location':
                  return <div className="text-6xl font-bold leading-tight">{weather.location}</div>
                case 'humidity':
                  return <div className="text-6xl font-bold leading-tight">{weather.current.humidity}%</div>
                case 'windSpeed':
                  return <div className="text-6xl font-bold leading-tight">{weather.current.windSpeed}m/s</div>
                case 'precipitationProbability':
                  return <div className="text-6xl font-bold leading-tight">{weather.current.precipitationProbability}%</div>
              default:
                return null
              }
            })()}
          </div>
        )}

        {/* Dynamic Layout - Secondary Display */}
        {currentLayoutConfig.secondary && currentLayoutConfig.secondary !== 'none' && (
          <div
            className={isLayoutEditing ? 'text-center p-2 rounded-xl border border-blue-400 cursor-pointer' : 'text-center'}
            onClick={isLayoutEditing ? () => setSelectedLayoutArea('secondary') : undefined}
          >
            {(() => {
              switch (currentLayoutConfig.secondary) {
                case 'temperature':
                  return <div className="text-xl text-white/80 font-medium">{weather.current.temperature}°C</div>
                case 'feelsLike':
                  return <div className="text-xl text-white/80 font-medium">体感 {weather.current.feelsLike}°C</div>
                case 'tempMinMax':
                  return <div className="text-xl text-white/80 font-medium">{weather.current.tempMin}°C / {weather.current.tempMax}°C</div>
                case 'description':
                  return <div className="text-xl text-white/80 font-medium">{weather.current.description}</div>
                case 'location':
                  return <div className="text-xl text-white/80 font-medium">{weather.location}</div>
                case 'humidity':
                  return <div className="text-xl text-white/80 font-medium">湿度 {weather.current.humidity}%</div>
                case 'windSpeed':
                  return <div className="text-xl text-white/80 font-medium">風速 {weather.current.windSpeed}m/s</div>
                case 'precipitationProbability':
                  return <div className="text-xl text-white/80 font-medium">降水確率 {weather.current.precipitationProbability}%</div>
              default:
                return null
              }
            })()}
          </div>
        )}

        {/* Dynamic Layout - Tertiary Display */}
        {currentLayoutConfig.tertiary && currentLayoutConfig.tertiary !== 'none' && (
          <div
            className={isLayoutEditing ? 'text-center p-2 rounded-xl border border-blue-400 cursor-pointer' : 'text-center'}
            onClick={isLayoutEditing ? () => setSelectedLayoutArea('tertiary') : undefined}
          >
            {(() => {
              switch (currentLayoutConfig.tertiary) {
                case 'temperature':
                  return <div className="text-lg text-white/60 font-medium">{weather.current.temperature}°C</div>
                case 'feelsLike':
                  return <div className="text-lg text-white/60 font-medium">体感 {weather.current.feelsLike}°C</div>
                case 'tempMinMax':
                  return <div className="text-lg text-white/60 font-medium">{weather.current.tempMin}°C / {weather.current.tempMax}°C</div>
                case 'description':
                  return <div className="text-lg text-white/60 font-medium">{weather.current.description}</div>
                case 'location':
                  return <div className="text-lg text-white/60 font-medium">{weather.location}</div>
                case 'humidity':
                  return <div className="text-lg text-white/60 font-medium">湿度 {weather.current.humidity}%</div>
                case 'windSpeed':
                  return <div className="text-lg text-white/60 font-medium">風速 {weather.current.windSpeed}m/s</div>
                case 'precipitationProbability':
                  return <div className="text-lg text-white/60 font-medium">降水確率 {weather.current.precipitationProbability}%</div>
              default:
                return null
              }
            })()}
          </div>
        )}

        {/* Dynamic Layout - Details Grid */}
        {currentLayoutConfig.details && currentLayoutConfig.details.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {currentLayoutConfig.details.map((itemKey: string) => {
              const item = weatherItems.find(item => item.key === itemKey)
              if (!item) return null
              
              const IconComponent = item.icon
              
              switch (itemKey) {
                case 'feelsLike':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">体感 {weather.current.feelsLike}°C</span>
                    </div>
                  )
                case 'tempMinMax':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">{weather.current.tempMin}°C / {weather.current.tempMax}°C</span>
                    </div>
                  )
                case 'humidity':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">湿度 {weather.current.humidity}%</span>
                    </div>
                  )
                case 'pressure':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">気圧 {weather.current.pressure}hPa</span>
                    </div>
                  )
                case 'windSpeed':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">風速 {weather.current.windSpeed}m/s</span>
                    </div>
                  )
                case 'windDirection':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">風向 {weather.current.windDirection}°</span>
                    </div>
                  )
                case 'windGust':
                  return weather.current.windGust > 0 ? (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">突風 {weather.current.windGust}m/s</span>
                    </div>
                  ) : null
                case 'visibility':
                  return weather.current.visibility > 0 ? (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">視界 {weather.current.visibility}km</span>
                    </div>
                  ) : null
                case 'cloudiness':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">雲量 {weather.current.cloudiness}%</span>
                    </div>
                  )
                case 'sunrise':
                  return weather.current.sunrise ? (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">日出 {weather.current.sunrise}</span>
                    </div>
                  ) : null
                case 'sunset':
                  return weather.current.sunset ? (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">日入 {weather.current.sunset}</span>
                    </div>
                  ) : null
                case 'uvIndex':
                  return weather.current.uvIndex > 0 ? (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">UV指数 {weather.current.uvIndex}</span>
                    </div>
                  ) : null
                case 'precipitationProbability':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">降水確率 {weather.current.precipitationProbability}%</span>
                    </div>
                  )
                default:
                  return null
              }
            })}
          </div>
        )}
      </div>

      {isLayoutEditing && (
        <button
          onClick={() => setIsLayoutEditing(false)}
          className="absolute top-2 right-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20"
        >
          <X size={16} className="text-white" />
        </button>
      )}

      {isLayoutEditing && selectedLayoutArea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-black/80 via-black/70 to-black/80 border border-white/20 rounded-2xl p-5 max-w-sm w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-white">項目を選択</h4>
              <button
                onClick={() => setSelectedLayoutArea(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <X size={16} className="text-white/70" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  handleLayoutConfigChange(selectedLayoutArea, 'none')
                  setSelectedLayoutArea(null)
                }}
                className="w-full text-left px-3 py-2 bg-gradient-to-r from-white/5 to-white/10 hover:from-white/15 hover:to-white/20 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                <span className="text-sm text-white/80 font-medium">なし</span>
              </button>
              {weatherItems.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    handleLayoutConfigChange(selectedLayoutArea, key)
                    setSelectedLayoutArea(null)
                  }}
                  className="w-full text-left px-3 py-2 bg-gradient-to-r from-white/5 to-white/10 hover:from-white/15 hover:to-white/20 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-white/60" />
                    <span className="text-sm text-white/80 font-medium">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetTemplate>
  )
}