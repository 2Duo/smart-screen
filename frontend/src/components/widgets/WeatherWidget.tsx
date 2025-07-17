import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cloud, Sun, CloudRain, Droplets, Wind, Search, Eye, Thermometer, Gauge, Compass, Sunrise, Sunset, Zap, CloudDrizzle, X } from 'lucide-react'
import type { WeatherData, CitySearchResult, APIResponse } from '../../../../shared/types'
import { useWidgetStore } from '../../stores/widgetStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { WidgetTemplate } from './WidgetTemplate'
import { WidgetSettingsModal } from '../WidgetSettingsModal'
import { useMultiAutoFontSize } from '../../utils/autoFontSize'

interface WeatherWidgetProps {
  location?: string
  showForecast?: boolean
  displayOptions?: any
  layoutConfig?: any
  onLocationChange?: (location: string) => void
  autoFontSize?: boolean
  widgetId?: string
  isGlobalSettingsMode?: boolean
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
  autoFontSize: propAutoFontSize,
  widgetId,
  isGlobalSettingsMode = false
}: WeatherWidgetProps) {
  const { updateWidget, getWidget } = useWidgetStore()
  const { settings } = useSettingsStore()
  const widget = widgetId ? getWidget(widgetId) : null
  const uiStyle = settings?.appearance?.uiStyle || 'liquid-glass'
  const isLiquidGlass = uiStyle === 'liquid-glass'
  
  // 文字サイズ自動調整の設定
  const isAutoFontSizeEnabled = propAutoFontSize ?? widget?.config?.autoFontSize ?? settings?.appearance?.autoFontSize ?? false
  
  // 自動文字サイズ調整のフック
  const [containerRef, fontSizes] = useMultiAutoFontSize(
    isAutoFontSizeEnabled,
    widget?.config?.fontSize
  )

  // 手動フォントサイズ設定（デフォルト値付き）
  const manualFontSizes = {
    primary: widget?.config?.manualFontSizes?.primary ?? 16,
    secondary: widget?.config?.manualFontSizes?.secondary ?? 14,
    tertiary: widget?.config?.manualFontSizes?.tertiary ?? 12,
    details: widget?.config?.manualFontSizes?.details ?? 10
  }

  // 自動調整無効時は手動フォントサイズを使用
  const effectiveFontSizes = isAutoFontSizeEnabled ? fontSizes : manualFontSizes
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
  const [activeTab, setActiveTab] = useState<'location' | 'display' | 'layout' | 'font'>('location')
  const [selectedLayoutArea, setSelectedLayoutArea] = useState<string | null>(null)
  const [isLayoutEditing, setIsLayoutEditing] = useState(false)

  // Weather data query
  const { data: weather, isLoading, error, refetch } = useQuery<WeatherData>({
    queryKey: ['weather', currentLocation, widgetId],
    queryFn: async () => {
      // Use proxy API path for same-origin requests
      const url = `/api/weather?location=${encodeURIComponent(currentLocation)}`
      
      console.log('🌤️ Weather API Request:', {
        url,
        protocol: window.location.protocol,
        hostname: window.location.hostname
      })
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit', // Disable credentials for cross-origin
      })
      
      if (!response.ok) {
        const errorObj = new Error(`HTTP ${response.status}: ${response.statusText}`)
        ;(errorObj as any).statusCode = response.status
        throw errorObj
      }
      
      const result: APIResponse<WeatherData> = await response.json()
      
      if (!result.success) {
        const errorObj = new Error(result.error || 'Failed to fetch weather data')
        ;(errorObj as any).statusCode = response.status
        throw errorObj
      }
      
      return result.data!
    },
    refetchInterval: 30 * 60 * 1000, // Refresh every 30 minutes
    retry: 2,
  })

  // City search query
  const { data: cities, isLoading: isSearching, error: searchError } = useQuery<CitySearchResult[]>({
    queryKey: ['cities', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return []
      
      // Use proxy API path for same-origin requests
      const url = `/api/weather/cities?q=${encodeURIComponent(searchQuery)}`
      
      console.log('Searching cities:', searchQuery)
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'include',
        })
        
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result: APIResponse<CitySearchResult[]> = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Search failed')
        }
        
        return result.data || []
      } catch (error) {
        throw error
      }
    },
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once for search
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
  
  const handleAutoFontSizeToggle = (enabled: boolean) => {
    if (widgetId) {
      updateWidget(widgetId, { ...widget?.config, autoFontSize: enabled })
    }
  }

  const handleManualFontSizeChange = (type: 'primary' | 'secondary' | 'tertiary' | 'details', size: number) => {
    if (widgetId && widget) {
      const newManualFontSizes = {
        ...manualFontSizes,
        [type]: size
      }
      updateWidget(widgetId, { 
        ...widget?.config, 
        manualFontSizes: newManualFontSizes 
      })
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
    { key: 'rainPeriods', label: '雨の時間帯', icon: CloudDrizzle },
    { key: 'location', label: '地点名', icon: Search },
  ]

  // Settings Panel Component
  const renderSettingsContent = () => {
    const labelClass = isLiquidGlass 
      ? 'text-white/80' 
      : 'text-gray-700'
    
    const valueDisplayClass = isLiquidGlass
      ? 'text-white/90 bg-gradient-to-r from-blue-400/20 to-purple-400/20 border border-white/20'
      : 'text-gray-800 bg-blue-50 border border-blue-200'
    
    const inputClass = isLiquidGlass 
      ? 'bg-white/10 border-white/20 text-white'
      : 'bg-gray-50 border-gray-200 text-gray-800'
    
    const buttonClass = isLiquidGlass
      ? 'bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20'
      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
    
    // Location Tab Content
    if (activeTab === 'location') {
      return (
        <>
          <div className="mb-6">
            <div className={`text-sm font-medium mb-2 ${labelClass}`}>
              現在の地点
            </div>
            <div className={`text-lg font-semibold ${isLiquidGlass ? 'text-white' : 'text-gray-800'}`}>
              {currentLocation}
            </div>
          </div>
          
          <div className="mb-6">
            <div className={`text-sm font-medium mb-2 ${labelClass}`}>
              地点検索
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="都市名を入力..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchQuery(value)
                }}
                className={`w-full px-4 py-2 pr-10 rounded-xl border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${inputClass}`}
              />
              <Search size={18} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isLiquidGlass ? 'text-white/40' : 'text-gray-400'}`} />
            </div>
          </div>
          
          {cities && cities.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              <div className={`text-xs mb-2 ${isLiquidGlass ? 'text-white/40' : 'text-gray-400'}`}>
                {cities.length}件の結果
              </div>
              {cities.map((city, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(city.name)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${buttonClass}`}
                >
                  <div className={`font-medium ${isLiquidGlass ? 'text-white' : 'text-gray-800'}`}>
                    {city.name}
                  </div>
                  <div className={`text-sm ${isLiquidGlass ? 'text-white/60' : 'text-gray-600'}`}>
                    {city.state ? `${city.state}, ` : ''}{city.country}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {searchQuery.length >= 2 && cities && cities.length === 0 && !isSearching && (
            <div className={`text-center py-8 ${isLiquidGlass ? 'text-white/60' : 'text-gray-500'}`}>
              「{searchQuery}」に該当する都市が見つかりません
            </div>
          )}
          
          {isSearching && (
            <div className={`text-center py-8 ${isLiquidGlass ? 'text-white/60' : 'text-gray-500'}`}>
              検索中...
            </div>
          )}
          
          {searchError && (
            <div className={`text-center py-8 ${isLiquidGlass ? 'text-red-300' : 'text-red-500'}`}>
              検索エラー: {(searchError as Error).message}
            </div>
          )}
        </>
      )
    }
    
    // Display Tab Content
    if (activeTab === 'display') {
      return (
        <>
          <div className={`text-sm font-medium mb-4 ${labelClass}`}>
            表示項目を選択
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {weatherItems.map(({ key, label, icon: Icon }) => (
              <div key={key} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${buttonClass}`}>
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isLiquidGlass ? 'text-white/60' : 'text-gray-600'} />
                  <span className={`text-sm font-medium ${labelClass}`}>
                    {label}
                  </span>
                </div>
                <button
                  onClick={() => handleDisplayOptionChange(key, !currentDisplayOptions[key])}
                  className={`w-10 h-5 rounded-full transition-all duration-300 relative ${
                    currentDisplayOptions[key]
                      ? 'bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg'
                      : isLiquidGlass ? 'bg-white/20' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-lg ${
                      currentDisplayOptions[key]
                        ? 'translate-x-5'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </>
      )
    }
    
    // Font Tab Content
    if (activeTab === 'font') {
      return (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`text-sm font-medium ${labelClass}`}>
                文字サイズ自動調整
              </div>
              <button
                onClick={() => handleAutoFontSizeToggle(!isAutoFontSizeEnabled)}
                className={`w-10 h-5 rounded-full transition-all duration-300 relative ${
                  isAutoFontSizeEnabled
                    ? 'bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg'
                    : isLiquidGlass ? 'bg-white/20' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-lg ${
                    isAutoFontSizeEnabled
                      ? 'translate-x-5'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            {isAutoFontSizeEnabled ? (
              <div className="space-y-2">
                <div className={`text-sm ${isLiquidGlass ? 'text-white/60' : 'text-gray-600'}`}>
                  自動計算された文字サイズ:
                </div>
                <div className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>
                  メイン: {effectiveFontSizes.primary}px
                </div>
                <div className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>
                  セカンダリ: {effectiveFontSizes.secondary}px
                </div>
                <div className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>
                  サード: {effectiveFontSizes.tertiary}px
                </div>
                <div className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>
                  詳細: {effectiveFontSizes.details}px
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`text-sm ${isLiquidGlass ? 'text-white/60' : 'text-gray-600'}`}>
                  手動フォントサイズ調整:
                </div>
                
                {/* Primary Font Size */}
                <div className="space-y-2">
                  <div className={`text-sm font-medium ${labelClass}`}>
                    メインテキスト: {manualFontSizes.primary}px
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="128"
                    value={manualFontSizes.primary}
                    onChange={(e) => handleManualFontSizeChange('primary', parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      isLiquidGlass 
                        ? 'bg-white/20 slider-thumb-liquid-glass' 
                        : 'bg-gray-300 slider-thumb-material'
                    }`}
                  />
                </div>

                {/* Secondary Font Size */}
                <div className="space-y-2">
                  <div className={`text-sm font-medium ${labelClass}`}>
                    セカンダリテキスト: {manualFontSizes.secondary}px
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    value={manualFontSizes.secondary}
                    onChange={(e) => handleManualFontSizeChange('secondary', parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      isLiquidGlass 
                        ? 'bg-white/20 slider-thumb-liquid-glass' 
                        : 'bg-gray-300 slider-thumb-material'
                    }`}
                  />
                </div>

                {/* Tertiary Font Size */}
                <div className="space-y-2">
                  <div className={`text-sm font-medium ${labelClass}`}>
                    サードテキスト: {manualFontSizes.tertiary}px
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="36"
                    value={manualFontSizes.tertiary}
                    onChange={(e) => handleManualFontSizeChange('tertiary', parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      isLiquidGlass 
                        ? 'bg-white/20 slider-thumb-liquid-glass' 
                        : 'bg-gray-300 slider-thumb-material'
                    }`}
                  />
                </div>

                {/* Details Font Size */}
                <div className="space-y-2">
                  <div className={`text-sm font-medium ${labelClass}`}>
                    詳細テキスト: {manualFontSizes.details}px
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="24"
                    value={manualFontSizes.details}
                    onChange={(e) => handleManualFontSizeChange('details', parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      isLiquidGlass 
                        ? 'bg-white/20 slider-thumb-liquid-glass' 
                        : 'bg-gray-300 slider-thumb-material'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )
    }
    
    return null
  }
  
  // Define tabs for the settings modal
  const settingsTabs = [
    { id: 'location', label: '地点' },
    { id: 'display', label: '表示項目' },
    { id: 'font', label: 'フォント' }
  ]
  
  // Handle layout editing button
  const handleLayoutEditing = () => {
    setIsSettingsOpen(false)
    setIsLayoutEditing(true)
  }

  if (isLoading) {
    return (
      <>
        <WidgetTemplate
          icon={Cloud}
          title="天気"
          onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-lg text-white/80 mt-4">読み込み中...</p>
          </div>
        </WidgetTemplate>
        
        {!isGlobalSettingsMode && isSettingsOpen && (
          <WidgetSettingsModal
            title="天気設定"
            icon={Cloud}
            onClose={() => setIsSettingsOpen(false)}
            position="contained"
            width="md"
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'location' | 'display' | 'font')}
          >
            {renderSettingsContent()}
            {activeTab === 'display' && (
              <div className="mt-4">
                <button
                  onClick={handleLayoutEditing}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                    isLiquidGlass
                      ? 'bg-green-400/10 border-green-400/20 text-green-300 hover:bg-green-400/20'
                      : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                  }`}
                >
                  レイアウト編集
                </button>
              </div>
            )}
          </WidgetSettingsModal>
        )}
      </>
    )
  }

  if (error) {
    const is404Error = (error as any).statusCode === 404
    
    return (
      <>
        <WidgetTemplate
          icon={Cloud}
          title="天気"
          onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
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
        
        {!isGlobalSettingsMode && isSettingsOpen && (
          <WidgetSettingsModal
            title="天気設定"
            icon={Cloud}
            onClose={() => setIsSettingsOpen(false)}
            position="contained"
            width="md"
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'location' | 'display' | 'font')}
          >
            {renderSettingsContent()}
            {activeTab === 'display' && (
              <div className="mt-4">
                <button
                  onClick={handleLayoutEditing}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                    isLiquidGlass
                      ? 'bg-green-400/10 border-green-400/20 text-green-300 hover:bg-green-400/20'
                      : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                  }`}
                >
                  レイアウト編集
                </button>
              </div>
            )}
          </WidgetSettingsModal>
        )}
      </>
    )
  }

  if (!weather) return null

  const IconComponent = weatherIcons[weather.current.icon as keyof typeof weatherIcons] || weatherIcons.default

  return (
    <>
      <WidgetTemplate
        icon={IconComponent}
        title="天気"
        onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        footer={`最終更新: ${new Date(weather.lastUpdated).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`}
      >
      <div ref={containerRef} className="space-y-4 h-full flex flex-col justify-center">
        {/* Dynamic Layout - Primary Display */}
        {(currentLayoutConfig.primary && currentLayoutConfig.primary !== 'none') || isLayoutEditing ? (
          <div
            className={isLayoutEditing ? 'text-center p-3 rounded-xl border-2 border-blue-400 cursor-pointer bg-blue-400/10 hover:bg-blue-400/20 transition-all duration-200 relative z-10' : 'text-center'}
            onClick={isLayoutEditing ? (e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedLayoutArea('primary')
            } : undefined}
          >
            {(() => {
              switch (currentLayoutConfig.primary) {
                case 'temperature':
                  return <div className="font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>{weather.current.temperature}°C</div>
                case 'feelsLike':
                  return <div className="font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>体感 {weather.current.feelsLike}°C</div>
                case 'tempMinMax':
                  return <div className="font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>{weather.current.tempMin}°C / {weather.current.tempMax}°C</div>
                case 'description':
                  return <div className="font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>{weather.current.description}</div>
                case 'location':
                  return <div className="font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>{weather.location}</div>
                case 'humidity':
                  return <div className="font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>{weather.current.humidity}%</div>
                case 'windSpeed':
                  return <div className="font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>{weather.current.windSpeed}m/s</div>
                case 'precipitationProbability':
                  return <div className="font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>{weather.current.precipitationProbability}%</div>
                case 'rainPeriods':
                  return weather.current.rainPeriods && weather.current.rainPeriods.length > 0 ? (
                    <div className="text-center font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>
                      {weather.current.rainPeriods.map((period, index) => (
                        <div key={index}>
                          {period.start}〜{period.end} ({period.probability}%)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center font-bold leading-tight" style={{fontSize: `${effectiveFontSizes.primary}px`}}>
                      なし
                    </div>
                  )
              default:
                return isLayoutEditing ? (
                  <div className="text-blue-300 font-medium" style={{fontSize: `${effectiveFontSizes.primary}px`}}>
                    📍 プライマリエリア
                    <div className="text-sm text-blue-200/80 mt-1">タップして項目を選択</div>
                  </div>
                ) : null
              }
            })()}
          </div>
        ) : null}

        {/* Dynamic Layout - Secondary Display */}
        {(currentLayoutConfig.secondary && currentLayoutConfig.secondary !== 'none') || isLayoutEditing ? (
          <div
            className={isLayoutEditing ? 'text-center p-3 rounded-xl border-2 border-green-400 cursor-pointer bg-green-400/10 hover:bg-green-400/20 transition-all duration-200 relative z-10' : 'text-center'}
            onClick={isLayoutEditing ? (e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedLayoutArea('secondary')
            } : undefined}
          >
            {(() => {
              switch (currentLayoutConfig.secondary) {
                case 'temperature':
                  return <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>{weather.current.temperature}°C</div>
                case 'feelsLike':
                  return <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>体感 {weather.current.feelsLike}°C</div>
                case 'tempMinMax':
                  return <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>{weather.current.tempMin}°C / {weather.current.tempMax}°C</div>
                case 'description':
                  return <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>{weather.current.description}</div>
                case 'location':
                  return <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>{weather.location}</div>
                case 'humidity':
                  return <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>湿度 {weather.current.humidity}%</div>
                case 'windSpeed':
                  return <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>風速 {weather.current.windSpeed}m/s</div>
                case 'precipitationProbability':
                  return <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>降水確率 {weather.current.precipitationProbability}%</div>
                case 'rainPeriods':
                  return weather.current.rainPeriods && weather.current.rainPeriods.length > 0 ? (
                    <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>
                      {weather.current.rainPeriods.map((period, index) => (
                        <div key={index}>
                          {period.start}〜{period.end} ({period.probability}%)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/80 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>なし</div>
                  )
              default:
                return isLayoutEditing ? (
                  <div className="text-green-300 font-medium" style={{fontSize: `${effectiveFontSizes.secondary}px`}}>
                    📍 セカンダリエリア
                    <div className="text-sm text-green-200/80 mt-1">タップして項目を選択</div>
                  </div>
                ) : null
              }
            })()}
          </div>
        ) : null}

        {/* Dynamic Layout - Tertiary Display */}
        {(currentLayoutConfig.tertiary && currentLayoutConfig.tertiary !== 'none') || isLayoutEditing ? (
          <div
            className={isLayoutEditing ? 'text-center p-3 rounded-xl border-2 border-purple-400 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20 transition-all duration-200 relative z-10' : 'text-center'}
            onClick={isLayoutEditing ? (e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedLayoutArea('tertiary')
            } : undefined}
          >
            {(() => {
              switch (currentLayoutConfig.tertiary) {
                case 'temperature':
                  return <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>{weather.current.temperature}°C</div>
                case 'feelsLike':
                  return <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>体感 {weather.current.feelsLike}°C</div>
                case 'tempMinMax':
                  return <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>{weather.current.tempMin}°C / {weather.current.tempMax}°C</div>
                case 'description':
                  return <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>{weather.current.description}</div>
                case 'location':
                  return <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>{weather.location}</div>
                case 'humidity':
                  return <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>湿度 {weather.current.humidity}%</div>
                case 'windSpeed':
                  return <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>風速 {weather.current.windSpeed}m/s</div>
                case 'precipitationProbability':
                  return <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>降水確率 {weather.current.precipitationProbability}%</div>
                case 'rainPeriods':
                  return weather.current.rainPeriods && weather.current.rainPeriods.length > 0 ? (
                    <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>
                      {weather.current.rainPeriods.map((period, index) => (
                        <div key={index}>
                          {period.start}〜{period.end} ({period.probability}%)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>なし</div>
                  )
              default:
                return isLayoutEditing ? (
                  <div className="text-purple-300 font-medium" style={{fontSize: `${effectiveFontSizes.tertiary}px`}}>
                    📍 サードエリア
                    <div className="text-sm text-purple-200/80 mt-1">タップして項目を選択</div>
                  </div>
                ) : null
              }
            })()}
          </div>
        ) : null}

        {/* Dynamic Layout - Details Grid */}
        {Object.entries(currentDisplayOptions).some(([key, value]) => 
          value && !['temperature', 'description', 'location'].includes(key)) && (
          <div className="grid grid-cols-2 gap-2" style={{fontSize: `${effectiveFontSizes.details}px`}}>
            {weatherItems.map(({ key: itemKey, icon: IconComponent }) => {
              if (!currentDisplayOptions[itemKey]) return null
              // プライマリ、セカンダリ、サードエリアに表示される項目は除外
              if ([currentLayoutConfig.primary, currentLayoutConfig.secondary, currentLayoutConfig.tertiary].includes(itemKey)) return null
              
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
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">突風 {weather.current.windGust > 0 ? `${weather.current.windGust}m/s` : 'なし'}</span>
                    </div>
                  )
                case 'visibility':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">視界 {weather.current.visibility > 0 ? `${weather.current.visibility}km` : 'なし'}</span>
                    </div>
                  )
                case 'cloudiness':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">雲量 {weather.current.cloudiness}%</span>
                    </div>
                  )
                case 'sunrise':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">日出 {weather.current.sunrise || 'なし'}</span>
                    </div>
                  )
                case 'sunset':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">日入 {weather.current.sunset || 'なし'}</span>
                    </div>
                  )
                case 'uvIndex':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">UV指数 {weather.current.uvIndex > 0 ? weather.current.uvIndex : 'なし'}</span>
                    </div>
                  )
                case 'precipitationProbability':
                  return (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">降水確率 {weather.current.precipitationProbability}%</span>
                    </div>
                  )
                case 'rainPeriods':
                  return weather.current.rainPeriods && weather.current.rainPeriods.length > 0 ? (
                    <div key={itemKey} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <IconComponent size={14} className="text-white/60" />
                        <span className="text-white/80">雨の時間帯</span>
                      </div>
                      <div className="text-xs text-white/60 ml-5">
                        {weather.current.rainPeriods.map((period, index) => (
                          <div key={index}>
                            {period.start}〜{period.end} ({period.probability}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div key={itemKey} className="flex items-center gap-2">
                      <IconComponent size={14} className="text-white/60" />
                      <span className="text-white/80">雨の時間帯なし</span>
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
        <div className="absolute top-2 right-2 z-20 flex gap-2">
          <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium">
            レイアウト編集中
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsLayoutEditing(false)
            }}
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 hover:text-red-200 transition-all duration-200"
            title="編集を終了"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isLayoutEditing && selectedLayoutArea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-black/90 via-black/80 to-black/90 border-2 border-white/30 rounded-2xl p-6 max-w-sm w-full max-h-96 overflow-y-auto shadow-2xl">
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
      
      {!isGlobalSettingsMode && isSettingsOpen && (
        <WidgetSettingsModal
          title="天気設定"
          icon={Cloud}
          onClose={() => setIsSettingsOpen(false)}
          position="contained"
          width="md"
          tabs={settingsTabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'location' | 'display' | 'font')}
        >
          {renderSettingsContent()}
          <div className="mt-4">
            <button
              onClick={handleLayoutEditing}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                isLiquidGlass
                  ? 'bg-green-400/10 border-green-400/20 text-green-300 hover:bg-green-400/20'
                  : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
              }`}
            >
              レイアウト編集
            </button>
          </div>
        </WidgetSettingsModal>
      )}
    </>
  )
}