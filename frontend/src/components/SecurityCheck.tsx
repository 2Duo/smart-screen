/**
 * Security validation component to ensure all security measures are active
 */

import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'

interface SecurityStatus {
  csp: boolean
  secureStorage: boolean
  https: boolean
  headers: boolean
}

export function SecurityCheck() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    csp: false,
    secureStorage: false,
    https: false,
    headers: false
  })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const checkSecurity = () => {
      // Check CSP
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      const csp = !!cspMeta

      // Check secure storage
      const secureStorage = !!sessionStorage.getItem('_sk')

      // Check HTTPS in production
      const https = location.protocol === 'https:' || location.hostname === 'localhost'

      // Check security headers
      const headers = !!(
        document.querySelector('meta[http-equiv="X-Content-Type-Options"]') &&
        document.querySelector('meta[http-equiv="X-Frame-Options"]') &&
        document.querySelector('meta[http-equiv="X-XSS-Protection"]')
      )

      setSecurityStatus({ csp, secureStorage, https, headers })
    }

    checkSecurity()
    
    // Recheck security status every 5 seconds
    const interval = setInterval(checkSecurity, 5000)
    return () => clearInterval(interval)
  }, [])

  const allSecure = Object.values(securityStatus).every(status => status)
  const hasIssues = Object.values(securityStatus).some(status => !status)

  if (import.meta.env.PROD && allSecure) {
    // In production, don't show anything if all is secure
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          allSecure 
            ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
        }`}
      >
        {allSecure ? (
          <CheckCircle size={16} />
        ) : (
          <AlertTriangle size={16} />
        )}
        <Shield size={16} />
        <span>Security</span>
      </button>

      {showDetails && (
        <div className="absolute bottom-12 left-0 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-4 min-w-64">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Shield size={16} />
            Security Status
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${securityStatus.csp ? 'text-green-300' : 'text-red-300'}`}>
              {securityStatus.csp ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              <span>Content Security Policy</span>
            </div>
            
            <div className={`flex items-center gap-2 ${securityStatus.secureStorage ? 'text-green-300' : 'text-red-300'}`}>
              {securityStatus.secureStorage ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              <span>Encrypted Storage</span>
            </div>
            
            <div className={`flex items-center gap-2 ${securityStatus.https ? 'text-green-300' : 'text-red-300'}`}>
              {securityStatus.https ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              <span>HTTPS Connection</span>
            </div>
            
            <div className={`flex items-center gap-2 ${securityStatus.headers ? 'text-green-300' : 'text-red-300'}`}>
              {securityStatus.headers ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              <span>Security Headers</span>
            </div>
          </div>

          {hasIssues && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400">
                Some security features are not active. This may be expected in development.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}