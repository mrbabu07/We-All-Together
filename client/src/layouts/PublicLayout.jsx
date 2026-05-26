import { Languages, LogIn, UserPlus } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Button from '../components/ui/Button'
import FontSizeControl from '../components/ui/FontSizeControl'
import ThemeToggle from '../components/ui/ThemeToggle'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import useTheme from '../hooks/useTheme'

export default function PublicLayout() {
  const { user } = useAuth()
  const { language, t, toggleLanguage } = useLanguage()
  const { homepageControls } = useTheme()
  const location = useLocation()
  const showDarkToggle = homepageControls.darkModeToggleEnabled !== false
  const showFontControls = homepageControls.fontSizeControlsEnabled !== false

  if (location.pathname === '/') {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link className="grid gap-0.5" to="/">
            <span className="text-base font-semibold tracking-tight text-gray-900">
              Dargah Para OIkko Porishod
            </span>
            <span className="text-xs font-medium text-indigo-600">{t.organization}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button icon={Languages} onClick={toggleLanguage} variant="secondary">
              {language === 'bn' ? 'EN' : 'BN'}
            </Button>
            {showDarkToggle ? <ThemeToggle /> : null}
            {showFontControls ? <FontSizeControl className="hidden sm:inline-flex" /> : null}
            {user ? (
              <Button as={Link} to={user.role === 'admin' ? '/admin' : '/member'}>
                {user.role === 'admin' ? t.admin : t.member}
              </Button>
            ) : (
              <>
                <Button as={Link} icon={UserPlus} to="/register" variant="secondary">
                  {t.register}
                </Button>
                <Button as={Link} icon={LogIn} to="/login">
                  {t.login}
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-2 px-4 py-6 text-sm text-gray-500 sm:px-6">
          <p className="font-semibold text-gray-900">Dargah Para OIkko Porishod</p>
          <p>ঠিকানা: Dargah Para, Bangladesh | যোগাযোগ: সংগঠন অফিস</p>
        </div>
      </footer>
    </div>
  )
}
