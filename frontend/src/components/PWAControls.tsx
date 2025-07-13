import React, { useState, useEffect } from 'react'
import { Monitor, Download, Maximize, Minimize, Smartphone, Wifi, WifiOff } from 'lucide-react'
import { toggleFullscreen, showInstallPrompt, isPWAMode, monitorNetworkStatus } from '../utils/pwa'
import { useSettingsStore } from '../stores/settingsStore'

export const PWAControls: React.FC = () => {
  const { settings } = useSettingsStore()
  const uiStyle = settings?.appearance?.uiStyle || 'liquid-glass'
  const isLiquidGlass = uiStyle === 'liquid-glass'
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // PWAモード検出
    setIsPWA(isPWAMode())
    
    // フルスクリーン状態監視
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // インストール可能性監視
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setCanInstall(true)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // ネットワーク状態監視
    monitorNetworkStatus(setIsOnline)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleToggleFullscreen = async () => {
    await toggleFullscreen()
  }

  const handleInstallPWA = async () => {
    const installed = await showInstallPrompt()
    if (installed) {
      setCanInstall(false)
    }
  }

  const buttonClass = isLiquidGlass
    ? 'p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-300'
    : 'p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 transition-all duration-300'
    
  const iconClass = isLiquidGlass
    ? 'text-white/70 hover:text-white'
    : 'text-gray-600 hover:text-gray-800'

  return (
    <div className="flex items-center gap-2">
      {/* ネットワーク状態 */}
      <div className={`${buttonClass} ${isOnline ? 'opacity-100' : 'opacity-50'}`} title={isOnline ? 'オンライン' : 'オフライン'}>
        {isOnline ? (
          <Wifi size={18} className={`${iconClass} text-green-400`} />
        ) : (
          <WifiOff size={18} className={`${iconClass} text-red-400`} />
        )}
      </div>

      {/* PWAモード表示 */}
      {isPWA && (
        <div className={buttonClass} title="PWAモード">
          <Smartphone size={18} className={`${iconClass} text-blue-400`} />
        </div>
      )}

      {/* フルスクリーン切り替え */}
      {!isPWA && (
        <button
          onClick={handleToggleFullscreen}
          className={buttonClass}
          title={isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン'}
        >
          {isFullscreen ? (
            <Minimize size={18} className={iconClass} />
          ) : (
            <Maximize size={18} className={iconClass} />
          )}
        </button>
      )}

      {/* PWAインストール */}
      {canInstall && !isPWA && (
        <button
          onClick={handleInstallPWA}
          className={`${buttonClass} bg-blue-500/20 border-blue-400/30`}
          title="アプリとしてインストール"
        >
          <Download size={18} className="text-blue-300" />
        </button>
      )}

      {/* デバイス表示モード */}
      <div className={buttonClass} title="ディスプレイモード">
        <Monitor size={18} className={iconClass} />
      </div>
    </div>
  )
}