import React from 'react'
import { Clock, Cloud, Calendar, Newspaper, Image, Settings } from 'lucide-react'
import { useWidgetStore, widgetMetadata } from '../stores/widgetStore'
import { useLayoutStore } from '../stores/layoutStore'
import type { WidgetType } from '../../../shared/types'

const iconMap = {
  Clock,
  Cloud,
  Calendar,
  Newspaper,
  Image,
  Settings,
}

interface WidgetSelectionPanelProps {
  onClose: () => void
}

export const WidgetSelectionPanel: React.FC<WidgetSelectionPanelProps> = ({ onClose }) => {
  const { addWidget } = useWidgetStore()
  const { addWidgetToLayout } = useLayoutStore()
  
  const handleAddWidget = (type: WidgetType) => {
    const widgetId = addWidget(type)
    addWidgetToLayout(widgetId, type)
    onClose()
  }
  
  return (
    <div className="absolute top-12 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 z-50 min-w-64">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">ウィジェットを追加</h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        {Object.entries(widgetMetadata).map(([type, metadata]) => {
          const IconComponent = iconMap[metadata.icon as keyof typeof iconMap]
          
          return (
            <button
              key={type}
              onClick={() => handleAddWidget(type as WidgetType)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <div className="flex-shrink-0">
                <IconComponent size={20} className="text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">{metadata.name}</div>
                <div className="text-white/60 text-xs mt-1">{metadata.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}