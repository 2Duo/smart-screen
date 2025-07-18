import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, ExternalLink, User, ArrowRight } from 'lucide-react'
import type { CalendarData, CalendarEvent, APIResponse } from '../../../../shared/types'
import { useWidgetStore } from '../../stores/widgetStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { WidgetTemplate } from './WidgetTemplate'
import { WidgetSettingsModal } from '../WidgetSettingsModal'
import { useMultiAutoFontSize } from '../../utils/autoFontSize'
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from 'date-fns'
import { ja } from 'date-fns/locale'

interface CalendarProWidgetProps {
  maxEvents?: number
  layoutConfig?: any
  displayOptions?: any
  widgetId?: string
  isGlobalSettingsMode?: boolean
}

export default function CalendarProWidget({ 
  maxEvents: propMaxEvents,
  layoutConfig: propLayoutConfig,
  displayOptions: propDisplayOptions,
  widgetId,
  isGlobalSettingsMode = false
}: CalendarProWidgetProps) {
  const { updateWidget, getWidget } = useWidgetStore()
  const { settings } = useSettingsStore()
  const widget = widgetId ? getWidget(widgetId) : null
  const uiStyle = settings?.appearance?.uiStyle || 'liquid-glass'
  const isLiquidGlass = uiStyle === 'liquid-glass'
  const currentMaxEvents = propMaxEvents || widget?.config?.maxEvents || 5
  const currentDaysPeriod = widget?.config?.daysPeriod || 7
  const currentUpcomingCount = widget?.config?.upcomingCount || 3
  const currentLayoutConfig = propLayoutConfig || widget?.config?.layoutConfig || {
    primary: 'nextEventTitle',
    secondary: 'nextEventTime',
    tertiary: 'nextEventLocation',
    details: ['upcomingEvents', 'todayEvents'],
  }
  const currentDisplayOptions = propDisplayOptions || widget?.config?.displayOptions || {
    nextEventTitle: true,
    nextEventTime: true,
    nextEventLocation: true,
    secondNextEventTitle: false,
    secondNextEventTime: false,
    upcomingEvents: true,
    todayEvents: true,
    tomorrowEvents: true,
    eventCount: true,
  }
  
  // Font size management
  const isAutoFontSizeEnabled = widget?.config?.autoFontSize ?? settings?.appearance?.autoFontSize ?? false
  const [containerRef, fontSizes] = useMultiAutoFontSize(isAutoFontSizeEnabled, widget?.config?.fontSize)
  
  const manualFontSizes = {
    primary: widget?.config?.manualFontSizes?.primary ?? 48,
    secondary: widget?.config?.manualFontSizes?.secondary ?? 32,
    tertiary: widget?.config?.manualFontSizes?.tertiary ?? 24,
    details: widget?.config?.manualFontSizes?.details ?? 16
  }
  
  const effectiveFontSizes = isAutoFontSizeEnabled ? fontSizes : manualFontSizes
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'auth' | 'display' | 'font'>('auth')
  
  // Local state for settings that need to be saved
  const [localDaysPeriod, setLocalDaysPeriod] = useState(currentDaysPeriod)
  const [localMaxEvents, setLocalMaxEvents] = useState(currentMaxEvents)
  const [localUpcomingCount, setLocalUpcomingCount] = useState(currentUpcomingCount)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Calendar status query
  const { data: calendarStatus } = useQuery({
    queryKey: ['calendar-status'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/status')
      const result: APIResponse<{ isAuthenticated: boolean }> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch calendar status')
      }
      
      return result.data!
    },
    refetchInterval: 60000,
  })

  // Calendar events query
  const { data: calendarData, isLoading, error, refetch } = useQuery<CalendarData>({
    queryKey: ['calendar-events', widgetId, currentDaysPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/calendar/events?days=${currentDaysPeriod}`)
      const result: APIResponse<CalendarData> = await response.json()
      
      if (!result.success) {
        if (response.status === 401) {
          const authResponse = await fetch('/api/calendar/auth')
          const authResult: APIResponse<{ authUrl: string }> = await authResponse.json()
          
          if (authResult.success) {
            return {
              events: [],
              nextWeekEvents: [],
              lastUpdated: new Date().toISOString(),
              isAuthenticated: false,
              authUrl: authResult.data!.authUrl
            }
          }
        }
        throw new Error(result.error || 'Failed to fetch calendar events')
      }
      
      return result.data!
    },
    enabled: calendarStatus?.isAuthenticated === true,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  })

  const handleAuthenticate = async () => {
    try {
      const response = await fetch('/api/calendar/auth')
      const result: APIResponse<{ authUrl: string }> = await response.json()
      
      if (result.success && result.data?.authUrl) {
        const authWindow = window.open(
          result.data.authUrl, 
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )
        
        if (authWindow) {
          const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'calendar-auth') {
              if (event.data.closeWindow && authWindow && !authWindow.closed) {
                try {
                  authWindow.close()
                } catch (e) {
                  console.warn('Could not close auth window:', e)
                }
              }
              
              window.removeEventListener('message', handleMessage)
              
              if (event.data.success) {
                setTimeout(() => {
                  window.location.reload()
                }, 500)
              } else {
                console.error('Authentication failed:', event.data.error)
                alert(`認証に失敗しました: ${event.data.error || 'Unknown error'}`)
              }
            }
          }
          
          window.addEventListener('message', handleMessage)
          
          const checkClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkClosed)
              window.removeEventListener('message', handleMessage)
              setTimeout(() => {
                window.location.reload()
              }, 1000)
            }
          }, 1000)
          
          setTimeout(() => {
            if (authWindow && !authWindow.closed) {
              try {
                authWindow.close()
                console.log('Auth window closed via timeout fallback')
              } catch (e) {
                console.warn('Could not close auth window via timeout:', e)
              }
            }
          }, 5000)
        }
      } else {
        console.error('Failed to get auth URL:', result.error)
        if (result.error?.includes('credentials not configured')) {
          alert('Google Calendar APIの設定が完了していません。環境変数を確認してください。')
        } else {
          alert(`認証に失敗しました: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Error getting auth URL:', error)
      alert('認証URLの取得中にエラーが発生しました。サーバーが起動していることを確認してください。')
    }
  }

  const handleDisplayOptionChange = (option: string, value: boolean) => {
    if (widgetId) {
      const newDisplayOptions = { ...currentDisplayOptions, [option]: value }
      updateWidget(widgetId, { ...widget?.config, displayOptions: newDisplayOptions })
    }
  }

  const handleMaxEventsChange = (newMaxEvents: number) => {
    setLocalMaxEvents(newMaxEvents)
    setHasUnsavedChanges(true)
  }

  const handleDaysPeriodChange = (newDaysPeriod: number) => {
    setLocalDaysPeriod(newDaysPeriod)
    setHasUnsavedChanges(true)
  }

  const handleUpcomingCountChange = (newUpcomingCount: number) => {
    setLocalUpcomingCount(newUpcomingCount)
    setHasUnsavedChanges(true)
  }

  const handleSaveSettings = () => {
    if (widgetId) {
      updateWidget(widgetId, { 
        ...widget?.config, 
        maxEvents: localMaxEvents,
        daysPeriod: localDaysPeriod,
        upcomingCount: localUpcomingCount
      })
      setHasUnsavedChanges(false)
    }
  }

  const handleAutoFontSizeToggle = (enabled: boolean) => {
    if (widgetId) {
      updateWidget(widgetId, { ...widget?.config, autoFontSize: enabled })
    }
  }

  const handleManualFontSizeChange = (type: 'primary' | 'secondary' | 'tertiary' | 'details', size: number) => {
    if (widgetId) {
      const newManualFontSizes = { ...manualFontSizes, [type]: size }
      updateWidget(widgetId, { ...widget?.config, manualFontSizes: newManualFontSizes })
    }
  }

  // Enhanced helper functions
  const getNextEvent = (events: CalendarEvent[]): CalendarEvent | null => {
    const now = new Date()
    return events.find(event => parseISO(event.start) > now) || null
  }

  const getNextEvents = (events: CalendarEvent[], count: number): CalendarEvent[] => {
    const now = new Date()
    return events.filter(event => parseISO(event.start) > now).slice(0, count)
  }

  const getSecondNextEvent = (events: CalendarEvent[]): CalendarEvent | null => {
    const nextEvents = getNextEvents(events, 2)
    return nextEvents.length > 1 ? nextEvents[1] : null
  }

  const getUpcomingEvents = (events: CalendarEvent[], count: number): CalendarEvent[] => {
    return getNextEvents(events, count)
  }

  const getTodayEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.filter(event => isToday(parseISO(event.start)))
  }

  const getTomorrowEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.filter(event => isTomorrow(parseISO(event.start)))
  }

  const formatEventTime = (event: CalendarEvent): string => {
    const start = parseISO(event.start)
    const end = parseISO(event.end)
    
    if (event.isAllDay) {
      return '終日'
    }
    
    const startTime = format(start, 'HH:mm', { locale: ja })
    const endTime = format(end, 'HH:mm', { locale: ja })
    
    return `${startTime} - ${endTime}`
  }

  const formatEventDate = (event: CalendarEvent): string => {
    const start = parseISO(event.start)
    
    if (isToday(start)) {
      return '今日'
    } else if (isTomorrow(start)) {
      return '明日'
    } else {
      return format(start, 'M月d日(E)', { locale: ja })
    }
  }

  const getTimeUntilEvent = (event: CalendarEvent): string => {
    const now = new Date()
    const eventStart = parseISO(event.start)
    const minutesUntil = differenceInMinutes(eventStart, now)
    
    if (minutesUntil < 0) {
      return '進行中'
    } else if (minutesUntil < 60) {
      return `${minutesUntil}分後`
    } else if (minutesUntil < 1440) {
      const hours = Math.floor(minutesUntil / 60)
      return `${hours}時間後`
    } else {
      const days = Math.floor(minutesUntil / 1440)
      return `${days}日後`
    }
  }

  // Enhanced calendar items for layout selection
  const calendarItems = [
    { key: 'nextEventTitle', label: '次の予定タイトル', icon: Calendar },
    { key: 'nextEventTime', label: '次の予定時間', icon: Clock },
    { key: 'nextEventLocation', label: '次の予定場所', icon: MapPin },
    { key: 'secondNextEventTitle', label: '2番目の予定タイトル', icon: Calendar },
    { key: 'secondNextEventTime', label: '2番目の予定時間', icon: Clock },
    { key: 'upcomingEvents', label: '今後の予定リスト', icon: ArrowRight },
    { key: 'todayEvents', label: '今日の予定', icon: Calendar },
    { key: 'tomorrowEvents', label: '明日の予定', icon: Calendar },
    { key: 'eventCount', label: '予定数', icon: Calendar },
  ]

  const tabs = [
    { id: 'auth', label: '認証' },
    { id: 'display', label: '表示設定' },
    { id: 'font', label: 'フォント' }
  ]

  const renderSettingsContent = () => {
    const labelClass = isLiquidGlass 
      ? 'text-white/80' 
      : 'text-gray-700'
    
    const valueDisplayClass = isLiquidGlass
      ? 'text-white/90 bg-gradient-to-r from-blue-400/20 to-purple-400/20 border border-white/20'
      : 'text-gray-800 bg-blue-50 border border-blue-200'
    
    const sliderClass = isLiquidGlass
      ? 'w-full h-3 bg-gradient-to-r from-white/10 to-white/20 rounded-2xl appearance-none cursor-pointer slider backdrop-blur-xl'
      : 'w-full h-3 bg-gray-200 rounded-2xl appearance-none cursor-pointer slider'
    
    const scaleLabelsClass = isLiquidGlass
      ? 'text-white/60'
      : 'text-gray-500'

    const toggleClass = isLiquidGlass
      ? 'bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10 backdrop-blur-xl'
      : 'bg-gray-50 rounded-xl border border-gray-200'

    if (activeTab === 'auth') {
      return (
        <div className="space-y-4">
          <div className="mb-5">
            <p className={`text-sm font-medium mb-3 ${labelClass}`}>
              認証状態: <span className={`px-3 py-1 rounded-xl font-medium ${
                calendarStatus?.isAuthenticated 
                  ? 'text-green-300 bg-green-400/20' 
                  : 'text-red-300 bg-red-400/20'
              }`}>
                {calendarStatus?.isAuthenticated ? '認証済み' : '未認証'}
              </span>
            </p>
            
            {!calendarStatus?.isAuthenticated && (
              <div className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/20 rounded-xl p-4">
                <p className="text-yellow-300 text-sm mb-3">
                  Googleカレンダーにアクセスするには認証が必要です
                </p>
                <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-3 mb-3">
                  <p className="text-blue-300 text-xs mb-2">
                    ⚠️ 初回認証時の注意事項
                  </p>
                  <ul className="text-blue-200 text-xs space-y-1">
                    <li>• アプリが「テスト中」と表示される場合があります</li>
                    <li>• その場合は「詳細設定」→「Smart Screen（安全ではないページ）に移動」をクリック</li>
                    <li>• または開発者にテストユーザーとして追加を依頼してください</li>
                  </ul>
                </div>
                <button
                  onClick={handleAuthenticate}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium"
                >
                  <User size={16} />
                  Googleでログイン
                  <ExternalLink size={14} />
                </button>
              </div>
            )}
            
            {calendarStatus?.isAuthenticated && (
              <div className="bg-gradient-to-r from-green-400/10 to-blue-400/10 border border-green-400/20 rounded-xl p-4">
                <p className="text-green-300 text-sm mb-2">
                  Googleカレンダーと連携済み
                </p>
                <p className={`text-xs ${isLiquidGlass ? 'text-white/60' : 'text-gray-600'}`}>
                  カレンダーの予定を自動的に表示します
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (activeTab === 'display') {
      return (
        <div className="space-y-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-medium ${labelClass}`}>表示期間</p>
              <span className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>{localDaysPeriod}日間</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={localDaysPeriod}
              onChange={(e) => handleDaysPeriodChange(parseInt(e.target.value))}
              className={sliderClass}
            />
            <div className={`flex justify-between text-sm mt-3 px-1 ${scaleLabelsClass}`}>
              <span>1日</span>
              <span>1週間</span>
              <span>2週間</span>
              <span>1ヶ月</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-medium ${labelClass}`}>最大表示数</p>
              <span className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>{localMaxEvents}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={localMaxEvents}
              onChange={(e) => handleMaxEventsChange(parseInt(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-medium ${labelClass}`}>今後の予定表示数</p>
              <span className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>{localUpcomingCount}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={localUpcomingCount}
              onChange={(e) => handleUpcomingCountChange(parseInt(e.target.value))}
              className={sliderClass}
            />
          </div>

          <div className="space-y-3">
            <h4 className={`text-sm font-medium ${labelClass}`}>表示項目</h4>
            {calendarItems.map(({ key, label, icon: Icon }) => (
              <div key={key} className={`flex items-center justify-between p-3 ${toggleClass}`}>
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isLiquidGlass ? 'text-white/60' : 'text-gray-600'} />
                  <span className={`text-sm font-medium ${labelClass}`}>{label}</span>
                </div>
                <button
                  onClick={() => handleDisplayOptionChange(key, !currentDisplayOptions[key])}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                    currentDisplayOptions[key]
                      ? 'bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg'
                      : isLiquidGlass ? 'bg-white/20' : 'bg-gray-300'
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

          {/* Save Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleSaveSettings}
              disabled={!hasUnsavedChanges}
              className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                  : 'bg-gray-500/30 text-white/50 cursor-not-allowed'
              }`}
            >
              {hasUnsavedChanges ? '設定を保存' : '保存済み'}
            </button>
          </div>
        </div>
      )
    }

    if (activeTab === 'font') {
      return (
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-3 ${toggleClass}`}>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${labelClass}`}>文字サイズ自動調整</span>
            </div>
            <button
              onClick={() => handleAutoFontSizeToggle(!isAutoFontSizeEnabled)}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                isAutoFontSizeEnabled
                  ? 'bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg'
                  : isLiquidGlass ? 'bg-white/20' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-lg ${
                  isAutoFontSizeEnabled
                    ? 'translate-x-6'
                    : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {!isAutoFontSizeEnabled && (
            <div className="space-y-4">
              <div className={`text-sm font-medium ${labelClass}`}>
                手動フォントサイズ調整:
              </div>
              
              {/* Primary Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-medium ${labelClass}`}>
                    メインテキスト
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>{manualFontSizes.primary}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="128"
                  step="1"
                  value={manualFontSizes.primary}
                  onChange={(e) => handleManualFontSizeChange('primary', parseInt(e.target.value))}
                  className={sliderClass}
                />
              </div>

              {/* Secondary Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-medium ${labelClass}`}>
                    セカンダリテキスト
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>{manualFontSizes.secondary}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="48"
                  step="1"
                  value={manualFontSizes.secondary}
                  onChange={(e) => handleManualFontSizeChange('secondary', parseInt(e.target.value))}
                  className={sliderClass}
                />
              </div>

              {/* Tertiary Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-medium ${labelClass}`}>
                    ターシャリテキスト
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>{manualFontSizes.tertiary}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="36"
                  step="1"
                  value={manualFontSizes.tertiary}
                  onChange={(e) => handleManualFontSizeChange('tertiary', parseInt(e.target.value))}
                  className={sliderClass}
                />
              </div>

              {/* Details Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-medium ${labelClass}`}>
                    詳細テキスト
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>{manualFontSizes.details}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="24"
                  step="1"
                  value={manualFontSizes.details}
                  onChange={(e) => handleManualFontSizeChange('details', parseInt(e.target.value))}
                  className={sliderClass}
                />
              </div>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  const renderTitle = () => (
    <div className="flex items-center gap-2">
      <span>カレンダー Pro</span>
      <div className={`w-2 h-2 rounded-full ${
        calendarStatus?.isAuthenticated 
          ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
          : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
      }`} />
    </div>
  )

  if (isLoading) {
    return (
      <>
        <WidgetTemplate
          icon={Calendar}
          title={renderTitle()}
          onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-lg text-white/80 mt-4">読み込み中...</p>
          </div>
        </WidgetTemplate>
        
        {!isGlobalSettingsMode && isSettingsOpen && (
          <WidgetSettingsModal
            title="カレンダー Pro 設定"
            icon={Calendar}
            onClose={() => setIsSettingsOpen(false)}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'auth' | 'display' | 'font')}
            position="contained"
            width="md"
          >
            {renderSettingsContent()}
          </WidgetSettingsModal>
        )}
      </>
    )
  }

  // 初期読み込み中の状態
  if (calendarStatus === undefined) {
    return (
      <>
        <WidgetTemplate
          icon={Calendar}
          title={renderTitle()}
          onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-400/30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-300"></div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xl font-bold text-white">
                認証状態を確認中...
              </p>
              <p className="text-sm text-white/60 leading-relaxed">
                Googleカレンダーとの連携状態を確認しています
              </p>
            </div>
          </div>
        </WidgetTemplate>
        
        {!isGlobalSettingsMode && isSettingsOpen && (
          <WidgetSettingsModal
            title="カレンダー Pro 設定"
            icon={Calendar}
            onClose={() => setIsSettingsOpen(false)}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'auth' | 'display' | 'font')}
            position="contained"
            width="md"
          >
            {renderSettingsContent()}
          </WidgetSettingsModal>
        )}
      </>
    )
  }

  // 認証されていない場合
  if (!calendarStatus?.isAuthenticated) {
    return (
      <>
        <WidgetTemplate
          icon={Calendar}
          title={renderTitle()}
          onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-400/30">
              <User className="text-red-300" size={32} />
            </div>
            
            <div className="space-y-2">
              <p className="text-xl font-bold text-white">
                アカウント未連携
              </p>
              <p className="text-sm text-white/60 leading-relaxed">
                Googleカレンダーと連携されていません
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-400/30 rounded-lg">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-orange-300 font-medium">認証が必要です</span>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-blue-300">
                📅 連携手順
              </p>
              <ol className="text-xs text-blue-200/80 space-y-1 text-left">
                <li>1. 下の「連携する」ボタンをクリック</li>
                <li>2. Googleアカウントでログイン</li>
                <li>3. カレンダーアクセスを許可</li>
                <li>4. 認証完了後、自動的に予定が表示されます</li>
              </ol>
            </div>
            
            <button
              onClick={handleAuthenticate}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium mx-auto shadow-lg"
            >
              <User size={16} />
              Googleカレンダーと連携する
              <ExternalLink size={14} />
            </button>
            
            <div className="text-xs text-white/40 space-y-1">
              <p>連携後、向こう1週間の予定が自動表示されます</p>
              <p>安全なOAuth認証を使用しています</p>
            </div>
          </div>
        </WidgetTemplate>
        
        {!isGlobalSettingsMode && isSettingsOpen && (
          <WidgetSettingsModal
            title="カレンダー Pro 設定"
            icon={Calendar}
            onClose={() => setIsSettingsOpen(false)}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'auth' | 'display' | 'font')}
            position="contained"
            width="md"
          >
            {renderSettingsContent()}
          </WidgetSettingsModal>
        )}
      </>
    )
  }

  if (error) {
    return (
      <>
        <WidgetTemplate
          icon={Calendar}
          title={renderTitle()}
          onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        >
          <div className="text-center">
            <Calendar className="mx-auto mb-4 text-white/60" size={48} />
            <p className="text-xl text-white/80 font-medium mb-2">
              カレンダーを取得できません
            </p>
            <p className="text-base text-white/60 mt-2">
              {(error as any)?.message || 'エラーが発生しました'}
            </p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
            >
              再試行
            </button>
          </div>
        </WidgetTemplate>
        
        {!isGlobalSettingsMode && isSettingsOpen && (
          <WidgetSettingsModal
            title="カレンダー Pro 設定"
            icon={Calendar}
            onClose={() => setIsSettingsOpen(false)}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'auth' | 'display' | 'font')}
            position="contained"
            width="md"
          >
            {renderSettingsContent()}
          </WidgetSettingsModal>
        )}
      </>
    )
  }

  if (!calendarData || !calendarData.events.length) {
    return (
      <>
        <WidgetTemplate
          icon={Calendar}
          title={renderTitle()}
          onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
          footer={calendarData ? `最終更新: ${new Date(calendarData.lastUpdated).toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}` : undefined}
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center border-2 border-gray-400/30">
              <Calendar className="text-gray-300" size={32} />
            </div>
            
            <div className="space-y-2">
              <p className="text-xl font-bold text-white">
                予定なし
              </p>
              <p className="text-sm text-white/60 leading-relaxed">
                向こう{currentDaysPeriod}日間の予定がありません
              </p>
            </div>
          </div>
        </WidgetTemplate>
        
        {!isGlobalSettingsMode && isSettingsOpen && (
          <WidgetSettingsModal
            title="カレンダー Pro 設定"
            icon={Calendar}
            onClose={() => setIsSettingsOpen(false)}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'auth' | 'display' | 'font')}
            position="contained"
            width="md"
          >
            {renderSettingsContent()}
          </WidgetSettingsModal>
        )}
      </>
    )
  }

  const nextEvent = getNextEvent(calendarData.events)
  const secondNextEvent = getSecondNextEvent(calendarData.events)
  const upcomingEvents = getUpcomingEvents(calendarData.events, currentUpcomingCount)
  const todayEvents = getTodayEvents(calendarData.events)
  const tomorrowEvents = getTomorrowEvents(calendarData.events)

  return (
    <>
      <WidgetTemplate
        icon={Calendar}
        title={renderTitle()}
        onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        footer={`最終更新: ${new Date(calendarData.lastUpdated).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`}
      >
        <div ref={containerRef} className="space-y-4">
          {/* Dynamic Layout - Primary Display */}
          {currentLayoutConfig.primary && currentLayoutConfig.primary !== 'none' && currentDisplayOptions[currentLayoutConfig.primary] && (
            <div className="text-center">
              {(() => {
                switch (currentLayoutConfig.primary) {
                  case 'nextEventTitle':
                    return nextEvent ? (
                      <div className="font-bold leading-tight" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>{nextEvent.title}</div>
                    ) : (
                      <div className="font-bold leading-tight text-white/60" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>予定なし</div>
                    )
                  case 'nextEventTime':
                    return nextEvent ? (
                      <div className="font-bold leading-tight" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>
                        {formatEventDate(nextEvent)} {formatEventTime(nextEvent)}
                      </div>
                    ) : (
                      <div className="font-bold leading-tight text-white/60" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>--:--</div>
                    )
                  case 'nextEventLocation':
                    return nextEvent?.location ? (
                      <div className="font-bold leading-tight" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>{nextEvent.location}</div>
                    ) : (
                      <div className="font-bold leading-tight text-white/60" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>場所未設定</div>
                    )
                  case 'secondNextEventTitle':
                    return secondNextEvent ? (
                      <div className="font-bold leading-tight" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>{secondNextEvent.title}</div>
                    ) : (
                      <div className="font-bold leading-tight text-white/60" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>2番目の予定なし</div>
                    )
                  case 'secondNextEventTime':
                    return secondNextEvent ? (
                      <div className="font-bold leading-tight" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>
                        {formatEventDate(secondNextEvent)} {formatEventTime(secondNextEvent)}
                      </div>
                    ) : (
                      <div className="font-bold leading-tight text-white/60" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>--:--</div>
                    )
                  case 'eventCount':
                    return (
                      <div className="font-bold leading-tight" style={{ fontSize: `${effectiveFontSizes.primary}px` }}>
                        {calendarData.events.length}件の予定
                      </div>
                    )
                  default:
                    return null
                }
              })()}
            </div>
          )}

          {/* Dynamic Layout - Secondary Display */}
          {currentLayoutConfig.secondary && currentLayoutConfig.secondary !== 'none' && currentDisplayOptions[currentLayoutConfig.secondary] && (
            <div className="text-center">
              {(() => {
                switch (currentLayoutConfig.secondary) {
                  case 'nextEventTitle':
                    return nextEvent ? (
                      <div className="text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>{nextEvent.title}</div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>予定なし</div>
                    )
                  case 'nextEventTime':
                    return nextEvent ? (
                      <div className="text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>
                        {formatEventDate(nextEvent)} {formatEventTime(nextEvent)}
                      </div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>--:--</div>
                    )
                  case 'nextEventLocation':
                    return nextEvent?.location ? (
                      <div className="text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>{nextEvent.location}</div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>場所未設定</div>
                    )
                  case 'secondNextEventTitle':
                    return secondNextEvent ? (
                      <div className="text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>{secondNextEvent.title}</div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>2番目の予定なし</div>
                    )
                  case 'secondNextEventTime':
                    return secondNextEvent ? (
                      <div className="text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>
                        {formatEventDate(secondNextEvent)} {formatEventTime(secondNextEvent)}
                      </div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>--:--</div>
                    )
                  case 'eventCount':
                    return (
                      <div className="text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.secondary}px` }}>
                        {calendarData.events.length}件の予定
                      </div>
                    )
                  default:
                    return null
                }
              })()}
            </div>
          )}

          {/* Dynamic Layout - Tertiary Display */}
          {currentLayoutConfig.tertiary && currentLayoutConfig.tertiary !== 'none' && currentDisplayOptions[currentLayoutConfig.tertiary] && (
            <div className="text-center">
              {(() => {
                switch (currentLayoutConfig.tertiary) {
                  case 'nextEventTitle':
                    return nextEvent ? (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>{nextEvent.title}</div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>予定なし</div>
                    )
                  case 'nextEventTime':
                    return nextEvent ? (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>
                        {getTimeUntilEvent(nextEvent)} - {formatEventTime(nextEvent)}
                      </div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>--:--</div>
                    )
                  case 'nextEventLocation':
                    return nextEvent?.location ? (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>{nextEvent.location}</div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>場所未設定</div>
                    )
                  case 'secondNextEventTitle':
                    return secondNextEvent ? (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>{secondNextEvent.title}</div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>2番目の予定なし</div>
                    )
                  case 'secondNextEventTime':
                    return secondNextEvent ? (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>
                        {getTimeUntilEvent(secondNextEvent)} - {formatEventTime(secondNextEvent)}
                      </div>
                    ) : (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>--:--</div>
                    )
                  case 'eventCount':
                    return (
                      <div className="text-white/60 font-medium" style={{ fontSize: `${effectiveFontSizes.tertiary}px` }}>
                        {currentDaysPeriod}日間で{calendarData.events.length}件
                      </div>
                    )
                  default:
                    return null
                }
              })()}
            </div>
          )}

          {/* Dynamic Layout - Details List */}
          {currentLayoutConfig.details && currentLayoutConfig.details.length > 0 && (
            <div className="space-y-3">
              {currentLayoutConfig.details.map((itemKey: string) => {
                if (!currentDisplayOptions[itemKey]) return null
                
                switch (itemKey) {
                  case 'upcomingEvents':
                    return upcomingEvents.length > 0 ? (
                      <div key={itemKey} className="space-y-2">
                        <div className="flex items-center gap-2 text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.details}px` }}>
                          <ArrowRight size={14} />
                          今後の予定 ({upcomingEvents.length}件)
                        </div>
                        <div className="space-y-1">
                          {upcomingEvents.map((event, index) => (
                            <div key={event.id} className="flex items-center gap-2 text-white/70 pl-4" style={{ fontSize: `${effectiveFontSizes.details}px` }}>
                              <span className="text-blue-400 text-xs font-medium w-4 text-center">{index + 1}</span>
                              <Clock size={12} className="text-white/50" />
                              <span className="text-white/60">{formatEventDate(event)}</span>
                              <span>{formatEventTime(event)}</span>
                              <span className="flex-1 truncate">{event.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  case 'todayEvents':
                    return todayEvents.length > 0 ? (
                      <div key={itemKey} className="space-y-2">
                        <div className="flex items-center gap-2 text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.details}px` }}>
                          <Calendar size={14} />
                          今日の予定 ({todayEvents.length}件)
                        </div>
                        <div className="space-y-1">
                          {todayEvents.slice(0, currentMaxEvents).map((event) => (
                            <div key={event.id} className="flex items-center gap-2 text-white/70 pl-4" style={{ fontSize: `${effectiveFontSizes.details}px` }}>
                              <Clock size={12} className="text-white/50" />
                              <span>{formatEventTime(event)}</span>
                              <span className="flex-1 truncate">{event.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  case 'tomorrowEvents':
                    return tomorrowEvents.length > 0 ? (
                      <div key={itemKey} className="space-y-2">
                        <div className="flex items-center gap-2 text-white/80 font-medium" style={{ fontSize: `${effectiveFontSizes.details}px` }}>
                          <Calendar size={14} />
                          明日の予定 ({tomorrowEvents.length}件)
                        </div>
                        <div className="space-y-1">
                          {tomorrowEvents.slice(0, currentMaxEvents).map((event) => (
                            <div key={event.id} className="flex items-center gap-2 text-white/70 pl-4" style={{ fontSize: `${effectiveFontSizes.details}px` }}>
                              <Clock size={12} className="text-white/50" />
                              <span>{formatEventTime(event)}</span>
                              <span className="flex-1 truncate">{event.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  case 'eventCount':
                    return (
                      <div key={itemKey} className="flex items-center gap-2 text-white/70" style={{ fontSize: `${effectiveFontSizes.details}px` }}>
                        <Calendar size={14} className="text-white/50" />
                        <span>{currentDaysPeriod}日間で{calendarData.events.length}件の予定</span>
                      </div>
                    )
                  default:
                    return null
                }
              })}
            </div>
          )}
        </div>
      </WidgetTemplate>
      
      {!isGlobalSettingsMode && isSettingsOpen && (
        <WidgetSettingsModal
          title="カレンダー Pro 設定"
          icon={Calendar}
          onClose={() => setIsSettingsOpen(false)}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'auth' | 'display' | 'font')}
          position="contained"
          width="md"
        >
          {renderSettingsContent()}
          <style>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: linear-gradient(135deg, #60a5fa, #a78bfa);
              cursor: pointer;
              border: 2px solid rgba(255, 255, 255, 0.3);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
              transition: all 0.3s ease;
            }
            .slider::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: linear-gradient(135deg, #60a5fa, #a78bfa);
              cursor: pointer;
              border: 2px solid rgba(255, 255, 255, 0.3);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
          `}</style>
        </WidgetSettingsModal>
      )}
    </>
  )
}