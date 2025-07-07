import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
        try {
          // Validate layout before saving
          if (Array.isArray(newLayout) && newLayout.every(item => 
            typeof item.i === 'string' &&
            typeof item.x === 'number' &&
            typeof item.y === 'number' &&
            typeof item.w === 'number' &&
            typeof item.h === 'number'
          )) {
            set({ layout: newLayout })
          } else {
            console.error('Invalid layout data, keeping current layout')
          }
        } catch (error) {
          console.error('Failed to update layout:', error)
        }
      },
      
      updateLayoutItem: (item: LayoutItem) => {
        try {
          const currentLayout = get().layout
          const updatedLayout = currentLayout.map(layoutItem =>
            layoutItem.i === item.i ? { ...layoutItem, ...item } : layoutItem
          )
          set({ layout: updatedLayout })
        } catch (error) {
          console.error('Failed to update layout item:', error)
        }
      },
      
      addWidgetToLayout: (widgetId: string, widgetType: WidgetType) => {
        try {
          const metadata = widgetMetadata[widgetType]
          if (!metadata) {
            console.error(`Unknown widget type: ${widgetType}`)
            return
          }
          
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
        } catch (error) {
          console.error('Failed to add widget to layout:', error)
        }
      },
      
      removeWidgetFromLayout: (widgetId: string) => {
        try {
          set((state) => ({
            layout: state.layout.filter(item => item.i !== widgetId),
          }))
        } catch (error) {
          console.error('Failed to remove widget from layout:', error)
        }
      },
      
      resetLayout: () => {
        try {
          set({ layout: defaultLayout })
          console.log('Layout reset to default')
        } catch (error) {
          console.error('Failed to reset layout:', error)
        }
      },
    }),
    {
      name: 'smart-display-layout',
      version: 1,
      onRehydrateStorage: () => {
        console.log('Layout store hydration started')
        return (state: LayoutState | undefined, error: unknown) => {
          if (error) {
            console.error('Layout store hydration failed:', error)
            // Reset to default layout on hydration error
            state?.resetLayout?.()
          } else {
            console.log('Layout store hydrated successfully with', state?.layout?.length || 0, 'items')
          }
        }
      },
    }
  )
)