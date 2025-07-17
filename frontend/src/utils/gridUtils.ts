import type { Layout } from '../../../shared/types'

/**
 * Grid layout utilities for smart widget placement
 */

// React Grid Layout configuration (should match App.tsx)
export const GRID_CONFIG = {
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight: 100,
  margin: [16, 16] as [number, number],
} as const

export interface GridDimensions {
  cols: number
  rows: number
  breakpoint: string
}

export interface SpaceAvailability {
  hasSpace: boolean
  availableSpaces: Array<{
    x: number
    y: number
    w: number
    h: number
  }>
  maxContinuousSpace: {
    x: number
    y: number
    w: number
    h: number
  } | null
}

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(): string {
  if (typeof window === 'undefined') return 'lg'
  
  const width = window.innerWidth
  if (width >= GRID_CONFIG.breakpoints.lg) return 'lg'
  if (width >= GRID_CONFIG.breakpoints.md) return 'md'
  if (width >= GRID_CONFIG.breakpoints.sm) return 'sm'
  if (width >= GRID_CONFIG.breakpoints.xs) return 'xs'
  return 'xxs'
}

/**
 * Get number of columns for current breakpoint
 */
export function getCurrentCols(): number {
  const breakpoint = getCurrentBreakpoint()
  return GRID_CONFIG.cols[breakpoint as keyof typeof GRID_CONFIG.cols]
}

/**
 * Calculate available viewport dimensions for grid
 */
export function getViewportGridDimensions(): GridDimensions {
  if (typeof window === 'undefined') {
    return { cols: 12, rows: 6, breakpoint: 'lg' }
  }
  
  const breakpoint = getCurrentBreakpoint()
  const cols = getCurrentCols()
  
  // Calculate available viewport height
  // Account for: header (top controls), margins, and some padding
  const reservedHeight = 200 // Top controls + margins + padding
  const availableHeight = window.innerHeight - reservedHeight
  
  // Calculate how many rows fit in the viewport
  const rowHeightWithMargin = GRID_CONFIG.rowHeight + GRID_CONFIG.margin[1]
  const rows = Math.floor(availableHeight / rowHeightWithMargin)
  
  return {
    cols,
    rows: Math.max(rows, 3), // Minimum 3 rows
    breakpoint
  }
}

/**
 * Create a 2D grid map of occupied spaces
 */
export function createOccupancyMap(layout: Layout, gridDimensions: GridDimensions): boolean[][] {
  const { cols, rows } = gridDimensions
  
  // Initialize grid with false (empty)
  const grid: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false))
  
  // Mark occupied spaces
  layout.forEach(item => {
    const { x, y, w, h } = item
    
    // Mark all cells occupied by this widget
    for (let row = y; row < Math.min(y + h, rows); row++) {
      for (let col = x; col < Math.min(x + w, cols); col++) {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          grid[row][col] = true
        }
      }
    }
  })
  
  return grid
}

/**
 * Find available spaces in the grid for a widget of given size
 */
export function findAvailableSpaces(
  layout: Layout,
  requiredWidth: number,
  requiredHeight: number,
  gridDimensions: GridDimensions
): SpaceAvailability {
  const occupancyMap = createOccupancyMap(layout, gridDimensions)
  const { cols, rows } = gridDimensions
  
  const availableSpaces: Array<{ x: number; y: number; w: number; h: number }> = []
  let maxContinuousSpace: { x: number; y: number; w: number; h: number } | null = null
  let maxArea = 0
  
  // Search for spaces that can fit the required dimensions
  for (let y = 0; y <= rows - requiredHeight; y++) {
    for (let x = 0; x <= cols - requiredWidth; x++) {
      // Check if this position can fit the widget
      let canFit = true
      
      for (let dy = 0; dy < requiredHeight && canFit; dy++) {
        for (let dx = 0; dx < requiredWidth && canFit; dx++) {
          if (occupancyMap[y + dy][x + dx]) {
            canFit = false
          }
        }
      }
      
      if (canFit) {
        // Found a space that fits exactly
        availableSpaces.push({
          x,
          y,
          w: requiredWidth,
          h: requiredHeight
        })
        
        // Also check for larger continuous spaces starting from this position
        let maxW = requiredWidth
        let maxH = requiredHeight
        
        // Expand width
        while (x + maxW < cols) {
          let canExpandW = true
          for (let dy = 0; dy < maxH && canExpandW; dy++) {
            if (occupancyMap[y + dy][x + maxW]) {
              canExpandW = false
            }
          }
          if (canExpandW) {
            maxW++
          } else {
            break
          }
        }
        
        // Expand height
        while (y + maxH < rows) {
          let canExpandH = true
          for (let dx = 0; dx < maxW && canExpandH; dx++) {
            if (occupancyMap[y + maxH][x + dx]) {
              canExpandH = false
            }
          }
          if (canExpandH) {
            maxH++
          } else {
            break
          }
        }
        
        const area = maxW * maxH
        if (area > maxArea) {
          maxArea = area
          maxContinuousSpace = { x, y, w: maxW, h: maxH }
        }
      }
    }
  }
  
  return {
    hasSpace: availableSpaces.length > 0,
    availableSpaces,
    maxContinuousSpace
  }
}

/**
 * Find the best position for a new widget
 */
export function findBestWidgetPosition(
  layout: Layout,
  widgetWidth: number,
  widgetHeight: number,
  minWidth: number,
  minHeight: number
): {
  success: boolean
  position: { x: number; y: number; w: number; h: number } | null
  suggestions: Array<{ x: number; y: number; w: number; h: number }>
  error?: string
} {
  const gridDimensions = getViewportGridDimensions()
  
  // First, try to place with requested dimensions
  let spaceCheck = findAvailableSpaces(layout, widgetWidth, widgetHeight, gridDimensions)
  
  if (spaceCheck.hasSpace && spaceCheck.availableSpaces.length > 0) {
    // Found space with requested dimensions
    const bestSpace = spaceCheck.availableSpaces[0] // Take the first (top-left) available space
    return {
      success: true,
      position: bestSpace,
      suggestions: spaceCheck.availableSpaces.slice(1) // Alternative positions
    }
  }
  
  // If no space with requested dimensions, try with minimum dimensions
  spaceCheck = findAvailableSpaces(layout, minWidth, minHeight, gridDimensions)
  
  if (spaceCheck.hasSpace && spaceCheck.availableSpaces.length > 0) {
    // Found space with minimum dimensions
    const bestSpace = spaceCheck.availableSpaces[0]
    return {
      success: true,
      position: bestSpace,
      suggestions: spaceCheck.availableSpaces.slice(1),
      error: `空きスペースが限られているため、ウィジェットサイズを ${minWidth}×${minHeight} に調整しました。`
    }
  }
  
  // No space available at all
  return {
    success: false,
    position: null,
    suggestions: [],
    error: `画面に十分な空きスペースがありません。既存のウィジェットを移動または削除してください。\n必要スペース: ${widgetWidth}×${widgetHeight} (最小: ${minWidth}×${minHeight})\n利用可能な画面サイズ: ${gridDimensions.cols}×${gridDimensions.rows}`
  }
}

/**
 * Get debug information about the current grid state
 */
export function getGridDebugInfo(layout: Layout) {
  const gridDimensions = getViewportGridDimensions()
  const occupancyMap = createOccupancyMap(layout, gridDimensions)
  
  return {
    gridDimensions,
    occupancyMap,
    occupiedCells: occupancyMap.flat().filter(cell => cell).length,
    totalCells: gridDimensions.cols * gridDimensions.rows,
    occupancyRate: Math.round((occupancyMap.flat().filter(cell => cell).length / (gridDimensions.cols * gridDimensions.rows)) * 100)
  }
}