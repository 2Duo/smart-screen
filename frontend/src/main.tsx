import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { initializeSecurity } from './utils/cryptoUtils'
import { registerServiceWorker, lockOrientation, preventSleep, disableKeyboardShortcuts, isPWAMode } from './utils/pwa'
import './index.css'

// Initialize security measures
initializeSecurity()

// Initialize PWA features
registerServiceWorker()

// PWA initialization
const initializePWA = async () => {
  await lockOrientation()
  await preventSleep()
  
  if (isPWAMode()) {
    disableKeyboardShortcuts()
  }
  
  if (import.meta.env.DEV) {
    console.log('PWA initialized, mode:', isPWAMode() ? 'PWA' : 'Browser')
  }
}

initializePWA()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000,
    },
  },
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

let AppComponent = App

// TestApp only available in development
if (import.meta.env.DEV && window.location.search.includes('test=true')) {
  const { default: TestApp } = await import('./TestApp')
  AppComponent = TestApp
}

if (import.meta.env.DEV) {
  console.log('React app starting...')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {AppComponent === App ? (
      <QueryClientProvider client={queryClient}>
        <AppComponent />
      </QueryClientProvider>
    ) : (
      <AppComponent />
    )}
  </React.StrictMode>
)