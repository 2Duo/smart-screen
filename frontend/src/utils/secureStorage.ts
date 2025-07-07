/**
 * Secure storage middleware for Zustand
 */

import { StateStorage } from 'zustand/middleware'
import { secureStorage } from './cryptoUtils'

/**
 * Secure storage implementation for Zustand persist middleware
 */
export const createSecureStorage = (): StateStorage => ({
  getItem: (name: string): string | null => {
    try {
      const value = secureStorage.getItem(name)
      return value ? JSON.stringify(value) : null
    } catch (error) {
      console.error('Failed to get item from secure storage:', error)
      return null
    }
  },

  setItem: (name: string, value: string): void => {
    try {
      const parsedValue = JSON.parse(value)
      secureStorage.setItem(name, parsedValue)
    } catch (error) {
      console.error('Failed to set item in secure storage:', error)
    }
  },

  removeItem: (name: string): void => {
    try {
      secureStorage.removeItem(name)
    } catch (error) {
      console.error('Failed to remove item from secure storage:', error)
    }
  },
})

/**
 * Secure storage configuration for Zustand persist
 */
export const secureStorageConfig = {
  storage: createSecureStorage(),
}