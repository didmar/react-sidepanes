import type { PersistenceAdapter } from '../types'

/**
 * localStorage-based persistence adapter.
 * Stores values with a 'sidepanes:' prefix.
 */
export const localStorageAdapter: PersistenceAdapter = {
  get: (key: string): string | null => {
    if (typeof localStorage === 'undefined') {
      return null
    }
    return localStorage.getItem(`sidepanes:${key}`)
  },
  set: (key: string, value: string): void => {
    if (typeof localStorage === 'undefined') {
      return
    }
    localStorage.setItem(`sidepanes:${key}`, value)
  }
}

/**
 * Cookie-based persistence adapter.
 * Stores values as cookies with SameSite=Strict and 30-day expiry.
 */
export const cookieAdapter: PersistenceAdapter = {
  get: (key: string): string | null => {
    if (typeof document === 'undefined') {
      return null
    }
    const match = document.cookie.match(new RegExp(`sidepanes_${key}=([^;]+)`))
    return match?.[1] ?? null
  },
  set: (key: string, value: string): void => {
    if (typeof document === 'undefined') {
      return
    }
    const expires = new Date()
    expires.setDate(expires.getDate() + 30) // 30 days
    document.cookie = `sidepanes_${key}=${value}; path=/; SameSite=Strict; expires=${expires.toUTCString()}`
  }
}

/**
 * No-op persistence adapter.
 * Use when you don't want to persist state.
 */
export const noopAdapter: PersistenceAdapter = {
  get: (): null => null,
  set: (): void => {}
}
