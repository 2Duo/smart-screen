import { useEffect, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Edit3, Plus, Check, Settings, X, RefreshCcw } from 'lucide-react'
import { useLayoutStore } from './stores/layoutStore'
import { useSocketStore } from './stores/socketStore'
import { useWidgetStore } from './stores/widgetStore'
import { useSettingsStore } from './stores/settingsStore'
import { WidgetRenderer } from './components/widgets/WidgetRegistry'
import { WidgetSelectionPanel } from './components/WidgetSelectionPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { PWAControls } from './components/PWAControls'
import { NotificationContainer } from './components/NotificationToast'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './styles/themes.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

function App() {
  console.log('App component initializing...')
  
  const { layout, updateLayout, removeWidgetFromLayout, resetLayout } = useLayoutStore()
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
  const [deletingWidgets, setDeletingWidgets] = useState<Set<string>>(new Set())
  const [showEditControls, setShowEditControls] = useState(false)
  const [editControlsTimeout, setEditControlsTimeout] = useState<number | null>(null)
  
  // Global settings mode - when true, individual widget settings are disabled
  const isGlobalSettingsMode = showSettingsPanel
  
  // Double-tap gesture state for edit controls
  const [lastTapTime, setLastTapTime] = useState<number>(0)
  const [lastTapX, setLastTapX] = useState<number>(0)
  const [lastTapY, setLastTapY] = useState<number>(0)
  
  // Touch event handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    // Check if touch is on an interactive element (button, etc.)
    if (e.target instanceof HTMLElement) {
      const target = e.target.closest('button, a, input, select, textarea, [role="button"], [data-grid-ignore]')
      if (target) {
        return // Don't process swipe for interactive elements
      }
    }
    
    const touch = e.touches[0]
    setSwipeStartX(touch.clientX)
    setSwipeStartY(touch.clientY)
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX === null || swipeStartY === null) return
    
    // Check if touch ended on an interactive element
    if (e.target instanceof HTMLElement) {
      const target = e.target.closest('button, a, input, select, textarea, [role="button"], [data-grid-ignore]')
      if (target) {
        // Reset swipe state but don't process as swipe
        setSwipeStartX(null)
        setSwipeStartY(null)
        return
      }
    }
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - swipeStartX
    const deltaY = touch.clientY - swipeStartY
    
    // Check if it's a swipe from right edge (within 50px from right)
    const isFromRightEdge = swipeStartX > window.innerWidth - 50
    
    // Check if it's a leftward swipe (at least 100px) and not too vertical
    const isLeftSwipe = deltaX < -100 && Math.abs(deltaY) < 100
    
    if (isFromRightEdge && isLeftSwipe) {
      setShowEditControls(true)
      // Clear any existing timeout
      if (editControlsTimeout) {
        clearTimeout(editControlsTimeout)
        setEditControlsTimeout(null)
      }
      // Set auto-hide timeout only if no menus are open
      if (!showWidgetPanel && !showSettingsPanel) {
        const timeoutId = setTimeout(() => {
          setShowEditControls(false)
        }, 5000)
        setEditControlsTimeout(timeoutId)
      }
    }
    
    setSwipeStartX(null)
    setSwipeStartY(null)
  }

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

  // Keyboard event handler for 'M' key to show edit controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        // Prevent default behavior and don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return
        }
        e.preventDefault()
        setShowEditControls(true)
        // Clear any existing timeout
        if (editControlsTimeout) {
          clearTimeout(editControlsTimeout)
          setEditControlsTimeout(null)
        }
        // Set auto-hide timeout only if no menus are open
        if (!showWidgetPanel && !showSettingsPanel) {
          const timeoutId = setTimeout(() => {
            setShowEditControls(false)
          }, 5000)
          setEditControlsTimeout(timeoutId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLayoutChange = (newLayout: any) => {
    console.log('Layout change detected:', newLayout)
    console.log('Previous layout:', layout)
    updateLayout(newLayout)
    console.log('Layout updated in store')
    
    // Debug: Check localStorage content
    setTimeout(() => {
      const storedData = localStorage.getItem('smart-display-layout')
      console.log('Stored layout data:', storedData)
    }, 100)
  }

  const handleRemoveWidget = (widgetId: string) => {
    console.log('Starting widget deletion:', widgetId)
    
    // Mark widget as being deleted
    setDeletingWidgets(prev => new Set(prev).add(widgetId))
    
    // Perform deletion
    removeWidget(widgetId)
    removeWidgetFromLayout(widgetId)
    
    // Clear deleting state after a short delay
    setTimeout(() => {
      setDeletingWidgets(prev => {
        const newSet = new Set(prev)
        newSet.delete(widgetId)
        return newSet
      })
    }, 100)
  }

  const handleToggleEditMode = () => {
    const newIsEditMode = !isEditMode
    toggleEditMode()
    
    if (newIsEditMode) {
      // 編集モードに入る時：タイムアウトをクリア
      if (editControlsTimeout) {
        clearTimeout(editControlsTimeout)
        setEditControlsTimeout(null)
      }
    } else {
      // 編集モードを終了する際はパネルも閉じる
      setShowWidgetPanel(false)
      setShowSettingsPanel(false)
      setShowEditControls(false)
    }
  }

  const handleResetLayout = () => {
    if (confirm('ウィジェットの配置をデフォルトに戻しますか？')) {
      resetLayout()
    }
  }

  // Background styles based on settings with fallbacks
  const appearance = settings.appearance || {
    uiStyle: 'liquid-glass',
    backgroundType: 'gradient',
    backgroundOpacity: 0.8
  }
  
  const backgroundStyles = (() => {
    switch (appearance.backgroundType) {
      case 'image':
        return appearance.backgroundImage ? {
          backgroundImage: `url(${appearance.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : {
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      case 'solid':
        return {
          backgroundColor: appearance.backgroundColor || '#1e293b',
        }
      default: // gradient
        return {
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
    }
  })()

  const overlayOpacity = (() => {
    switch (appearance.backgroundType) {
      case 'image':
        return 1 - appearance.backgroundOpacity
      case 'solid':
        return 1 - appearance.backgroundOpacity
      default: // gradient
        return 0.3
    }
  })()

  const themeClass = `theme-${appearance.uiStyle}`
  
  console.log('App render starting with:', { 
    widgets: widgets?.length, 
    layout: layout?.length, 
    isEditMode, 
    themeClass 
  })
  
  console.log('Grid layout items:', layout.length)

  return (
    <div 
      className={`h-screen w-screen relative theme-transition ${themeClass}`}
      style={backgroundStyles}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Notification Container */}
      <NotificationContainer />
      {/* Debug Panel */}
      {import.meta.env.VITE_DEBUG_MODE === 'true' && (
        <div className="absolute top-8 left-8 z-40">
          <button
            onClick={() => {
              console.log('=== LAYOUT DEBUG ===')
              console.log('Current layout from store:', layout)
              console.log('localStorage item:', localStorage.getItem('smart-display-layout'))
              console.log('All localStorage keys:', Object.keys(localStorage))
              
              // Force save current layout
              const testLayout = [
                { i: 'clock', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
                { i: 'weather', x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 3 },
              ]
              localStorage.setItem('test-layout', JSON.stringify(testLayout))
              console.log('Test layout saved:', localStorage.getItem('test-layout'))
            }}
            className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs border border-red-400/30"
          >
            Debug Layout
          </button>
        </div>
      )}

      {/* Control Panel */}
      <div className={`absolute top-8 right-8 z-40 flex gap-4 transition-all duration-300 ${showEditControls || isEditMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
        <PWAControls />
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
        
        {isEditMode && showEditControls && (
          <>
            <button
              onClick={() => {
                const newShowWidgetPanel = !showWidgetPanel
                setShowWidgetPanel(newShowWidgetPanel)
                // Clear timeout when opening widget panel
                if (newShowWidgetPanel && editControlsTimeout) {
                  clearTimeout(editControlsTimeout)
                  setEditControlsTimeout(null)
                }
                // Set timeout when closing widget panel (if settings panel is also closed)
                if (!newShowWidgetPanel && !showSettingsPanel) {
                  const timeoutId = setTimeout(() => {
                    setShowEditControls(false)
                  }, 5000)
                  setEditControlsTimeout(timeoutId)
                }
              }}
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
              onClick={() => {
                const newShowSettingsPanel = !showSettingsPanel
                setShowSettingsPanel(newShowSettingsPanel)
                // Clear timeout when opening settings panel
                if (newShowSettingsPanel && editControlsTimeout) {
                  clearTimeout(editControlsTimeout)
                  setEditControlsTimeout(null)
                }
                // Set timeout when closing settings panel (if widget panel is also closed)
                if (!newShowSettingsPanel && !showWidgetPanel) {
                  const timeoutId = setTimeout(() => {
                    setShowEditControls(false)
                  }, 5000)
                  setEditControlsTimeout(timeoutId)
                }
              }}
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
            
            <button
              onClick={handleResetLayout}
              className={`relative p-3 rounded-xl ${
                appearance.uiStyle === 'liquid-glass'
                  ? 'backdrop-blur-2xl bg-gradient-to-br from-red-400/20 via-pink-400/15 to-rose-400/20 border border-red-300/30 text-white shadow-2xl shadow-red-500/20'
                  : 'material-button'
              }`}
              title="配置をリセット"
            >
              <RefreshCcw size={20} />
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20" />
      )}

      {/* Settings Panel */}
      {showSettingsPanel && (
        <SettingsPanel onClose={() => setShowSettingsPanel(false)} />
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout relative z-10"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
        compactType={null}
        preventCollision={true}
        verticalCompact={false}
        // dragStartDelay={100}
      >
        {widgets
          .filter(widget => !deletingWidgets.has(widget.id))
          .map((widget) => {
            const layoutItem = layout.find(item => item.i === widget.id)
            if (!layoutItem) return null
            
            const isDeleting = deletingWidgets.has(widget.id)
            
            return (
              <div key={widget.id} className="widget-container relative">
                <WidgetRenderer
                  widget={widget}
                  isEditMode={isEditMode}
                  onRemove={handleRemoveWidget}
                  isGlobalSettingsMode={isGlobalSettingsMode}
                />
                
                {/* Edit Mode Delete Button */}
                {isEditMode && !isDeleting && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      console.log('Deleting widget:', widget.id)
                      handleRemoveWidget(widget.id)
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                    className="absolute top-2 right-2 z-50 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-2xl transition-all duration-300 hover:scale-110 group pointer-events-auto"
                    title={`${widget.type}ウィジェットを削除`}
                    style={{ pointerEvents: 'auto' }}
                    data-grid-ignore="true"
                  >
                    <X size={16} className="group-hover:rotate-90 transition-transform duration-300 pointer-events-none" />
                  </button>
                )}
              </div>
            )
          })}
        </ResponsiveGridLayout>
    </div>
  )
}

export default App