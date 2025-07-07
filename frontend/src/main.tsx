import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import TestApp from './TestApp'
import { initializeSecurity } from './utils/cryptoUtils'
import './index.css'

// Initialize security measures
initializeSecurity()

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