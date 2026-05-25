import { Dialog, DialogPanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import {
  Bell,
  ChevronDown,
  Languages,
  LogOut,
  Menu as MenuIcon,
  Sparkles,
  X,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import { useState } from 'react'

const isActiveRoute = (location, to) => {
  const [pathname, search = ''] = to.split('?')

  return location.pathname === pathname && location.search === (search ? `?${search}` : '')
}

function SidebarContent({ navItems, onNavigate, user }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-full flex-col">
      <Link className="flex min-h-20 items-center gap-3 px-5" onClick={onNavigate} to="/">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <Sparkles aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="hidden min-w-0 lg:block">
          <span className="block truncate text-sm font-semibold tracking-tight text-gray-900">
            Dargah Para
          </span>
          <span className="block truncate text-xs text-gray-500">OIkko Porishod</span>
        </span>
      </Link>

      <nav className="grid gap-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActiveRoute(location, item.to)

          return (
            <Link
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              key={item.to}
              onClick={onNavigate}
              to={item.to}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span className="hidden truncate lg:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} src={user?.profilePhotoUrl} />
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-500">{user?.phone}</p>
          </div>
        </div>
        <Button className="mt-3 w-full lg:w-auto" icon={LogOut} onClick={handleLogout} variant="secondary">
          <span className="hidden lg:inline">লগআউট</span>
        </Button>
      </div>
    </div>
  )
}

export default function DashboardShell({ mobileItems, navItems, title }) {
  const { user } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-gray-900 md:pb-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden border-r border-gray-200 bg-white md:block md:w-20 lg:w-60">
        <SidebarContent navItems={navItems} user={user} />
      </aside>

      <Dialog className="relative z-50 md:hidden" onClose={setDrawerOpen} open={drawerOpen}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-y-0 left-0 w-full max-w-xs">
          <DialogPanel className="h-full border-r border-gray-200 bg-white">
            <div className="absolute right-3 top-3">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                onClick={() => setDrawerOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              navItems={navItems}
              onNavigate={() => setDrawerOpen(false)}
              user={user}
            />
          </DialogPanel>
        </div>
      </Dialog>

      <div className="md:pl-20 lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-600 md:hidden"
                onClick={() => setDrawerOpen(true)}
                type="button"
              >
                <MenuIcon aria-hidden="true" className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h1>
                <p className="hidden text-xs text-gray-500 sm:block">Dargah Para OIkko Porishod</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button icon={Languages} onClick={toggleLanguage} variant="secondary">
                {language === 'bn' ? 'EN' : 'BN'}
              </Button>
              <Button as={Link} className="relative" icon={Bell} to="/notifications" variant="secondary">
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
              </Button>
              <Menu as="div" className="relative">
                <MenuButton className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Avatar name={user?.name} src={user?.profilePhotoUrl} size="sm" />
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                </MenuButton>
                <MenuItems className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                  <MenuItem>
                    <Link
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      to="/account"
                    >
                      প্রোফাইল
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      to="/notifications"
                    >
                      বার্তা
                    </Link>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </header>

        <Outlet />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white md:hidden">
        <div className="grid grid-cols-5">
          {mobileItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const active = isActiveRoute(location, item.to)

            return (
              <Link
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? 'text-indigo-600' : 'text-gray-500'
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
