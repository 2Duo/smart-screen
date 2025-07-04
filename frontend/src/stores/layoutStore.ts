import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Layout, LayoutItem } from '../../../shared/types'

interface LayoutState {
  layout: Layout
  updateLayout: (newLayout: Layout) => void
  updateLayoutItem: (item: LayoutItem) => void
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
      
      resetLayout: () => {
        set({ layout: defaultLayout })
      },
    }),
    {
      name: 'smart-display-layout',
      version: 1,
    }
  )
)