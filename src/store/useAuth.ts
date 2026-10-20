import { create } from 'zustand'
import { ApiError, api } from '../lib/api'

export interface AuthUser {
  id: string
  username: string
}

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'error'

const USER_CACHE_KEY = 'bolsillo.auth.user'

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (typeof parsed.id !== 'string' || typeof parsed.username !== 'string') return null
    return { id: parsed.id, username: parsed.username }
  } catch {
    return null
  }
}

function writeCachedUser(user: AuthUser) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
  } catch {
    // The session cookie remains the source of truth if localStorage is unavailable.
  }
}

function clearCachedUser() {
  try {
    localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    // Ignore storage errors.
  }
}

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  hasUser: boolean
  offline: boolean
  error: string | null
  check: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  setup: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  status: 'checking',
  user: null,
  hasUser: true,
  offline: false,
  error: null,

  check: async () => {
    try {
      const result = await api<{ hasUser: boolean; user: AuthUser | null }>(
        '/api/auth/status',
      )
      if (result.user) {
        writeCachedUser(result.user)
        set({
          status: 'authenticated',
          user: result.user,
          hasUser: true,
          offline: false,
          error: null,
        })
      } else {
        clearCachedUser()
        set({
          status: 'unauthenticated',
          user: null,
          hasUser: result.hasUser,
          offline: false,
          error: null,
        })
      }
    } catch (error) {
      const cached = readCachedUser()
      if (error instanceof ApiError) {
        if (error.status >= 500 && cached) {
          set({
            status: 'authenticated',
            user: cached,
            offline: true,
            error: null,
          })
          return
        }
        set({
          status: 'error',
          error:
            error.status === 404
              ? 'No se encontró el servidor de Bolsillo. Comprueba que el backend esté desplegado.'
              : error.message,
        })
        return
      }

      if (cached) {
        set({
          status: 'authenticated',
          user: cached,
          offline: true,
          error: null,
        })
      } else {
        set({
          status: 'error',
          error: 'No se pudo conectar con el servidor.',
          offline: true,
        })
      }
    }
  },

  login: async (username, password) => {
    const result = await api<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    writeCachedUser(result.user)
    set({
      status: 'authenticated',
      user: result.user,
      hasUser: true,
      offline: false,
      error: null,
    })
  },

  setup: async (username, password) => {
    const result = await api<{ user: AuthUser }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    writeCachedUser(result.user)
    set({
      status: 'authenticated',
      user: result.user,
      hasUser: true,
      offline: false,
      error: null,
    })
  },

  logout: async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {
      // Logging out locally must work even if the network is unavailable.
    }
    clearCachedUser()
    set({
      status: 'unauthenticated',
      user: null,
      hasUser: true,
      offline: false,
      error: null,
    })
  },
}))
