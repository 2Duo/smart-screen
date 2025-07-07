/**
 * Secure storage middleware for Zustand
 */

import { StateStorage } from 'zustand/middleware'
import { secureStorage } from './cryptoUtils'

/**
 * Secure storage implementation for Zustand persist middleware with fallback
 */
export const createSecureStorage = (): StateStorage => ({
  getItem: (name: string): string | null => {
    try {
      const value = secureStorage.getItem(name)
      return value ? JSON.stringify(value) : null
    } catch (error) {
      console.warn('Failed to get item from secure storage, trying fallback:', error)
      // Fallback to regular localStorage
      try {
        return localStorage.getItem(`fallback_${name}`)
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError)
        return null
      }
    }
  },

  setItem: (name: string, value: string): void => {
    try {
      const parsedValue = JSON.parse(value)
      secureStorage.setItem(name, parsedValue)
    } catch (error) {
      console.warn('Failed to set item in secure storage, using fallback:', error)
      // Fallback to regular localStorage
      try {
        localStorage.setItem(`fallback_${name}`, value)
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError)
      }
    }
  },

  removeItem: (name: string): void => {
    try {
      secureStorage.removeItem(name)
    } catch (error) {
      console.warn('Failed to remove item from secure storage:', error)
    }
    // Also try to remove from fallback storage
    try {
      localStorage.removeItem(`fallback_${name}`)
    } catch (fallbackError) {
      console.error('Failed to remove fallback item:', fallbackError)
    }
  },
})

/**
 * Migration function to handle data migration from secure to fallback storage
 */
const migrateStorageData = (name: string): void => {
  try {
    // Try to get data from secure storage
    const secureData = secureStorage.getItem(name)
    if (secureData) {
      console.log(`Data found in secure storage for ${name}, migration not needed`)
      return
    }

    // Check if fallback data exists
    const fallbackData = localStorage.getItem(`fallback_${name}`)
    if (fallbackData) {
      console.log(`Migrating data from fallback to secure storage for ${name}`)
      try {
        const parsedData = JSON.parse(fallbackData)
        secureStorage.setItem(name, parsedData)
        // Keep fallback as backup
        console.log(`Migration successful for ${name}`)
      } catch (error) {
        console.warn(`Failed to migrate data for ${name}:`, error)
      }
    }
  } catch (error) {
    console.warn(`Migration check failed for ${name}:`, error)
  }
}

/**
 * Secure storage configuration for Zustand persist
 */
export const secureStorageConfig = {
  storage: createSecureStorage(),
  onRehydrateStorage: (name: string) => {
    // Attempt migration before hydration
    migrateStorageData(name)
    return undefined
  },
}