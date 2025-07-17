import React from 'react'
import type { WidgetType, Widget } from '../../../../shared/types'
import ClockWidget from './ClockWidget'
import WeatherWidget from './WeatherWidget'
import CalendarWidget from './CalendarWidget'
import CalendarProWidget from './CalendarProWidget'
import { WidgetTemplate } from './WidgetTemplate'
import { Newspaper, Image, Settings } from 'lucide-react'

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
  'calendar-beta': CalendarProWidget,
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
  isGlobalSettingsMode?: boolean
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ 
  widget, 
  isGlobalSettingsMode = false
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
      <WidgetComponent {...widget.config} widgetId={widget.id} isGlobalSettingsMode={isGlobalSettingsMode} />
      
    </div>
  )
}

export default widgetComponents