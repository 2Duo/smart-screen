import { useEffect, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Edit3, Plus, Check, Settings } from 'lucide-react'
import { useLayoutStore } from './stores/layoutStore'
import { useSocketStore } from './stores/socketStore'
import { useWidgetStore } from './stores/widgetStore'
import { useSettingsStore } from './stores/settingsStore'
import { WidgetRenderer } from './components/widgets/WidgetRegistry'
import { WidgetSelectionPanel } from './components/WidgetSelectionPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { SecurityCheck } from './components/SecurityCheck'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './styles/themes.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

function App() {
  console.log('App component initializing...')
  
  const { layout, updateLayout, removeWidgetFromLayout } = useLayoutStore()
  console.log('Layout store loaded:', layout?.length || 0, 'items')
  
  const { connect, disconnect } = useSocketStore()
  console.log('Socket store loaded')
  
  const { widgets, isEditMode, toggleEditMode, removeWidget } = useWidgetStore()
  console.log('Widget store loaded:', widgets?.length || 0, 'widgets')
  
  const { settings, resetSettings } = useSettingsStore()
  console.log('Settings store loaded:', settings)
  console.log('Settings.appearance:', settings?.appearance)
  console.log('Settings full object:', JSON.stringify(settings, null, 2))
  
  // Ensure settings are properly initialized
  if (!settings || !settings.appearance) {
    console.error('Settings not properly initialized:', settings)
    
    // Try to reset settings once
    const handleReset = () => {
      console.log('Attempting to reset settings...')
      resetSettings()
    }
    
    const handleClearStorage = () => {
      console.log('Clearing localStorage and reloading...')
      localStorage.clear()
      window.location.reload()
    }
    
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">設定に問題があります</div>
          <div className="text-lg mb-6">設定を修復してください</div>
          <div className="space-y-4">
            <button 
              onClick={handleReset}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors border border-white/30"
            >
              設定をリセット
            </button>
            <button 
              onClick={handleClearStorage}
              className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-400/30"
            >
              完全リセット（データクリア）
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  const [showWidgetPanel, setShowWidgetPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)

  useEffect(() => {
    console.log('useEffect running for socket connection...')
    try {
      connect()
      console.log('Socket connect called successfully')
    } catch (error) {
      console.error('Socket connect failed:', error)
    }
    return () => {
      try {
        disconnect()
        console.log('Socket disconnect called')
      } catch (error) {
        console.error('Socket disconnect failed:', error)
      }
    }
  }, [connect, disconnect])

  const handleLayoutChange = (newLayout: any) => {
    updateLayout(newLayout)
  }

  const handleRemoveWidget = (widgetId: string) => {
    removeWidget(widgetId)
    removeWidgetFromLayout(widgetId)
  }

  const handleToggleEditMode = () => {
    toggleEditMode()
    // 編集モードを終了する際はパネルも閉じる
    if (isEditMode) {
      setShowWidgetPanel(false)
      setShowSettingsPanel(false)
    }
  }

  // Background styles based on settings with fallbacks
  const appearance = settings.appearance || {
    uiStyle: 'liquid-glass',
    backgroundType: 'gradient',
    backgroundOpacity: 0.8
  }
  
  const backgroundStyles = {
    backgroundImage: appearance.backgroundType === 'image' && appearance.backgroundImage
      ? `url(${appearance.backgroundImage})`
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }

  const overlayOpacity = appearance.backgroundType === 'image' 
    ? 1 - appearance.backgroundOpacity 
    : 0.3

  const themeClass = `theme-${appearance.uiStyle}`
  
  console.log('App render starting with:', { 
    widgets: widgets?.length, 
    layout: layout?.length, 
    isEditMode, 
    themeClass 
  })

  return (
    <div 
      className={`h-screen w-screen overflow-hidden relative theme-transition ${themeClass}`}
      style={backgroundStyles}
    >
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
      {/* Control Panel */}
      <div className="absolute top-8 right-8 z-40 flex gap-4">
        <button
          onClick={handleToggleEditMode}
          className={`relative p-3 rounded-xl ${
            isEditMode 
              ? appearance.uiStyle === 'liquid-glass'
                ? 'glass-button-active'
                : 'material-button-active'
              : appearance.uiStyle === 'liquid-glass'
                ? 'glass-button'
                : 'material-button'
          }`}
          title={isEditMode ? '編集完了' : 'レイアウト編集'}
        >
          {isEditMode ? (
            <Check size={20} />
          ) : (
            <Edit3 size={22} />
          )}
        </button>
        
        {isEditMode && (
          <>
            <button
              onClick={() => setShowWidgetPanel(!showWidgetPanel)}
              className={`relative p-3 rounded-xl ${
                appearance.uiStyle === 'liquid-glass'
                  ? showWidgetPanel
                    ? 'backdrop-blur-2xl bg-gradient-to-br from-violet-400/20 via-purple-400/15 to-fuchsia-400/20 border border-violet-300/30 text-white shadow-2xl shadow-violet-500/20'
                    : 'backdrop-blur-2xl bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-purple-400/20 border border-blue-300/30 text-white shadow-2xl shadow-blue-500/20'
                  : showWidgetPanel
                    ? 'material-button-active'
                    : 'material-button'
              }`}
              title="ウィジェットを追加"
            >
              <Plus size={20} />
            </button>
            
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`relative p-3 rounded-xl ${
                appearance.uiStyle === 'liquid-glass'
                  ? showSettingsPanel
                    ? 'backdrop-blur-2xl bg-gradient-to-br from-orange-400/20 via-amber-400/15 to-yellow-400/20 border border-orange-300/30 text-white shadow-2xl shadow-orange-500/20'
                    : 'backdrop-blur-2xl bg-gradient-to-br from-gray-400/20 via-slate-400/15 to-zinc-400/20 border border-gray-300/30 text-white shadow-2xl shadow-gray-500/20'
                  : showSettingsPanel
                    ? 'material-button-active'
                    : 'material-button'
              }`}
              title="全体設定"
            >
              <Settings size={20} />
            </button>
          </>
        )}
      </div>

      {/* Widget Selection Panel */}
      {showWidgetPanel && (
        <WidgetSelectionPanel onClose={() => setShowWidgetPanel(false)} />
      )}

      {/* Settings Panel Background Overlay */}
      {showSettingsPanel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
      )}

      {/* Settings Panel */}
      {showSettingsPanel && (
        <SettingsPanel onClose={() => setShowSettingsPanel(false)} />
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
      >
        {widgets.map((widget) => {
          const layoutItem = layout.find(item => item.i === widget.id)
          if (!layoutItem) return null
          
          return (
            <div key={widget.id} className="widget-container">
              <WidgetRenderer
                widget={widget}
                isEditMode={isEditMode}
                onRemove={handleRemoveWidget}
              />
            </div>
          )
        })}
      </ResponsiveGridLayout>

      {/* Security Check Component */}
      <SecurityCheck />
    </div>
  )
}

export default App