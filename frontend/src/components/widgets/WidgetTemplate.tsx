import React, { ReactNode } from 'react'
import { LucideIcon, Settings } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

/*
 * WIDGET DEVELOPMENT GUIDELINES
 * ============================
 * 
 * All widgets MUST follow this standardized UI template to ensure consistency
 * across the smart display interface. This template provides:
 * 
 * 1. HEADER STRUCTURE:
 *    - Left side: Icon (32px) + Title (text-2xl, font-semibold)
 *    - Right side: Optional settings button (20px icon)
 *    - Consistent spacing and styling
 * 
 * 2. CONTENT AREA:
 *    - Flexible main content area that adapts to widget needs
 *    - Use large fonts for primary information (text-6xl for main data)
 *    - Use medium fonts for secondary info (text-xl to text-2xl)
 *    - Maintain proper spacing with mb-3, mb-4, mb-6 classes
 * 
 * 3. FOOTER (Optional):
 *    - For timestamps, status info, or additional context
 *    - Use text-sm with text-white/60 for subtle appearance
 * 
 * 4. DESIGN PRINCIPLES:
 *    - All text must be readable from distance (minimum text-xl for important info)
 *    - Use consistent color scheme: text-white, text-white/80, text-white/60
 *    - Icons should be appropriately sized (18px+ for details, 32px+ for headers)
 *    - Maintain proper contrast and spacing
 * 
 * 5. RESPONSIVE BEHAVIOR:
 *    - Content should scale appropriately with widget size
 *    - Critical information should always be visible
 *    - Use flex layouts for proper content distribution
 * 
 * HOW TO USE:
 * ```tsx
 * <WidgetTemplate
 *   icon={ClockIcon}
 *   title="時計"
 *   onSettings={() => setShowSettings(true)}
 *   footer="最終更新: 12:34"
 * >
 *   <YourWidgetContent />
 * </WidgetTemplate>
 * ```
 */

interface WidgetTemplateProps {
  /** Widget icon component from lucide-react (required) */
  icon: LucideIcon
  /** Widget title displayed in header (required) */
  title: string | ReactNode
  /** Optional settings button click handler */
  onSettings?: () => void
  /** Optional footer content (typically timestamps or status) */
  footer?: ReactNode
  /** Optional settings panel overlay */
  settingsPanel?: ReactNode
  /** Main widget content */
  children: ReactNode
  /** Optional className for additional styling */
  className?: string
}

export const WidgetTemplate: React.FC<WidgetTemplateProps> = ({
  icon: IconComponent,
  title,
  onSettings,
  footer,
  settingsPanel,
  children,
  className = ""
}) => {
  const { settings } = useSettingsStore()
  const uiStyle = settings?.appearance?.uiStyle || 'liquid-glass'
  
  // Theme-aware styling
  const isLiquidGlass = uiStyle === 'liquid-glass'
  
  const containerClass = isLiquidGlass 
    ? 'glass-widget' 
    : 'material-widget'
    
  const iconTextClass = isLiquidGlass 
    ? 'text-white/80' 
    : 'material-text-secondary'
    
  const titleTextClass = isLiquidGlass 
    ? 'text-white/80' 
    : 'material-text-primary'
    
  const settingsButtonClass = isLiquidGlass
    ? 'p-2 rounded hover:bg-white/10 transition-colors flex-shrink-0'
    : 'p-2 rounded hover:bg-gray-200 transition-colors flex-shrink-0'
    
  const settingsIconClass = isLiquidGlass
    ? 'text-white/60'
    : 'text-gray-600'
    
  const footerTextClass = isLiquidGlass
    ? 'text-white/60'
    : 'material-text-tertiary'

  return (
    <div className={`h-full flex flex-col justify-between p-4 relative ${containerClass} ${isLiquidGlass ? 'text-white' : ''} ${className}`}>
      {/* HEADER: Icon + Title + Settings */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <IconComponent size={32} className={iconTextClass} />
          <div className={`text-2xl font-semibold ${titleTextClass}`}>{title}</div>
        </div>
        
        {onSettings && (
          <button
            onClick={onSettings}
            className={settingsButtonClass}
            title="設定"
          >
            <Settings size={20} className={settingsIconClass} />
          </button>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {children}
      </div>

      {/* FOOTER (Optional) */}
      {footer && (
        <div className={`text-sm text-center font-medium flex-shrink-0 mt-3 ${footerTextClass}`}>
          {footer}
        </div>
      )}

      {/* SETTINGS PANEL OVERLAY (Optional) */}
      {settingsPanel}
    </div>
  )
}

export default WidgetTemplate