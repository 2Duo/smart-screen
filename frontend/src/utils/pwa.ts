// PWA関連のユーティリティ関数

// Service Worker登録
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // アップデート時の処理
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker available. Refresh to update.');
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// フルスクリーンモード切り替え
export const toggleFullscreen = async (): Promise<boolean> => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return true;
    } else {
      await document.exitFullscreen();
      return false;
    }
  } catch (error) {
    console.error('Fullscreen toggle failed:', error);
    return false;
  }
};

// PWAインストール可能性チェック
export const checkPWAInstallable = (): Promise<boolean> => {
  return new Promise((resolve) => {
    let deferredPrompt: any = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      resolve(true);
    });
    
    // タイムアウト後にfalseを返す
    setTimeout(() => {
      if (!deferredPrompt) {
        resolve(false);
      }
    }, 1000);
  });
};

// PWAインストールプロンプト表示
export const showInstallPrompt = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    let deferredPrompt: any = null;
    
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
    };
    
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    setTimeout(async () => {
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`PWA install outcome: ${outcome}`);
          resolve(outcome === 'accepted');
        } catch (error) {
          console.error('PWA install prompt failed:', error);
          resolve(false);
        } finally {
          deferredPrompt = null;
          window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
        }
      } else {
        resolve(false);
      }
    }, 100);
  });
};

// デバイス向き固定（横向き）
export const lockOrientation = async (): Promise<boolean> => {
  try {
    if ('orientation' in screen && 'lock' in screen.orientation) {
      await (screen.orientation as any).lock('landscape');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Orientation lock failed:', error);
    return false;
  }
};

// スリープ防止（Wake Lock API）
let wakeLock: any = null;

export const preventSleep = async (): Promise<boolean> => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('Wake lock activated');
      
      wakeLock.addEventListener('release', () => {
        console.log('Wake lock released');
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Wake lock failed:', error);
    return false;
  }
};

export const allowSleep = (): void => {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
};

// キオスクモード向けキーボードショートカット無効化
export const disableKeyboardShortcuts = (): void => {
  document.addEventListener('keydown', (e) => {
    // F11, F12, Ctrl+R, Ctrl+Shift+I など
    if (
      e.key === 'F11' ||
      e.key === 'F12' ||
      (e.ctrlKey && e.key === 'r') ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.key === 'u')
    ) {
      e.preventDefault();
      return false;
    }
  });
  
  // 右クリック無効化
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
};

// PWA状態チェック
export const isPWAMode = (): boolean => {
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

// ネットワーク状態監視
export const monitorNetworkStatus = (callback: (online: boolean) => void): void => {
  const updateOnlineStatus = () => {
    callback(navigator.onLine);
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // 初期状態
  updateOnlineStatus();
};