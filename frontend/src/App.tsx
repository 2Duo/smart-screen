import { useEffect, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Edit3, Plus, X } from 'lucide-react'
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

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <button
          onClick={toggleEditMode}
          className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
            isEditMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isEditMode ? '編集モード終了' : '編集モード開始'}
        >
          {isEditMode ? <X size={20} /> : <Edit3 size={20} />}
        </button>
        
        {isEditMode && (
          <button
            onClick={() => setShowWidgetPanel(!showWidgetPanel)}
            className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white backdrop-blur-sm transition-colors"
            title="ウィジェットを追加"
          >
            <Plus size={20} />
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