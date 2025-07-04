import React from 'react'
import type { WidgetType, Widget } from '../../../../shared/types'
import ClockWidget from './ClockWidget'
import WeatherWidget from './WeatherWidget'

// Widget component registry
const widgetComponents: Record<WidgetType, React.ComponentType<any>> = {
  clock: ClockWidget,
  weather: WeatherWidget,
  calendar: () => <div className="h-full flex items-center justify-center text-white">カレンダー（未実装）</div>,
  news: () => <div className="h-full flex items-center justify-center text-white">ニュース（未実装）</div>,
  photo: () => <div className="h-full flex items-center justify-center text-white">写真（未実装）</div>,
  custom: () => <div className="h-full flex items-center justify-center text-white">カスタム（未実装）</div>,
}

interface WidgetRendererProps {
  widget: Widget
  isEditMode?: boolean
  onRemove?: (id: string) => void
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ 
  widget, 
  isEditMode = false, 
  onRemove 
}) => {
  const WidgetComponent = widgetComponents[widget.type]
  
  if (!WidgetComponent) {
    return (
      <div className="h-full flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-white/80">不明なウィジェット</p>
          <p className="text-sm text-white/60">{widget.type}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full relative">
      <WidgetComponent {...widget.config} widgetId={widget.id} />
      
      {isEditMode && (
        <>
          {/* Edit overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] border-2 border-white/30 rounded-lg pointer-events-none">
            <div className="absolute top-2 left-2 text-white/60 text-xs font-medium">
              編集モード
            </div>
          </div>
          
          {/* Delete button - larger and more prominent */}
          <div 
            className="absolute -top-2 -right-2 z-50"
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onRemove?.(widget.id)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors shadow-lg border-2 border-white/20"
              title="ウィジェットを削除"
            >
              ×
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default widgetComponents