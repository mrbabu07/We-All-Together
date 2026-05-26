import { Monitor, Moon, Sun } from 'lucide-react'
import useTheme from '../../hooks/useTheme'
import Button from './Button'

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { clearThemePreference, resolvedTheme, selectedMode, themePreference, toggleTheme } = useTheme()
  const Icon = resolvedTheme === 'dark' ? Moon : Sun
  const label = resolvedTheme === 'dark' ? 'ডার্ক মোড' : 'লাইট মোড'

  const handleContextMenu = (event) => {
    event.preventDefault()
    clearThemePreference()
  }

  return (
    <Button
      aria-label={`${label} পরিবর্তন করুন`}
      className={className}
      icon={Icon}
      iconOnly={!showLabel}
      onClick={toggleTheme}
      onContextMenu={handleContextMenu}
      rightIcon={!themePreference && showLabel ? Monitor : undefined}
      title={
        themePreference
          ? 'Click to switch light/dark. Right click to follow admin setting.'
          : `Following ${selectedMode} setting`
      }
      type="button"
      variant="ghost"
    >
      {showLabel ? label : label}
    </Button>
  )
}
