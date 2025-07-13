import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import TestApp from './TestApp'
import { initializeSecurity } from './utils/cryptoUtils'
import { registerServiceWorker, lockOrientation, preventSleep, disableKeyboardShortcuts, isPWAMode } from './utils/pwa'
import './index.css'

// Initialize security measures
initializeSecurity()

// Initialize PWA features
registerServiceWorker()

// PWA initialization
const initializePWA = async () => {
  // 向き固定（横向き）
  await lockOrientation()
  
  // スリープ防止
  await preventSleep()
  
  // キオスクモード用のキーボードショートカット無効化
  if (isPWAMode()) {
    disableKeyboardShortcuts()
  }
  
  console.log('PWA initialized, mode:', isPWAMode() ? 'PWA' : 'Browser')
}

// 初期化実行
initializePWA()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

console.log('main.tsx starting...')

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
} else {
  console.log('Creating React root...')
  
  // Use TestApp to debug, switch back to App when working
  const useTestMode = window.location.search.includes('test=true')
  console.log('Test mode:', useTestMode)
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {useTestMode ? (
        <TestApp />
      ) : (
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      )}
    </React.StrictMode>,
  )
  console.log('React app rendered')
}