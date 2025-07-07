import React from 'react'
import { Clock, Cloud, Calendar, Newspaper, Image, Settings, X, Sparkles } from 'lucide-react'
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
    <div className="absolute top-24 right-8 z-50 w-96">
      {/* Liquid Glass morphism container */}
      <div className="backdrop-blur-3xl bg-gradient-to-br from-white/[0.08] via-white/5 to-white/[0.08] border border-white/20 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-400/15 via-purple-400/10 to-indigo-400/15 border-b border-white/15 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-xl">
                <Sparkles size={22} className="text-blue-200" />
              </div>
              <h3 className="text-white font-bold text-xl tracking-wide">ウィジェットを追加</h3>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20"
            >
              <X size={18} className="text-white/70" />
            </button>
          </div>
        </div>
        
        {/* Widget list */}
        <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
          {Object.entries(widgetMetadata).map(([type, metadata]) => {
            const IconComponent = iconMap[metadata.icon as keyof typeof iconMap]
            
            return (
              <button
                key={type}
                onClick={() => handleAddWidget(type as WidgetType)}
                className="w-full flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.08] hover:from-white/10 hover:to-white/15 border border-white/10 hover:border-white/25 text-left"
              >
                <div className="flex-shrink-0 p-3 rounded-2xl bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-xl">
                  <IconComponent size={28} className="text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-lg mb-1">
                    {metadata.name}
                  </div>
                  <div className="text-white/60 text-sm leading-relaxed">
                    {metadata.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        
        {/* Footer */}
        <div className="bg-gradient-to-r from-white/5 via-white/[0.08] to-white/5 border-t border-white/15 p-4">
          <div className="text-white/60 text-sm text-center font-medium">
            ウィジェットをクリックして追加
          </div>
        </div>
      </div>
    </div>
  )
}