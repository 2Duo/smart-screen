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
  textType: 'primary' | 'secondary' | 'tertiary' | 'details' = 'primary'
): number {
  // ウィジェットの面積を基準に基本サイズを計算（係数を小さく調整）
  const area = width * height
  const baseSize = Math.sqrt(area) * 0.12
  
  // テキストタイプに応じた係数
  const typeMultiplier = {
    primary: 1.0,
    secondary: 0.7,
    tertiary: 0.5,
    details: 0.3
  }[textType]
  
  // 最小・最大サイズの制限（より小さく調整）
  const minSizes = {
    primary: 14,
    secondary: 12,
    tertiary: 10,
    details: 8
  }[textType]
  
  const maxSizes = {
    primary: 64,
    secondary: 48,
    tertiary: 36,
    details: 24
  }[textType]
  
  const calculatedSize = Math.round(baseSize * typeMultiplier)
  
  return Math.max(minSizes, Math.min(maxSizes, calculatedSize))
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
  textType: 'primary' | 'secondary' | 'tertiary' | 'details' = 'primary'
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
): [React.RefObject<HTMLDivElement>, { primary: number; secondary: number; tertiary: number; details: number }] {
  const ref = useRef<HTMLDivElement>(null)
  const [fontSizes, setFontSizes] = useState({
    primary: manualSize || 48,
    secondary: manualSize ? Math.round(manualSize * 0.7) : 32,
    tertiary: manualSize ? Math.round(manualSize * 0.5) : 24,
    details: manualSize ? Math.round(manualSize * 0.3) : 16
  })
  
  useEffect(() => {
    if (!enabled || !ref.current) {
      if (manualSize) {
        setFontSizes({
          primary: manualSize,
          secondary: Math.round(manualSize * 0.7),
          tertiary: Math.round(manualSize * 0.5),
          details: Math.round(manualSize * 0.3)
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
          tertiary: calculateAutoFontSize(width, height, 'tertiary'),
          details: calculateAutoFontSize(width, height, 'details')
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