import React from 'react'
import type { WidgetType, Widget } from '../../../../shared/types'
import ClockWidget from './ClockWidget'
import WeatherWidget from './WeatherWidget'
import CalendarWidget from './CalendarWidget'
import { WidgetTemplate } from './WidgetTemplate'
import { Newspaper, Image, Settings, Trash2 } from 'lucide-react'

/*
 * WIDGET REGISTRY - NEW WIDGET IMPLEMENTATION GUIDE
 * ================================================
 * 
 * When adding a new widget to this registry, you MUST follow the standardized
 * UI template defined in WidgetTemplate.tsx. This ensures consistent design
 * and user experience across all widgets.
 * 
 * STEP-BY-STEP WIDGET CREATION:
 * 
 * 1. CREATE WIDGET COMPONENT:
 *    - Import and use WidgetTemplate as the root component
 *    - Follow the template's design guidelines (see WidgetTemplate.tsx)
 *    - Use appropriate icons from lucide-react (32px for headers)
 *    - Ensure large, readable fonts for primary information (text-6xl+)
 * 
 * 2. REGISTER IN widgetComponents:
 *    - Add your component to the registry below
 *    - Replace placeholder implementations with real components
 * 
 * 3. UPDATE widgetMetadata (in widgetStore.ts):
 *    - Add appropriate icon, name, description
 *    - Set reasonable defaultSize and minSize values
 * 
 * 4. ENSURE ACCESSIBILITY:
 *    - All important information should be readable from distance
 *    - Use consistent color scheme (text-white, text-white/80, text-white/60)
 *    - Maintain proper spacing and hierarchy
 * 
 * EXAMPLE WIDGET IMPLEMENTATION:
 * ```tsx
 * export default function MyWidget({ customProp }: MyWidgetProps) {
 *   return (
 *     <WidgetTemplate
 *       icon={MyIcon}
 *       title="My Widget"
 *       onSettings={() => handleSettings()}
 *       footer="Optional footer text"
 *     >
 *       <div className="text-center">
 *         <div className="text-6xl font-bold mb-4">
 *           {primaryData}
 *         </div>
 *         <div className="text-xl text-white/80">
 *           {secondaryData}
 *         </div>
 *       </div>
 *     </WidgetTemplate>
 *   )
 * }
 * ```
 */

// Widget component registry
const widgetComponents: Record<WidgetType, React.ComponentType<any>> = {
  clock: ClockWidget,
  weather: WeatherWidget,
  calendar: CalendarWidget,
  // TODO: Implement these widgets following the WidgetTemplate pattern
  news: () => (
    <WidgetTemplate icon={Newspaper} title="ニュース">
      <div className="text-center text-xl text-white/80">未実装</div>
    </WidgetTemplate>
  ),
  photo: () => (
    <WidgetTemplate icon={Image} title="写真">
      <div className="text-center text-xl text-white/80">未実装</div>
    </WidgetTemplate>
  ),
  custom: () => (
    <WidgetTemplate icon={Settings} title="カスタム">
      <div className="text-center text-xl text-white/80">未実装</div>
    </WidgetTemplate>
  ),
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
          {/* Edit overlay - Clean blur only */}
          <div className="absolute inset-0 backdrop-blur-md rounded-2xl pointer-events-none"></div>
          
          {/* Delete button - Enhanced Liquid Glass */}
          <div 
            className="absolute -top-4 -right-4 z-50"
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
              className="w-14 h-14 backdrop-blur-2xl bg-gradient-to-br from-red-400/20 via-rose-400/15 to-pink-400/20 border border-red-300/30 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/20"
              title="ウィジェットを削除"
            >
              <Trash2 size={18} className="text-white/90" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default widgetComponents