import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { secureStorageConfig } from '../utils/secureStorage'
import type { Layout, LayoutItem, WidgetType } from '../../../shared/types'
import { widgetMetadata } from './widgetStore'

interface LayoutState {
  layout: Layout
  updateLayout: (newLayout: Layout) => void
  updateLayoutItem: (item: LayoutItem) => void
  addWidgetToLayout: (widgetId: string, widgetType: WidgetType) => void
  removeWidgetFromLayout: (widgetId: string) => void
  resetLayout: () => void
}

const defaultLayout: Layout = [
  { i: 'clock', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
  { i: 'weather', x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 3 },
]

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      layout: defaultLayout,
      
      updateLayout: (newLayout: Layout) => {
        set({ layout: newLayout })
      },
      
      updateLayoutItem: (item: LayoutItem) => {
        const currentLayout = get().layout
        const updatedLayout = currentLayout.map(layoutItem =>
          layoutItem.i === item.i ? { ...layoutItem, ...item } : layoutItem
        )
        set({ layout: updatedLayout })
      },
      
      addWidgetToLayout: (widgetId: string, widgetType: WidgetType) => {
        const metadata = widgetMetadata[widgetType]
        const currentLayout = get().layout
        
        // Find a good position for the new widget
        const maxY = Math.max(...currentLayout.map(item => item.y + item.h), 0)
        
        const newLayoutItem: LayoutItem = {
          i: widgetId,
          x: 0,
          y: maxY,
          w: metadata.defaultSize.w,
          h: metadata.defaultSize.h,
          minW: metadata.minSize.w,
          minH: metadata.minSize.h,
        }
        
        set((state) => ({
          layout: [...state.layout, newLayoutItem],
        }))
      },
      
      removeWidgetFromLayout: (widgetId: string) => {
        set((state) => ({
          layout: state.layout.filter(item => item.i !== widgetId),
        }))
      },
      
      resetLayout: () => {
        set({ layout: defaultLayout })
      },
    }),
    {
      name: 'smart-display-layout',
      version: 1,
      ...secureStorageConfig,
    }
  )
)