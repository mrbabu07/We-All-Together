import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, Languages, LayoutDashboard, LogOut, UserRound, UserPlus, Users } from 'lucide-react'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`

export default function AppLayout() {
  const { logout, user } = useAuth()
  const { language, t, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link className="grid gap-0.5" to="/">
            <span className="text-base font-bold text-slate-950">
              Dargah Para OIkko Porishod
            </span>
            <span className="text-xs font-medium uppercase text-emerald-700">
              {t.organization}
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink className={navLinkClass} to="/">
              {t.public}
            </NavLink>
            {user?.role === 'admin' ? (
              <NavLink className={navLinkClass} to="/admin">
                <LayoutDashboard aria-hidden="true" className="inline h-4 w-4" /> {t.admin}
              </NavLink>
            ) : null}
            {user ? (
              <>
                <NavLink className={navLinkClass} to="/member">
                  <Users aria-hidden="true" className="inline h-4 w-4" /> {t.member}
                </NavLink>
                <NavLink className={navLinkClass} to="/account">
                  <UserRound aria-hidden="true" className="inline h-4 w-4" /> {t.account}
                </NavLink>
                <NavLink className={navLinkClass} to="/notifications">
                  <Bell aria-hidden="true" className="inline h-4 w-4" /> {t.alerts}
                </NavLink>
              </>
            ) : (
              <>
                <NavLink className={navLinkClass} to="/register">
                  <UserPlus aria-hidden="true" className="inline h-4 w-4" /> {t.register}
                </NavLink>
                <NavLink className={navLinkClass} to="/login">
                  {t.login}
                </NavLink>
              </>
            )}
            <Button icon={Languages} onClick={toggleLanguage} variant="secondary">
              {language === 'en' ? 'BN' : 'EN'}
            </Button>
            {user ? (
              <Button icon={LogOut} onClick={handleLogout} variant="secondary">
                {t.logout}
              </Button>
            ) : null}
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  )
}
