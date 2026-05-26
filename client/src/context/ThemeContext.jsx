import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/http'
import useAppStore from '../store/appStore'
import { ThemeContext } from './theme-context'

const DEFAULT_APPEARANCE = {
  colorMode: 'light',
  customCss: '',
  fontSize: 'normal',
  primaryColor: '#4F46E5',
}

const DEFAULT_HOMEPAGE_CONTROLS = {
  darkModeToggleEnabled: true,
  fontSizeControlsEnabled: true,
}

const fontScales = {
  small: '14px',
  normal: '16px',
  large: '18px',
  'extra-large': '18px',
}

const readSystemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function ThemeProvider({ children }) {
  const {
    fontSizePreference,
    previewAppearance,
    setFontSizePreference,
    setThemePreference,
    themePreference,
  } = useAppStore()
  const [settingsAppearance, setSettingsAppearance] = useState(DEFAULT_APPEARANCE)
  const [homepageControls, setHomepageControls] = useState(DEFAULT_HOMEPAGE_CONTROLS)
  const [systemTheme, setSystemTheme] = useState(readSystemTheme)

  useEffect(() => {
    let active = true

    api
      .get('/settings/public')
      .then((response) => {
        if (active) {
          const settings = response.data.data.settings || {}
          setSettingsAppearance({
            ...DEFAULT_APPEARANCE,
            ...settings.appearance,
          })
          setHomepageControls({
            ...DEFAULT_HOMEPAGE_CONTROLS,
            ...settings.homepageControls,
          })
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)')

    if (!query) {
      return undefined
    }

    const handleChange = () => setSystemTheme(readSystemTheme())
    query.addEventListener('change', handleChange)

    return () => query.removeEventListener('change', handleChange)
  }, [])

  const appearance = useMemo(
    () => ({
      ...DEFAULT_APPEARANCE,
      ...settingsAppearance,
      ...previewAppearance,
    }),
    [previewAppearance, settingsAppearance],
  )
  const selectedMode = themePreference || appearance.colorMode || 'light'
  const selectedFontSize = fontSizePreference || appearance.fontSize || 'normal'
  const resolvedTheme = selectedMode === 'system' ? systemTheme : selectedMode

  useEffect(() => {
    const root = document.documentElement
    const customCssId = 'dargah-custom-css'
    const themeColor = resolvedTheme === 'dark' ? '#111827' : appearance.primaryColor
    let customCss = document.getElementById(customCssId)

    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.dataset.theme = resolvedTheme
    root.style.setProperty('--color-primary', appearance.primaryColor || DEFAULT_APPEARANCE.primaryColor)
    root.style.setProperty('--app-font-size', fontScales[selectedFontSize] || fontScales.normal)

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)

    if (!customCss) {
      customCss = document.createElement('style')
      customCss.id = customCssId
      document.head.appendChild(customCss)
    }

    customCss.textContent = appearance.customCss || ''
  }, [appearance, resolvedTheme, selectedFontSize])

  const toggleTheme = useCallback(() => {
    setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setThemePreference])

  const clearThemePreference = useCallback(() => {
    setThemePreference(null)
  }, [setThemePreference])

  const value = useMemo(
    () => ({
      appearance,
      clearThemePreference,
      fontSizePreference,
      homepageControls,
      resolvedTheme,
      selectedFontSize,
      selectedMode,
      setFontSizePreference,
      setThemePreference,
      themePreference,
      toggleTheme,
    }),
    [
      appearance,
      clearThemePreference,
      fontSizePreference,
      homepageControls,
      resolvedTheme,
      selectedFontSize,
      selectedMode,
      setFontSizePreference,
      setThemePreference,
      themePreference,
      toggleTheme,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
