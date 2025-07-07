import React, { ReactNode } from 'react'
import { X, LucideIcon } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'

interface TabOption {
  id: string
  label: string
}

interface WidgetSettingsModalProps {
  /** Modal title */
  title: string
  /** Icon to display in header */
  icon: LucideIcon
  /** Function to call when modal should close */
  onClose: () => void
  /** Optional tabs for multi-section settings */
  tabs?: TabOption[]
  /** Currently active tab */
  activeTab?: string
  /** Function to call when tab changes */
  onTabChange?: (tabId: string) => void
  /** Modal content */
  children: ReactNode
  /** Modal position - 'center' for screen center, 'right-top' for global settings style, 'contained' for widget bounds */
  position?: 'center' | 'right-top' | 'contained'
  /** Custom modal width */
  width?: 'sm' | 'md' | 'lg'
}

export const WidgetSettingsModal: React.FC<WidgetSettingsModalProps> = ({
  title,
  icon: IconComponent,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  children,
  position = 'center',
  width = 'md'
}) => {
  const { settings } = useSettingsStore()
  const isLiquidGlass = settings?.appearance?.uiStyle === 'liquid-glass'

  // Position styles
  const positionClasses = position === 'center'
    ? 'fixed inset-0 flex items-center justify-center p-4'
    : position === 'right-top'
    ? 'fixed inset-0 flex items-start justify-end p-4 pt-24'
    : 'absolute inset-0 flex items-center justify-center p-2'

  // Width styles
  const widthClasses = position === 'contained'
    ? 'w-full h-full max-w-none max-h-none'
    : {
        sm: 'w-full max-w-sm',
        md: 'w-full max-w-md',
        lg: 'w-full max-w-lg'
      }[width]

  // Panel styles
  const panelClasses = isLiquidGlass
    ? 'bg-gradient-to-br from-black/80 via-black/70 to-black/80 border-white/20 shadow-black/40'
    : 'bg-white/95 border-gray-200 shadow-gray-500/20'

  return (
    <div className={position === 'contained' ? 'absolute inset-0 z-50' : 'fixed inset-0 z-50'}>
      {/* Background overlay with blur - only for full screen modals */}
      {position !== 'contained' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      )}
      
      {/* Modal container */}
      <div className={positionClasses}>
        <div className={`${widthClasses} ${position === 'contained' ? 'max-h-full' : 'max-h-[calc(100vh-8rem)]'} backdrop-blur-3xl border rounded-3xl shadow-2xl overflow-hidden flex flex-col ${panelClasses}`}>
          
          {/* Header */}
          <div className={`border-b p-6 flex-shrink-0 ${
            isLiquidGlass
              ? 'bg-gradient-to-r from-blue-400/15 via-purple-400/10 to-indigo-400/15 border-white/15'
              : 'bg-blue-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-2xl ${
                  isLiquidGlass
                    ? 'bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-xl'
                    : 'bg-blue-100'
                }`}>
                  <IconComponent size={22} className={
                    isLiquidGlass
                      ? 'text-blue-200'
                      : 'text-blue-600'
                  } />
                </div>
                <h3 className={`font-bold text-xl tracking-wide ${
                  isLiquidGlass
                    ? 'text-white'
                    : 'text-gray-800'
                }`}>
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  isLiquidGlass
                    ? 'bg-white/10 hover:bg-white/15 border-white/10 hover:border-white/20'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300'
                }`}
              >
                <X size={18} className={
                  isLiquidGlass
                    ? 'text-white/70 group-hover:text-white transition-colors group-hover:rotate-90'
                    : 'text-gray-600 group-hover:text-gray-800 transition-colors group-hover:rotate-90'
                } />
              </button>
            </div>
          </div>
          
          {/* Tab Navigation (optional) */}
          {tabs && tabs.length > 0 && (
            <div className={`flex gap-2 p-2 mx-5 mb-0 flex-shrink-0 rounded-2xl backdrop-blur-xl border ${
              isLiquidGlass
                ? 'bg-gradient-to-r from-white/10 to-white/15 border-white/20'
                : 'bg-gray-100 border-gray-200'
            }`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? isLiquidGlass
                        ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-white border border-blue-300/30 shadow-lg'
                        : 'bg-blue-100 border border-blue-200 text-blue-700 shadow-md'
                      : isLiquidGlass
                        ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WidgetSettingsModal