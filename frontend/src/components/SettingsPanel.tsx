import React, { useState, useRef, useEffect } from 'react'
import { X, Monitor, Upload, RotateCcw, Maximize, Minimize } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { toggleFullscreen, isPWAMode } from '../utils/pwa'

interface SettingsPanelProps {
  onClose: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const {
    settings,
    updateUIStyle,
    updateBackgroundType,
    updateBackgroundImage,
    updateBackgroundColor,
    updateBackgroundOpacity,
    resetSettings
  } = useSettingsStore()
  
  const [activeTab, setActiveTab] = useState<'appearance' | 'background' | 'display'>('appearance')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // フルスクリーン状態監視
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    setIsPWA(isPWAMode())
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        updateBackgroundImage(result)
        updateBackgroundType('image')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveBackground = () => {
    updateBackgroundImage('')
    updateBackgroundType('gradient')
  }

  const handleToggleFullscreen = async () => {
    await toggleFullscreen()
  }

  return (
    <div className="absolute top-24 right-8 z-50 w-96 max-h-[calc(100vh-8rem)]">
      {/* Panel container */}
      <div className={`backdrop-blur-3xl border rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col ${
        settings.appearance.uiStyle === 'liquid-glass'
          ? 'bg-gradient-to-br from-white/[0.08] via-white/5 to-white/[0.08] border-white/20 shadow-black/20'
          : 'bg-white/95 border-gray-200 shadow-gray-500/20'
      }`}>
        {/* Header */}
        <div className={`border-b p-6 flex-shrink-0 ${
          settings.appearance.uiStyle === 'liquid-glass'
            ? 'bg-gradient-to-r from-blue-400/15 via-purple-400/10 to-indigo-400/15 border-white/15'
            : 'bg-blue-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl ${
                settings.appearance.uiStyle === 'liquid-glass'
                  ? 'bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-xl'
                  : 'bg-blue-100'
              }`}>
                <Monitor size={22} className={
                  settings.appearance.uiStyle === 'liquid-glass'
                    ? 'text-blue-200'
                    : 'text-blue-600'
                } />
              </div>
              <h3 className={`font-bold text-xl tracking-wide ${
                settings.appearance.uiStyle === 'liquid-glass'
                  ? 'text-white'
                  : 'text-gray-800'
              }`}>
                全体設定
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl border ${
                settings.appearance.uiStyle === 'liquid-glass'
                  ? 'bg-white/10 hover:bg-white/15 border-white/10 hover:border-white/20'
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300'
              }`}
            >
              <X size={18} className={
                settings.appearance.uiStyle === 'liquid-glass'
                  ? 'text-white/70'
                  : 'text-gray-600'
              } />
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className={`flex gap-2 p-2 mx-5 mb-0 flex-shrink-0 rounded-2xl backdrop-blur-xl border ${
          settings.appearance.uiStyle === 'liquid-glass'
            ? 'bg-gradient-to-r from-white/10 to-white/15 border-white/20'
            : 'bg-gray-100 border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'appearance'
                ? settings.appearance.uiStyle === 'liquid-glass'
                  ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-white border border-blue-300/30 shadow-lg'
                  : 'bg-blue-100 border border-blue-200 text-blue-700 shadow-md'
                : settings.appearance.uiStyle === 'liquid-glass'
                  ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            外観
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'background'
                ? settings.appearance.uiStyle === 'liquid-glass'
                  ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-white border border-blue-300/30 shadow-lg'
                  : 'bg-blue-100 border border-blue-200 text-blue-700 shadow-md'
                : settings.appearance.uiStyle === 'liquid-glass'
                  ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            背景
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              activeTab === 'display'
                ? settings.appearance.uiStyle === 'liquid-glass'
                  ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-white border border-blue-300/30 shadow-lg'
                  : 'bg-blue-100 border border-blue-200 text-blue-700 shadow-md'
                : settings.appearance.uiStyle === 'liquid-glass'
                  ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            表示
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
          {activeTab === 'appearance' && (
            <>
              {/* UI Style Selection */}
              <div>
                <h4 className={`text-sm font-medium mb-3 ${
                  settings.appearance.uiStyle === 'liquid-glass'
                    ? 'text-white/80'
                    : 'text-gray-700'
                }`}>
                  デザインスタイル
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => updateUIStyle('liquid-glass')}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium ${
                      settings.appearance.uiStyle === 'liquid-glass'
                        ? 'bg-gradient-to-r from-blue-400/20 to-purple-400/20 border-blue-300/30 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold mb-1">Liquid Glass</div>
                    <div className={`text-xs ${
                      settings.appearance.uiStyle === 'liquid-glass'
                        ? 'text-white/60'
                        : 'text-gray-500'
                    }`}>
                      透明感のあるガラス風デザイン
                    </div>
                  </button>
                  <button
                    onClick={() => updateUIStyle('material-you')}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium ${
                      settings.appearance.uiStyle === 'material-you'
                        ? 'bg-gradient-to-r from-blue-400/20 to-purple-400/20 border-blue-300/30 text-white'
                        : settings.appearance.uiStyle === 'liquid-glass'
                          ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold mb-1">Material You</div>
                    <div className={`text-xs ${
                      settings.appearance.uiStyle === 'liquid-glass'
                        ? 'text-white/60'
                        : 'text-gray-500'
                    }`}>
                      モダンなマテリアルデザイン
                    </div>
                  </button>
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={resetSettings}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'bg-red-400/10 border-red-400/20 text-red-300 hover:bg-red-400/20'
                      : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <RotateCcw size={16} />
                  設定をリセット
                </button>
              </div>
            </>
          )}

          {activeTab === 'background' && (
            <>
              {/* Background Type */}
              <div>
                <h4 className={`text-sm font-medium mb-3 ${
                  settings.appearance.uiStyle === 'liquid-glass'
                    ? 'text-white/80'
                    : 'text-gray-700'
                }`}>
                  背景タイプ
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => updateBackgroundType('gradient')}
                    className={`w-full text-left p-3 rounded-xl border text-sm font-medium ${
                      settings.appearance.backgroundType === 'gradient'
                        ? 'bg-gradient-to-r from-blue-400/20 to-purple-400/20 border-blue-300/30 text-white'
                        : settings.appearance.uiStyle === 'liquid-glass'
                          ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    グラデーション
                  </button>
                  <button
                    onClick={() => updateBackgroundType('image')}
                    className={`w-full text-left p-3 rounded-xl border text-sm font-medium ${
                      settings.appearance.backgroundType === 'image'
                        ? 'bg-gradient-to-r from-blue-400/20 to-purple-400/20 border-blue-300/30 text-white'
                        : settings.appearance.uiStyle === 'liquid-glass'
                          ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    画像
                  </button>
                  <button
                    onClick={() => updateBackgroundType('solid')}
                    className={`w-full text-left p-3 rounded-xl border text-sm font-medium ${
                      settings.appearance.backgroundType === 'solid'
                        ? 'bg-gradient-to-r from-blue-400/20 to-purple-400/20 border-blue-300/30 text-white'
                        : settings.appearance.uiStyle === 'liquid-glass'
                          ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    単色
                  </button>
                </div>
              </div>

              {/* Image Upload */}
              {settings.appearance.backgroundType === 'image' && (
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'text-white/80'
                      : 'text-gray-700'
                  }`}>
                    背景画像
                  </h4>
                  
                  {settings.appearance.backgroundImage ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={settings.appearance.backgroundImage}
                          alt="Background preview"
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <button
                          onClick={handleRemoveBackground}
                          className="absolute top-2 right-2 p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30"
                        >
                          <X size={14} className="text-red-300" />
                        </button>
                      </div>
                      <button
                        onClick={handleUploadClick}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium ${
                          settings.appearance.uiStyle === 'liquid-glass'
                            ? 'bg-blue-400/10 border-blue-400/20 text-blue-300 hover:bg-blue-400/20'
                            : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <Upload size={16} />
                        画像を変更
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleUploadClick}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border border-dashed text-sm font-medium ${
                        settings.appearance.uiStyle === 'liquid-glass'
                          ? 'border-white/20 text-white/60 hover:bg-white/10'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Upload size={16} />
                      画像をアップロード
                    </button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Color Selection */}
              {settings.appearance.backgroundType === 'solid' && (
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'text-white/80'
                      : 'text-gray-700'
                  }`}>
                    背景色
                  </h4>
                  
                  {/* Color Presets */}
                  <div className="mb-4">
                    <div className={`text-xs mb-2 ${
                      settings.appearance.uiStyle === 'liquid-glass'
                        ? 'text-white/60'
                        : 'text-gray-500'
                    }`}>
                      プリセット
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        '#1e293b', '#0f172a', '#312e81', '#581c87', '#7c2d12', '#991b1b',
                        '#1f2937', '#374151', '#4c1d95', '#6b21a8', '#9a3412', '#dc2626',
                        '#064e3b', '#065f46', '#0c4a6e', '#1e40af', '#c2410c', '#ea580c'
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateBackgroundColor(color)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all duration-300 ${
                            settings.appearance.backgroundColor === color
                              ? 'border-white scale-110 shadow-lg'
                              : 'border-white/20 hover:border-white/40 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Color Input */}
                  <div>
                    <div className={`text-xs mb-2 ${
                      settings.appearance.uiStyle === 'liquid-glass'
                        ? 'text-white/60'
                        : 'text-gray-500'
                    }`}>
                      カスタムカラー
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.appearance.backgroundColor || '#1e293b'}
                        onChange={(e) => updateBackgroundColor(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.appearance.backgroundColor || '#1e293b'}
                        onChange={(e) => updateBackgroundColor(e.target.value)}
                        placeholder="#1e293b"
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                          settings.appearance.uiStyle === 'liquid-glass'
                            ? 'bg-white/10 border-white/20 text-white placeholder-white/40'
                            : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Background Opacity */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-sm font-medium ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'text-white/80'
                      : 'text-gray-700'
                  }`}>
                    背景の透明度
                  </h4>
                  <span className={`text-sm font-medium px-3 py-1 rounded-xl ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'bg-gradient-to-r from-blue-400/20 to-purple-400/20 text-white backdrop-blur-xl border border-white/20'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}>
                    {Math.round(settings.appearance.backgroundOpacity * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.appearance.backgroundOpacity}
                    onChange={(e) => updateBackgroundOpacity(parseFloat(e.target.value))}
                    className={`w-full h-3 rounded-2xl appearance-none cursor-pointer slider backdrop-blur-xl ${
                      settings.appearance.uiStyle === 'liquid-glass'
                        ? 'bg-gradient-to-r from-white/10 to-white/20'
                        : 'bg-gray-200'
                    }`}
                  />
                  <div className={`flex justify-between text-sm mt-3 px-1 ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'text-white/60'
                      : 'text-gray-500'
                  }`}>
                    <span className="font-medium">透明</span>
                    <span className="font-medium">中間</span>
                    <span className="font-medium">不透明</span>
                  </div>
                </div>
                
                <style>{`
                  .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #60a5fa, #a78bfa);
                    cursor: pointer;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    transition: all 0.3s ease;
                  }
                  .slider::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
                  }
                  .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #60a5fa, #a78bfa);
                    cursor: pointer;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                  }
                `}</style>
              </div>
            </>
          )}

          {activeTab === 'display' && (
            <>
              {/* フルスクリーン切り替え */}
              {!isPWA && (
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'text-white/80'
                      : 'text-gray-700'
                  }`}>
                    画面モード
                  </h4>
                  <button
                    onClick={handleToggleFullscreen}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all duration-300 ${
                      settings.appearance.uiStyle === 'liquid-glass'
                        ? 'bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 border-white/20 hover:border-white/30 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isFullscreen ? (
                        <Minimize size={18} className={
                          settings.appearance.uiStyle === 'liquid-glass'
                            ? 'text-blue-300'
                            : 'text-blue-600'
                        } />
                      ) : (
                        <Maximize size={18} className={
                          settings.appearance.uiStyle === 'liquid-glass'
                            ? 'text-blue-300'
                            : 'text-blue-600'
                        } />
                      )}
                      <div>
                        <div className="font-medium">
                          {isFullscreen ? 'フルスクリーン解除' : 'フルスクリーン表示'}
                        </div>
                        <div className={`text-xs ${
                          settings.appearance.uiStyle === 'liquid-glass'
                            ? 'text-white/60'
                            : 'text-gray-500'
                        }`}>
                          {isFullscreen ? 'ウィンドウモードに戻します' : '画面全体に表示します'}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {isPWA && (
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'text-white/80'
                      : 'text-gray-700'
                  }`}>
                    画面モード
                  </h4>
                  <div className={`p-4 rounded-xl border text-sm ${
                    settings.appearance.uiStyle === 'liquid-glass'
                      ? 'bg-gradient-to-r from-green-400/10 to-blue-400/10 border-green-400/20 text-green-300'
                      : 'bg-green-50 border-green-200 text-green-700'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Monitor size={18} className="text-green-400" />
                      <div>
                        <div className="font-medium">PWAモード</div>
                        <div className={`text-xs ${
                          settings.appearance.uiStyle === 'liquid-glass'
                            ? 'text-green-200/80'
                            : 'text-green-600'
                        }`}>
                          アプリとして全画面表示中
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}