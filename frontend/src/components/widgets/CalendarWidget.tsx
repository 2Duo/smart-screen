import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, X, ExternalLink, User } from 'lucide-react'
import type { CalendarData, CalendarEvent, APIResponse } from '../../../../shared/types'
import { useWidgetStore } from '../../stores/widgetStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { WidgetTemplate } from './WidgetTemplate'
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from 'date-fns'
import { ja } from 'date-fns/locale'

interface CalendarWidgetProps {
  maxEvents?: number
  layoutConfig?: any
  displayOptions?: any
  widgetId?: string
  isGlobalSettingsMode?: boolean
}

export default function CalendarWidget({ 
  maxEvents: propMaxEvents,
  layoutConfig: propLayoutConfig,
  displayOptions: propDisplayOptions,
  widgetId,
  isGlobalSettingsMode = false
}: CalendarWidgetProps) {
  const { updateWidget, getWidget } = useWidgetStore()
  const { settings } = useSettingsStore()
  const widget = widgetId ? getWidget(widgetId) : null
  const uiStyle = settings?.appearance?.uiStyle || 'liquid-glass'
  const isLiquidGlass = uiStyle === 'liquid-glass'
  const currentMaxEvents = propMaxEvents || widget?.config?.maxEvents || 5
  const currentDaysPeriod = widget?.config?.daysPeriod || 7
  const currentLayoutConfig = propLayoutConfig || widget?.config?.layoutConfig || {
    primary: 'nextEventTitle',
    secondary: 'nextEventTime',
    tertiary: 'nextEventLocation',
    details: ['todayEvents', 'tomorrowEvents'],
  }
  const currentDisplayOptions = propDisplayOptions || widget?.config?.displayOptions || {
    nextEventTitle: true,
    nextEventTime: true,
    nextEventLocation: true,
    todayEvents: true,
    tomorrowEvents: true,
    eventCount: true,
  }
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'auth' | 'display' | 'layout'>('auth')

  // Calendar status query
  const { data: calendarStatus } = useQuery({
    queryKey: ['calendar-status'],
    queryFn: async () => {
      // Use proxy API path for same-origin requests  
      const response = await fetch('/api/calendar/status')
      const result: APIResponse<{ isAuthenticated: boolean }> = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch calendar status')
      }
      
      return result.data!
    },
    refetchInterval: 60000, // Check every minute
  })

  // Calendar events query
  const { data: calendarData, isLoading, error, refetch } = useQuery<CalendarData>({
    queryKey: ['calendar-events', widgetId, currentDaysPeriod],
    queryFn: async () => {
      // Use proxy API path for same-origin requests
      const response = await fetch(`/api/calendar/events?days=${currentDaysPeriod}`)
      const result: APIResponse<CalendarData> = await response.json()
      
      if (!result.success) {
        if (response.status === 401) {
          // User not authenticated, fetch auth URL
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
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 1,
  })

  const handleAuthenticate = async () => {
    try {
      // Dynamic API base URL - use current host for LAN access
      const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 
        (window.location.hostname === 'localhost' 
          ? `${protocol}://localhost:3001` 
          : `${protocol}://${window.location.hostname}:3001`)
      const response = await fetch('/api/calendar/auth')
      const result: APIResponse<{ authUrl: string }> = await response.json()
      
      if (result.success && result.data?.authUrl) {
        // ポップアップウィンドウで認証ページを開く
        const authWindow = window.open(
          result.data.authUrl, 
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )
        
        if (authWindow) {
          // メッセージイベントリスナーを設定
          const handleMessage = (event: MessageEvent) => {
            // セキュリティ: オリジンをチェック（必要に応じて）
            if (event.data?.type === 'calendar-auth') {
              // If closeWindow is requested, try to close the popup
              if (event.data.closeWindow && authWindow && !authWindow.closed) {
                try {
                  authWindow.close()
                } catch (e) {
                  console.warn('Could not close auth window:', e)
                }
              }
              
              window.removeEventListener('message', handleMessage)
              
              if (event.data.success) {
                // 認証成功：データを再取得
                setTimeout(() => {
                  window.location.reload()
                }, 500)
              } else {
                // 認証失敗：エラーメッセージを表示
                console.error('Authentication failed:', event.data.error)
                alert(`認証に失敗しました: ${event.data.error || 'Unknown error'}`)
              }
            }
          }
          
          window.addEventListener('message', handleMessage)
          
          // フォールバック: ウィンドウが閉じられた場合の処理
          const checkClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkClosed)
              window.removeEventListener('message', handleMessage)
              // 認証状態を再確認（メッセージが来なかった場合）
              setTimeout(() => {
                window.location.reload()
              }, 1000)
            }
          }, 1000)
          
          // Additional fallback: try to close window after 5 seconds if still open
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
    if (widgetId) {
      updateWidget(widgetId, { ...widget?.config, maxEvents: newMaxEvents })
    }
  }

  const handleDaysPeriodChange = (newDaysPeriod: number) => {
    if (widgetId) {
      updateWidget(widgetId, { ...widget?.config, daysPeriod: newDaysPeriod })
    }
  }

  // Helper functions
  const getNextEvent = (events: CalendarEvent[]): CalendarEvent | null => {
    const now = new Date()
    return events.find(event => parseISO(event.start) > now) || null
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

  // Available calendar items for layout selection
  const calendarItems = [
    { key: 'nextEventTitle', label: '次の予定タイトル', icon: Calendar },
    { key: 'nextEventTime', label: '次の予定時間', icon: Clock },
    { key: 'nextEventLocation', label: '次の予定場所', icon: MapPin },
    { key: 'todayEvents', label: '今日の予定', icon: Calendar },
    { key: 'tomorrowEvents', label: '明日の予定', icon: Calendar },
    { key: 'eventCount', label: '予定数', icon: Calendar },
  ]

  const renderSettingsPanel = () => {
    if (!isSettingsOpen || isGlobalSettingsMode) return null
    
    const panelClass = isLiquidGlass 
      ? 'glass-panel' 
      : 'material-panel'
    
    const titleClass = isLiquidGlass 
      ? 'text-white' 
      : 'material-text-primary'
    
    const closeButtonClass = isLiquidGlass
      ? 'group p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-300'
      : 'group p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 transition-all duration-300'
    
    const closeIconClass = isLiquidGlass
      ? 'text-white/70 group-hover:text-white'
      : 'text-gray-600 group-hover:text-gray-800'
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4">
        <div className={`${panelClass} p-5 rounded-2xl max-w-md w-full max-h-[70vh] flex flex-col overflow-hidden shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold tracking-wide ${titleClass}`}>カレンダー設定</h3>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className={closeButtonClass}
          >
            <X size={16} className={`${closeIconClass} transition-colors group-hover:rotate-90`} />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className={`flex gap-2 mb-6 rounded-2xl p-2 flex-shrink-0 ${
          isLiquidGlass 
            ? 'bg-gradient-to-r from-white/10 to-white/15 backdrop-blur-xl border border-white/20'
            : 'bg-gray-100 border border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'auth'
                ? isLiquidGlass
                  ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-white border border-blue-300/30 shadow-lg'
                  : 'bg-blue-100 border border-blue-200 text-blue-700 shadow-md'
                : isLiquidGlass
                  ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            認証
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'display'
                ? isLiquidGlass
                  ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-white border border-blue-300/30 shadow-lg'
                  : 'bg-blue-100 border border-blue-200 text-blue-700 shadow-md'
                : isLiquidGlass
                  ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            表示設定
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'auth' && (
          <div className="space-y-4">
            <div className="mb-5">
              <p className="text-sm text-white/80 font-medium mb-3">
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
                  <p className="text-white/60 text-xs">
                    カレンダーの予定を自動的に表示します
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div className="max-h-48 overflow-y-auto space-y-3">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white/80 font-medium">表示期間</p>
                <span className="text-sm text-white/90 font-medium bg-gradient-to-r from-blue-400/20 to-purple-400/20 px-3 py-1 rounded-xl backdrop-blur-xl border border-white/20">{currentDaysPeriod}日間</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={currentDaysPeriod}
                onChange={(e) => handleDaysPeriodChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-white/10 to-white/20 rounded-xl appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/60 mt-2 px-1">
                <span>1日</span>
                <span>1週間</span>
                <span>2週間</span>
                <span>1ヶ月</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white/80 font-medium">最大表示数</p>
                <span className="text-sm text-white/90 font-medium bg-gradient-to-r from-blue-400/20 to-purple-400/20 px-3 py-1 rounded-xl backdrop-blur-xl border border-white/20">{currentMaxEvents}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={currentMaxEvents}
                onChange={(e) => handleMaxEventsChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-white/10 to-white/20 rounded-xl appearance-none cursor-pointer"
              />
            </div>

            {calendarItems.map(({ key, label, icon: Icon }) => (
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
        </div>
      </div>
    )
  }

  const renderTitle = () => (
    <div className="flex items-center gap-2">
      <span>カレンダー</span>
      <div className={`w-2 h-2 rounded-full ${
        calendarStatus?.isAuthenticated 
          ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
          : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
      }`} />
    </div>
  )

  if (isLoading) {
    return (
      <WidgetTemplate
        icon={Calendar}
        title={renderTitle()}
        onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        settingsPanel={renderSettingsPanel()}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-lg text-white/80 mt-4">読み込み中...</p>
        </div>
      </WidgetTemplate>
    )
  }

  // 初期読み込み中の状態
  if (calendarStatus === undefined) {
    return (
      <WidgetTemplate
        icon={Calendar}
        title={renderTitle()}
        onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        settingsPanel={renderSettingsPanel()}
      >
        <div className="text-center space-y-4">
          {/* Loading Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-400/30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-300"></div>
          </div>
          
          {/* Status Message */}
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
    )
  }

  // 認証されていない場合
  if (!calendarStatus?.isAuthenticated) {
    return (
      <WidgetTemplate
        icon={Calendar}
        title={renderTitle()}
        onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        settingsPanel={renderSettingsPanel()}
      >
        <div className="text-center space-y-4">
          {/* Main Status Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-400/30">
            <User className="text-red-300" size={32} />
          </div>
          
          {/* Status Message */}
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
          
          {/* Connect Instructions */}
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
          
          {/* Connect Button */}
          <button
            onClick={handleAuthenticate}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium mx-auto shadow-lg"
          >
            <User size={16} />
            Googleカレンダーと連携する
            <ExternalLink size={14} />
          </button>
          
          {/* Additional Info */}
          <div className="text-xs text-white/40 space-y-1">
            <p>連携後、向こう1週間の予定が自動表示されます</p>
            <p>安全なOAuth認証を使用しています</p>
          </div>
        </div>
      </WidgetTemplate>
    )
  }

  if (error) {
    return (
      <WidgetTemplate
        icon={Calendar}
        title={renderTitle()}
        onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        settingsPanel={renderSettingsPanel()}
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
    )
  }

  if (!calendarData || !calendarData.events.length) {
    // 認証済みだが予定がない場合の表示
    return (
      <WidgetTemplate
        icon={Calendar}
        title={renderTitle()}
        onSettings={!isGlobalSettingsMode ? () => setIsSettingsOpen(!isSettingsOpen) : undefined}
        settingsPanel={renderSettingsPanel()}
        footer={calendarData ? `最終更新: ${new Date(calendarData.lastUpdated).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}` : undefined}
      >
        <div className="text-center space-y-4">
          {/* No Events Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center border-2 border-gray-400/30">
            <Calendar className="text-gray-300" size={32} />
          </div>
          
          {/* Status Message */}
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
    )
  }

  const nextEvent = getNextEvent(calendarData.events)
  const todayEvents = getTodayEvents(calendarData.events)
  const tomorrowEvents = getTomorrowEvents(calendarData.events)

  return (
    <WidgetTemplate
      icon={Calendar}
      title={renderTitle()}
      onSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      settingsPanel={renderSettingsPanel()}
      footer={`最終更新: ${new Date(calendarData.lastUpdated).toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`}
    >
      <div className="space-y-4">
        {/* Dynamic Layout - Primary Display */}
        {currentLayoutConfig.primary && currentLayoutConfig.primary !== 'none' && currentDisplayOptions[currentLayoutConfig.primary] && (
          <div className="text-center">
            {(() => {
              switch (currentLayoutConfig.primary) {
                case 'nextEventTitle':
                  return nextEvent ? (
                    <div className="text-4xl font-bold leading-tight">{nextEvent.title}</div>
                  ) : (
                    <div className="text-4xl font-bold leading-tight text-white/60">予定なし</div>
                  )
                case 'nextEventTime':
                  return nextEvent ? (
                    <div className="text-4xl font-bold leading-tight">
                      {formatEventDate(nextEvent)} {formatEventTime(nextEvent)}
                    </div>
                  ) : (
                    <div className="text-4xl font-bold leading-tight text-white/60">--:--</div>
                  )
                case 'nextEventLocation':
                  return nextEvent?.location ? (
                    <div className="text-4xl font-bold leading-tight">{nextEvent.location}</div>
                  ) : (
                    <div className="text-4xl font-bold leading-tight text-white/60">場所未設定</div>
                  )
                case 'eventCount':
                  return (
                    <div className="text-4xl font-bold leading-tight">
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
                    <div className="text-xl text-white/80 font-medium">{nextEvent.title}</div>
                  ) : (
                    <div className="text-xl text-white/60 font-medium">予定なし</div>
                  )
                case 'nextEventTime':
                  return nextEvent ? (
                    <div className="text-xl text-white/80 font-medium">
                      {formatEventDate(nextEvent)} {formatEventTime(nextEvent)}
                    </div>
                  ) : (
                    <div className="text-xl text-white/60 font-medium">--:--</div>
                  )
                case 'nextEventLocation':
                  return nextEvent?.location ? (
                    <div className="text-xl text-white/80 font-medium">{nextEvent.location}</div>
                  ) : (
                    <div className="text-xl text-white/60 font-medium">場所未設定</div>
                  )
                case 'eventCount':
                  return (
                    <div className="text-xl text-white/80 font-medium">
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
                    <div className="text-lg text-white/60 font-medium">{nextEvent.title}</div>
                  ) : (
                    <div className="text-lg text-white/60 font-medium">予定なし</div>
                  )
                case 'nextEventTime':
                  return nextEvent ? (
                    <div className="text-lg text-white/60 font-medium">
                      {getTimeUntilEvent(nextEvent)} - {formatEventTime(nextEvent)}
                    </div>
                  ) : (
                    <div className="text-lg text-white/60 font-medium">--:--</div>
                  )
                case 'nextEventLocation':
                  return nextEvent?.location ? (
                    <div className="text-lg text-white/60 font-medium">{nextEvent.location}</div>
                  ) : (
                    <div className="text-lg text-white/60 font-medium">場所未設定</div>
                  )
                case 'eventCount':
                  return (
                    <div className="text-lg text-white/60 font-medium">
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
              // Check if this item is enabled in display options
              if (!currentDisplayOptions[itemKey]) return null
              
              switch (itemKey) {
                case 'todayEvents':
                  return todayEvents.length > 0 ? (
                    <div key={itemKey} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
                        <Calendar size={14} />
                        今日の予定 ({todayEvents.length}件)
                      </div>
                      <div className="space-y-1">
                        {todayEvents.slice(0, currentMaxEvents).map((event) => (
                          <div key={event.id} className="flex items-center gap-2 text-sm text-white/70 pl-4">
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
                      <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
                        <Calendar size={14} />
                        明日の予定 ({tomorrowEvents.length}件)
                      </div>
                      <div className="space-y-1">
                        {tomorrowEvents.slice(0, currentMaxEvents).map((event) => (
                          <div key={event.id} className="flex items-center gap-2 text-sm text-white/70 pl-4">
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
                    <div key={itemKey} className="flex items-center gap-2 text-sm text-white/70">
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
  )
}