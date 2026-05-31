import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { getErrorMessage, setAuthToken } from '../api/http'
import { AuthContext } from './auth-context'
import { getJwtExpiry } from '../utils/authState'
import { apiObject } from '../utils/responseUtils'

const TOKEN_KEY = 'dargah_para_token'
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setAuthToken(null)
    setToken(null)
    setUser(null)
    setLoading(false)
  }, [])

  const storeSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    setAuthToken(nextToken)
    setToken(nextToken)
    setUser(nextUser)
    setLoading(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    const response = await api.get('/auth/me')
    const nextUser = apiObject(response, 'user', null)
    setUser(nextUser)
    return nextUser
  }, [])

  const refreshSession = useCallback(async () => {
    const response = await api.post('/auth/refresh')
    const payload = response?.data?.data || {}
    const nextToken = payload.token
    const nextUser = payload.user

    if (!nextToken || !nextUser) {
      throw new Error('Session refresh failed.')
    }
    storeSession(nextToken, nextUser)
    return nextUser
  }, [storeSession])

  useEffect(() => {
    setAuthToken(token)

    if (!token) {
      return
    }

    let active = true

    const loadProfile = async () => {
      try {
        const response = await api.get('/auth/me')
        if (active) {
          setUser(apiObject(response, 'user', null))
        }
      } catch {
        if (active) {
          clearSession()
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [clearSession, token])

  useEffect(() => {
    if (!token) {
      return undefined
    }

    const expiresAt = getJwtExpiry(token)

    if (!expiresAt) {
      return undefined
    }

    const refreshIn = Math.max(expiresAt - Date.now() - TOKEN_REFRESH_BUFFER_MS, 0)
    const logoutIn = Math.max(expiresAt - Date.now() + 1000, 0)
    const refreshTimer = window.setTimeout(() => {
      refreshSession().catch(clearSession)
    }, refreshIn)
    const logoutTimer = window.setTimeout(clearSession, logoutIn)

    return () => {
      window.clearTimeout(refreshTimer)
      window.clearTimeout(logoutTimer)
    }
  }, [clearSession, refreshSession, token])

  const login = useCallback(async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const payload = response?.data?.data || {}
      const nextToken = payload.token
      const nextUser = payload.user

      if (!nextToken || !nextUser) {
        throw new Error('Login response was incomplete.')
      }
      storeSession(nextToken, nextUser)
      return { ok: true, user: nextUser }
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) }
    }
  }, [storeSession])

  const logout = clearSession

  const value = useMemo(
    () => ({
      loading,
      login,
      logout,
      refreshProfile,
      refreshSession,
      token,
      user,
    }),
    [loading, login, logout, refreshProfile, refreshSession, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
