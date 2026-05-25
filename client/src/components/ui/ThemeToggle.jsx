import { Monitor, Moon, Sun } from 'lucide-react'
import useTheme from '../../hooks/useTheme'

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { clearThemePreference, resolvedTheme, selectedMode, themePreference, toggleTheme } = useTheme()
  const Icon = resolvedTheme === 'dark' ? Moon : Sun
  const label = resolvedTheme === 'dark' ? 'ডার্ক মোড' : 'লাইট মোড'

  const handleContextMenu = (event) => {
    event.preventDefault()
    clearThemePreference()
  }

  return (
    <button
      aria-label={`${label} পরিবর্তন করুন`}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 ${className}`}
      onClick={toggleTheme}
      onContextMenu={handleContextMenu}
      title={
        themePreference
          ? 'Click to switch light/dark. Right click to follow admin setting.'
          : `Following ${selectedMode} setting`
      }
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {showLabel ? <span>{label}</span> : null}
      {!themePreference ? <Monitor aria-hidden="true" className="h-3.5 w-3.5 text-gray-400" /> : null}
    </button>
  )
}
