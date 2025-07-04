import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Clock, X } from 'lucide-react'
import { WidgetTemplate } from './WidgetTemplate'
import { useWidgetStore } from '../../stores/widgetStore'

interface ClockWidgetProps {
  showSeconds?: boolean
  format24Hour?: boolean
  showDate?: boolean
  fontSize?: number
  widgetId?: string
}

export default function ClockWidget({ 
  showSeconds = true, 
  format24Hour = true, 
  showDate = true,
  fontSize: propFontSize,
  widgetId
}: ClockWidgetProps) {
  const [time, setTime] = useState(new Date())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { updateWidget, getWidget } = useWidgetStore()
  
  const widget = widgetId ? getWidget(widgetId) : null
  const currentFontSize = propFontSize || widget?.config?.fontSize || 96

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const timeFormat = format24Hour 
    ? (showSeconds ? 'HH:mm:ss' : 'HH:mm')
    : (showSeconds ? 'h:mm:ss a' : 'h:mm a')

  const handleFontSizeChange = (newFontSize: number) => {
    if (widgetId) {
      updateWidget(widgetId, { ...widget?.config, fontSize: newFontSize })
    }
  }

  const renderSettingsPanel = () => {
    if (!isSettingsOpen) return null
    
    return (
      <div className="absolute top-0 left-0 right-0 bottom-0 backdrop-blur-3xl bg-gradient-to-br from-black/60 via-black/50 to-black/60 border border-white/20 rounded-2xl p-5 z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white tracking-wide">時刻表示設定</h3>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="group p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <X size={16} className="text-white/70 group-hover:text-white transition-colors group-hover:rotate-90" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/80 font-medium">文字サイズ</p>
            <span className="text-sm text-white/90 font-mono bg-gradient-to-r from-blue-400/20 to-purple-400/20 px-3 py-1 rounded-xl backdrop-blur-xl border border-white/20">{currentFontSize}px</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="32"
              max="128"
              step="4"
              value={currentFontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-white/10 to-white/20 rounded-2xl appearance-none cursor-pointer slider backdrop-blur-xl"
            />
            <div className="flex justify-between text-sm text-white/60 mt-3 px-1">
              <span className="font-medium">小</span>
              <span className="font-medium">中</span>
              <span className="font-medium">大</span>
              <span className="font-medium">特大</span>
            </div>
          </div>
        </div>
        
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
      </div>
    )
  }

  return (
    <WidgetTemplate
      icon={Clock}
      title="時刻"
      onSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      settingsPanel={renderSettingsPanel()}
    >
      <div className="text-center">
        <div 
          className="font-bold font-mono mb-4 leading-tight"
          style={{ fontSize: `${currentFontSize}px` }}
        >
          {format(time, timeFormat)}
        </div>
        
        {showDate && (
          <div className="text-2xl text-white/80 font-medium">
            {format(time, 'yyyy年M月d日 (E)', { locale: ja })}
          </div>
        )}
      </div>
    </WidgetTemplate>
  )
}