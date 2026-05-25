import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  CreditCard,
  Home,
  Image,
  Languages,
  LayoutDashboard,
  LogOut,
  UserRound,
  UserPlus,
  Users,
} from 'lucide-react'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'

const navLinkClass = ({ isActive }) =>
  `inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-indigo-700 text-white' : 'text-gray-700 hover:bg-gray-100'
  }`

export default function AppLayout() {
  const { logout, user } = useAuth()
  const { language, t, toggleLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const mobileItems = [
    { icon: Home, label: t.home, to: '/' },
    { icon: CreditCard, label: t.payment, to: user ? '/member?tab=payments' : '/login' },
    { icon: Bell, label: t.notice, to: user ? '/member?tab=updates' : '/' },
    { icon: Image, label: t.gallery, to: user ? '/member?tab=gallery' : '/' },
    { icon: BookOpen, label: t.blog, to: user ? '/member?tab=blogs' : '/' },
  ]

  const isMobileActive = (to) => {
    const [pathname, search = ''] = to.split('?')

    return location.pathname === pathname && location.search === (search ? `?${search}` : '')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-gray-950 md:pb-0">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link className="grid gap-0.5" to="/">
            <span className="text-base font-bold text-gray-950">
              Dargah Para OIkko Porishod
            </span>
            <span className="text-xs font-medium uppercase text-indigo-700">
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

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white md:hidden">
        <div className="grid grid-cols-5">
          {mobileItems.map((item) => {
            const Icon = item.icon
            const active = isMobileActive(item.to)

            return (
              <Link
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? 'text-indigo-700' : 'text-gray-600'
                }`}
                key={item.to}
                to={item.to}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
