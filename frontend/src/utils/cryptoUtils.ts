/**
 * Secure localStorage utilities with AES encryption
 */

import CryptoJS from 'crypto-js'
import DOMPurify from 'dompurify'

const STORAGE_VERSION = '1.0'
const ENCRYPTION_ITERATIONS = 10000

interface EncryptedData {
  version: string
  salt: string
  iv: string
  data: string
  timestamp: number
}

class SecureStorage {
  private readonly appKey: string
  private masterKey: string | null = null

  constructor() {
    // Generate app-specific key based on domain and app name
    this.appKey = this.generateAppKey()
    this.initializeMasterKey()
  }

  private generateAppKey(): string {
    const appIdentifier = `smart-display-${window.location.hostname}-${STORAGE_VERSION}`
    return CryptoJS.SHA256(appIdentifier).toString()
  }

  private initializeMasterKey(): void {
    // Try to get existing master key from localStorage (persistent)
    const persistentKey = localStorage.getItem('_sdk_key')
    if (persistentKey) {
      this.masterKey = persistentKey
      return
    }

    // Generate new master key and store persistently
    this.masterKey = this.generateSecureKey()
    localStorage.setItem('_sdk_key', this.masterKey)
    
    // Also store in session for faster access
    sessionStorage.setItem('_sk', this.masterKey)
  }

  private generateSecureKey(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36)
    const userAgent = navigator.userAgent
    const combined = `${this.appKey}-${timestamp}-${random}-${userAgent}`
    return CryptoJS.SHA256(combined).toString()
  }

  private deriveKey(salt: string): string {
    if (!this.masterKey) {
      throw new Error('Master key not initialized')
    }
    
    return CryptoJS.PBKDF2(this.masterKey, salt, {
      keySize: 256 / 32,
      iterations: ENCRYPTION_ITERATIONS
    }).toString()
  }

  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(16).toString()
  }

  private generateIV(): string {
    return CryptoJS.lib.WordArray.random(16).toString()
  }

  /**
   * Encrypt and store data in localStorage
   */
  setItem(key: string, value: any): boolean {
    try {
      const jsonData = JSON.stringify(value)
      const salt = this.generateSalt()
      const iv = this.generateIV()
      const derivedKey = this.deriveKey(salt)
      
      const encrypted = CryptoJS.AES.encrypt(jsonData, derivedKey, { 
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }).toString()
      
      const encryptedData: EncryptedData = {
        version: STORAGE_VERSION,
        salt,
        iv,
        data: encrypted,
        timestamp: Date.now()
      }
      
      const encodedData = CryptoJS.enc.Base64.stringify(
        CryptoJS.enc.Utf8.parse(JSON.stringify(encryptedData))
      )
      localStorage.setItem(`sec_${key}`, encodedData)
      
      return true
    } catch (error) {
      console.error('Failed to encrypt and store data:', error)
      return false
    }
  }

  /**
   * Retrieve and decrypt data from localStorage
   */
  getItem<T = any>(key: string): T | null {
    try {
      const storedData = localStorage.getItem(`sec_${key}`)
      if (!storedData) {
        return null
      }
      
      const decodedData = CryptoJS.enc.Utf8.stringify(
        CryptoJS.enc.Base64.parse(storedData)
      )
      const encryptedData: EncryptedData = JSON.parse(decodedData)
      
      // Version check
      if (encryptedData.version !== STORAGE_VERSION) {
        console.warn('Storage version mismatch, removing outdated data')
        this.removeItem(key)
        return null
      }
      
      // Age check (optional: expire data after 30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
      if (Date.now() - encryptedData.timestamp > maxAge) {
        console.warn('Stored data expired, removing')
        this.removeItem(key)
        return null
      }
      
      const derivedKey = this.deriveKey(encryptedData.salt)
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, derivedKey, {
        iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
      const jsonData = decrypted.toString(CryptoJS.enc.Utf8)
      
      return JSON.parse(jsonData)
    } catch (error) {
      console.error('Failed to decrypt stored data:', error)
      // Remove corrupted data
      this.removeItem(key)
      return null
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    localStorage.removeItem(`sec_${key}`)
  }

  /**
   * Clear all secure storage
   */
  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('sec_')) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Check if key exists
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(`sec_${key}`) !== null
  }
}

// Singleton instance
export const secureStorage = new SecureStorage()

/**
 * Sanitization utilities for XSS protection
 */
export class InputSanitizer {
  private static readonly ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'br']
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^>]*>/gi,
    /<input\b[^>]*>/gi,
    /<textarea\b[^>]*>/gi,
  ]

  /**
   * Sanitize text input for safe display
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    // Use DOMPurify for robust HTML sanitization
    let sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: this.ALLOWED_TAGS,
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    })
    
    // Additional pattern-based cleaning
    this.DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
    
    return sanitized.trim()
  }

  /**
   * Sanitize URL for safe usage
   */
  static sanitizeUrl(url: string): string {
    if (typeof url !== 'string') {
      return ''
    }

    // Remove any potential javascript: or data: URLs
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      return ''
    }

    // Additional checks for dangerous patterns
    if (/javascript:|data:|vbscript:|file:/i.test(url)) {
      return ''
    }

    return url.trim()
  }

  /**
   * Validate input length and content
   */
  static validateInput(input: string, maxLength: number = 1000): boolean {
    if (typeof input !== 'string') {
      return false
    }

    if (input.length > maxLength) {
      return false
    }

    // Check for null bytes and control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(input)) {
      return false
    }

    return true
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'string') {
      return this.sanitizeText(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }

    if (typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeText(key)
        sanitized[sanitizedKey] = this.sanitizeObject(value)
      }
      return sanitized
    }

    return obj
  }
}

/**
 * URL validation utilities
 */
export class URLValidator {
  private static readonly ALLOWED_DOMAINS = [
    'api.openweathermap.org',
    'openweathermap.org',
    'accounts.google.com',
    'googleapis.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    // Add other trusted domains as needed
  ]

  private static readonly ALLOWED_PROTOCOLS = ['https:', 'http:']

  /**
   * Check if URL is allowed for external requests
   */
  static isAllowedURL(url: string): boolean {
    try {
      const urlObj = new URL(url)
      
      // Check protocol
      if (!this.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
        return false
      }

      // Check if it's a relative URL (always allow)
      if (url.startsWith('/')) {
        return true
      }

      // Check domain whitelist
      const hostname = urlObj.hostname.toLowerCase()
      return this.ALLOWED_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      )
    } catch {
      return false
    }
  }

  /**
   * Sanitize URL for safe usage
   */
  static sanitizeURL(url: string): string {
    if (!this.isAllowedURL(url)) {
      console.warn(`Blocked potentially unsafe URL: ${url}`)
      return ''
    }
    return url
  }
}

/**
 * Content Security Policy utilities
 */
export class CSPManager {
  private static isCSPApplied = false

  /**
   * Apply Content Security Policy meta tag
   */
  static applyCSP(): void {
    if (this.isCSPApplied) {
      return
    }

    // Remove existing CSP meta tags
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (existingCSP) {
      existingCSP.remove()
    }

    // Create new CSP meta tag
    const cspMeta = document.createElement('meta')
    cspMeta.httpEquiv = 'Content-Security-Policy'
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Note: unsafe-inline needed for Vite in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.openweathermap.org https://accounts.google.com ws: wss:",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')

    document.head.appendChild(cspMeta)
    this.isCSPApplied = true
  }

  /**
   * Apply additional security headers via meta tags
   */
  static applySecurityHeaders(): void {
    const headers = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ]

    headers.forEach(header => {
      const existing = document.querySelector(`meta[http-equiv="${header.name}"]`)
      if (existing) {
        existing.remove()
      }

      const meta = document.createElement('meta')
      meta.httpEquiv = header.name
      meta.content = header.content
      document.head.appendChild(meta)
    })
  }
}

/**
 * Initialize all security measures
 */
export function initializeSecurity(): void {
  // Apply CSP and security headers
  CSPManager.applyCSP()
  CSPManager.applySecurityHeaders()

  // Add global error handler for security violations
  window.addEventListener('securitypolicyviolation', (event) => {
    console.warn('CSP Violation:', {
      directive: event.violatedDirective,
      blockedURI: event.blockedURI,
      lineNumber: event.lineNumber,
      sourceFile: event.sourceFile
    })
  })

  console.log('Security measures initialized')
}