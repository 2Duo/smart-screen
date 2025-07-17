/**
 * Secure Axios configuration with URL validation and request/response interceptors
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { URLValidator, InputSanitizer } from './cryptoUtils'

// Create secure axios instance
const secureAxios: AxiosInstance = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Request interceptor for URL validation and request sanitization
secureAxios.interceptors.request.use(
  (config: any) => {
    // Validate URL
    if (config.url && !URLValidator.isAllowedURL(config.url)) {
      const error = new Error(`Blocked request to unauthorized URL: ${config.url}`)
      error.name = 'URLBlockedError'
      throw error
    }

    // Sanitize request data
    if (config.data && typeof config.data === 'object') {
      config.data = InputSanitizer.sanitizeObject(config.data)
    }

    // Sanitize query parameters
    if (config.params && typeof config.params === 'object') {
      config.params = InputSanitizer.sanitizeObject(config.params)
    }

    // Add security headers
    config.headers = {
      ...config.headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    }

    console.log(`Making secure request to: ${config.url}`)
    return config
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for response sanitization and security checks
secureAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    // Sanitize response data if it's an object
    if (response.data && typeof response.data === 'object') {
      response.data = InputSanitizer.sanitizeObject(response.data)
    }

    // Check for suspicious content in response
    if (typeof response.data === 'string') {
      const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
      ]

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(response.data)) {
          console.warn('Suspicious content detected in response, sanitizing...')
          response.data = InputSanitizer.sanitizeText(response.data)
          break
        }
      }
    }

    return response
  },
  (error: AxiosError) => {
    // Log security-relevant errors
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.warn('Security-related HTTP error:', {
        status: error.response.status,
        url: error.config?.url,
        message: error.message,
      })
    }

    // Sanitize error messages
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data = InputSanitizer.sanitizeObject(error.response.data)
    }

    return Promise.reject(error)
  }
)

/**
 * Secure HTTP client with built-in URL validation and sanitization
 */
export class SecureHttpClient {
  private static instance: SecureHttpClient
  private axios: AxiosInstance

  private constructor() {
    this.axios = secureAxios
  }

  public static getInstance(): SecureHttpClient {
    if (!SecureHttpClient.instance) {
      SecureHttpClient.instance = new SecureHttpClient()
    }
    return SecureHttpClient.instance
  }

  /**
   * Make a secure GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config)
    return response.data
  }

  /**
   * Make a secure POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<T>(url, data, config)
    return response.data
  }

  /**
   * Make a secure PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<T>(url, data, config)
    return response.data
  }

  /**
   * Make a secure DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config)
    return response.data
  }

  /**
   * Set default base URL (with validation)
   */
  setBaseURL(baseURL: string): void {
    if (!URLValidator.isAllowedURL(baseURL)) {
      throw new Error(`Invalid base URL: ${baseURL}`)
    }
    this.axios.defaults.baseURL = baseURL
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(
    onFulfilled?: (value: any) => any | Promise<any>,
    onRejected?: (error: any) => any
  ): number {
    return this.axios.interceptors.request.use(onFulfilled, onRejected)
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(
    onFulfilled?: (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: any) => any
  ): number {
    return this.axios.interceptors.response.use(onFulfilled, onRejected)
  }
}

// Export singleton instance
export const secureHttpClient = SecureHttpClient.getInstance()

// Export default axios instance for backward compatibility
export default secureAxios