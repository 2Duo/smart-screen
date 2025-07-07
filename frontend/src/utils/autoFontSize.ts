import { useEffect, useState, useRef } from 'react'

/**
 * ウィジェットのサイズに基づいて適切な文字サイズを計算する
 * @param width ウィジェットの幅
 * @param height ウィジェットの高さ
 * @param textType テキストの種類（primary, secondary, tertiary）
 * @returns 適切な文字サイズ（px）
 */
export function calculateAutoFontSize(
  width: number,
  height: number,
  textType: 'primary' | 'secondary' | 'tertiary' = 'primary'
): number {
  // ウィジェットの面積を基準に基本サイズを計算
  const area = width * height
  const baseSize = Math.sqrt(area) * 0.25
  
  // テキストタイプに応じた係数
  const typeMultiplier = {
    primary: 1.0,
    secondary: 0.7,
    tertiary: 0.5
  }[textType]
  
  // 最小・最大サイズの制限
  const minSize = 32
  const maxSize = 128
  
  const calculatedSize = Math.round(baseSize * typeMultiplier)
  
  return Math.max(minSize, Math.min(maxSize, calculatedSize))
}

/**
 * ウィジェットのサイズを監視し、自動で文字サイズを調整するカスタムフック
 * @param enabled 自動調整を有効にするかどうか
 * @param manualSize 手動で設定された文字サイズ
 * @param textType テキストの種類
 * @returns [ref, fontSize] - 監視対象の要素のref と 計算された文字サイズ
 */
export function useAutoFontSize(
  enabled: boolean,
  manualSize?: number,
  textType: 'primary' | 'secondary' | 'tertiary' = 'primary'
): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState<number>(manualSize || 48)
  
  useEffect(() => {
    if (!enabled || !ref.current) {
      if (manualSize) {
        setFontSize(manualSize)
      }
      return
    }
    
    const updateFontSize = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect()
        const newSize = calculateAutoFontSize(width, height, textType)
        setFontSize(newSize)
      }
    }
    
    // 初回実行
    updateFontSize()
    
    // リサイズイベントの監視
    const resizeObserver = new ResizeObserver(updateFontSize)
    resizeObserver.observe(ref.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [enabled, manualSize, textType])
  
  return [ref, fontSize]
}

/**
 * 複数のテキスト要素の文字サイズを一括で管理するカスタムフック
 * @param enabled 自動調整を有効にするかどうか
 * @param manualSize 手動で設定された文字サイズ
 * @returns [ref, fontSizes] - 監視対象の要素のref と 各テキストタイプの文字サイズ
 */
export function useMultiAutoFontSize(
  enabled: boolean,
  manualSize?: number
): [React.RefObject<HTMLDivElement>, { primary: number; secondary: number; tertiary: number }] {
  const ref = useRef<HTMLDivElement>(null)
  const [fontSizes, setFontSizes] = useState({
    primary: manualSize || 48,
    secondary: manualSize ? Math.round(manualSize * 0.7) : 32,
    tertiary: manualSize ? Math.round(manualSize * 0.5) : 24
  })
  
  useEffect(() => {
    if (!enabled || !ref.current) {
      if (manualSize) {
        setFontSizes({
          primary: manualSize,
          secondary: Math.round(manualSize * 0.7),
          tertiary: Math.round(manualSize * 0.5)
        })
      }
      return
    }
    
    const updateFontSizes = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect()
        setFontSizes({
          primary: calculateAutoFontSize(width, height, 'primary'),
          secondary: calculateAutoFontSize(width, height, 'secondary'),
          tertiary: calculateAutoFontSize(width, height, 'tertiary')
        })
      }
    }
    
    // 初回実行
    updateFontSizes()
    
    // リサイズイベントの監視
    const resizeObserver = new ResizeObserver(updateFontSizes)
    resizeObserver.observe(ref.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [enabled, manualSize])
  
  return [ref, fontSizes]
}