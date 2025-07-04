import { useEffect, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Edit3, Plus, Check } from 'lucide-react'
import { useLayoutStore } from './stores/layoutStore'
import { useSocketStore } from './stores/socketStore'
import { useWidgetStore } from './stores/widgetStore'
import { WidgetRenderer } from './components/widgets/WidgetRegistry'
import { WidgetSelectionPanel } from './components/WidgetSelectionPanel'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

function App() {
  const { layout, updateLayout, removeWidgetFromLayout } = useLayoutStore()
  const { connect, disconnect } = useSocketStore()
  const { widgets, isEditMode, toggleEditMode, removeWidget } = useWidgetStore()
  const [showWidgetPanel, setShowWidgetPanel] = useState(false)

  useEffect(() => {
    connect()
    return () => disconnect()
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
    // 編集モードを終了する際はウィジェット選択パネルも閉じる
    if (isEditMode) {
      setShowWidgetPanel(false)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Control Panel */}
      <div className="absolute top-8 right-8 z-40 flex gap-4">
        <button
          onClick={handleToggleEditMode}
          className={`group relative transition-all duration-500 ease-out ${
            isEditMode 
              ? 'px-6 py-4 rounded-2xl backdrop-blur-2xl bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/20 border border-emerald-300/30 hover:from-emerald-300/25 hover:via-teal-300/20 hover:to-cyan-300/25 hover:border-emerald-200/40 text-white shadow-2xl shadow-emerald-500/20' 
              : 'p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 shadow-lg shadow-black/10'
          }`}
          title={isEditMode ? '編集完了' : 'レイアウト編集'}
        >
          {isEditMode ? (
            <div className="flex items-center gap-3">
              <Check size={20} className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
              <span className="text-base font-semibold tracking-wide">完了</span>
            </div>
          ) : (
            <Edit3 size={22} className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
          )}
        </button>
        
        {isEditMode && (
          <button
            onClick={() => setShowWidgetPanel(!showWidgetPanel)}
            className={`group relative px-6 py-4 rounded-2xl backdrop-blur-2xl border transition-all duration-500 ease-out shadow-2xl ${
              showWidgetPanel
                ? 'bg-gradient-to-br from-violet-400/20 via-purple-400/15 to-fuchsia-400/20 border-violet-300/30 hover:from-violet-300/25 hover:via-purple-300/20 hover:to-fuchsia-300/25 hover:border-violet-200/40 text-white shadow-violet-500/20'
                : 'bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-purple-400/20 border-blue-300/30 hover:from-blue-300/25 hover:via-indigo-300/20 hover:to-purple-300/25 hover:border-blue-200/40 text-white shadow-blue-500/20'
            }`}
            title="ウィジェットを追加"
          >
            <div className="flex items-center gap-3">
              <Plus size={20} className={`transition-all duration-500 group-hover:scale-110 ${showWidgetPanel ? 'rotate-45' : 'group-hover:rotate-90'}`} />
              <span className="text-base font-semibold tracking-wide">追加</span>
            </div>
          </button>
        )}
      </div>

      {/* Widget Selection Panel */}
      {showWidgetPanel && (
        <WidgetSelectionPanel onClose={() => setShowWidgetPanel(false)} />
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
    </div>
  )
}

export default App