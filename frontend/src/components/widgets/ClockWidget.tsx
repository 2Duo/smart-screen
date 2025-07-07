import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { WidgetTemplate } from './WidgetTemplate'
import { WidgetSettingsModal } from '../WidgetSettingsModal'
import { useWidgetStore } from '../../stores/widgetStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAutoFontSize } from '../../utils/autoFontSize'

interface ClockWidgetProps {
  showSeconds?: boolean
  format24Hour?: boolean
  showDate?: boolean
  fontSize?: number
  autoFontSize?: boolean
  widgetId?: string
}

export default function ClockWidget({ 
  showSeconds = true, 
  format24Hour = true, 
  showDate = true,
  fontSize: propFontSize,
  autoFontSize: propAutoFontSize,
  widgetId
}: ClockWidgetProps) {
  const [time, setTime] = useState(new Date())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { updateWidget, getWidget } = useWidgetStore()
  const { settings } = useSettingsStore()
  
  const widget = widgetId ? getWidget(widgetId) : null
  const currentFontSize = propFontSize || widget?.config?.fontSize || 96
  const isAutoFontSizeEnabled = propAutoFontSize ?? widget?.config?.autoFontSize ?? settings?.appearance?.autoFontSize ?? false
  const uiStyle = settings?.appearance?.uiStyle || 'liquid-glass'
  const isLiquidGlass = uiStyle === 'liquid-glass'
  
  // 自動文字サイズ調整のフック
  const [containerRef, autoFontSize] = useAutoFontSize(
    isAutoFontSizeEnabled,
    currentFontSize,
    'primary'
  )
  
  // 最終的な文字サイズ
  const finalFontSize = isAutoFontSizeEnabled ? autoFontSize : currentFontSize

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
  
  const handleAutoFontSizeToggle = (enabled: boolean) => {
    if (widgetId) {
      updateWidget(widgetId, { ...widget?.config, autoFontSize: enabled })
    }
  }

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

    return (
      <>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${labelClass}`}>文字サイズ自動調整</p>
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
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${labelClass}`}>文字サイズ</p>
            <span className={`text-sm font-medium px-3 py-1 rounded-xl backdrop-blur-xl ${valueDisplayClass}`}>{finalFontSize}px</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="32"
              max="128"
              step="4"
              value={currentFontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className={sliderClass}
              disabled={isAutoFontSizeEnabled}
            />
            <div className={`flex justify-between text-sm mt-3 px-1 ${scaleLabelsClass}`}>
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
      </>
    )
  }

  return (
    <>
      <WidgetTemplate
        icon={Clock}
        title="時刻"
        onSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      >
        <div ref={containerRef} className="text-center h-full flex flex-col justify-center">
          <div 
            className={`font-bold mb-4 leading-tight ${isLiquidGlass ? 'text-white' : 'material-text-primary'}`}
            style={{ fontSize: `${finalFontSize}px` }}
          >
            {format(time, timeFormat)}
          </div>
          
          {showDate && (
            <div 
              className={`font-medium ${isLiquidGlass ? 'text-white/80' : 'material-text-secondary'}`}
              style={{ fontSize: `${Math.round(finalFontSize * 0.3)}px` }}
            >
              {format(time, 'yyyy年M月d日 (E)', { locale: ja })}
            </div>
          )}
        </div>
      </WidgetTemplate>
      
      {isSettingsOpen && (
        <WidgetSettingsModal
          title="時刻表示設定"
          icon={Clock}
          onClose={() => setIsSettingsOpen(false)}
          position="contained"
          width="sm"
        >
          {renderSettingsContent()}
        </WidgetSettingsModal>
      )}
    </>
  )
}