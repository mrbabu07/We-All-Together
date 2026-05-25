import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { getErrorMessage, setAuthToken } from '../api/http'
import { AuthContext } from './auth-context'

const TOKEN_KEY = 'dargah_para_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  const refreshProfile = useCallback(async () => {
    const response = await api.get('/auth/me')
    setUser(response.data.data.user)
    return response.data.data.user
  }, [])

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
          setUser(response.data.data.user)
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        setAuthToken(null)
        if (active) {
          setToken(null)
          setUser(null)
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
  }, [token])

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const nextToken = response.data.data.token
      const nextUser = response.data.data.user

      localStorage.setItem(TOKEN_KEY, nextToken)
      setAuthToken(nextToken)
      setToken(nextToken)
      setUser(nextUser)
      return { ok: true, user: nextUser }
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) }
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setAuthToken(null)
    setToken(null)
    setUser(null)
    setLoading(false)
  }

  const value = useMemo(
    () => ({
      loading,
      login,
      logout,
      refreshProfile,
      token,
      user,
    }),
    [loading, refreshProfile, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
