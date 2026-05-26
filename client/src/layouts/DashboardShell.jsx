import { Dialog, DialogPanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ChevronDown,
  Languages,
  LogOut,
  Menu as MenuIcon,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api/http'
import GlobalSearchModal from '../components/admin/GlobalSearchModal'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import FontSizeControl from '../components/ui/FontSizeControl'
import ThemeToggle from '../components/ui/ThemeToggle'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import useTheme from '../hooks/useTheme'

const isActiveRoute = (location, to) => {
  const [pathname, search = ''] = to.split('?')

  return location.pathname === pathname && location.search === (search ? `?${search}` : '')
}

const timeAgo = (value) => {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(Math.floor(diff / 60000), 0)
  if (minutes < 1) return 'এখনই'
  if (minutes < 60) return `${minutes} মিনিট`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ঘন্টা`
  return `${Math.floor(hours / 24)} দিন`
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
    <div className="sidebar flex h-full flex-col bg-[var(--surface-0)]">
      <Link className="flex h-[72px] items-center gap-3 px-4" onClick={onNavigate} to="/">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-800)] text-[var(--text-inverted)] shadow-[var(--shadow-brand)]">
          <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="hidden min-w-0 lg:block">
          <span className="block truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            দরগাহ পাড়া
          </span>
          <span className="block truncate text-xs text-[var(--text-muted)]">পরিষদ</span>
        </span>
      </Link>

      <nav className="grid gap-1 px-3 py-4">
        <p className="mb-1 mt-2 hidden px-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] lg:block">
          মেনু
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActiveRoute(location, item.to)

          return (
            <Link
              className={`group relative flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-[var(--brand-50)] font-medium text-[var(--brand-700)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
              }`}
              key={item.to}
              onClick={onNavigate}
              to={item.to}
            >
              {active ? (
                <motion.span
                  className="absolute left-0 top-2 h-7 w-0.5 rounded-[var(--radius-full)] bg-[var(--brand-600)]"
                  layoutId="sidebar-active-bar"
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                />
              ) : null}
              <Icon
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 ${
                  active ? 'text-[var(--brand-600)]' : 'text-[var(--gray-400)] group-hover:text-[var(--brand-500)]'
                }`}
                strokeWidth={1.75}
              />
              <span className="hidden truncate lg:block">{item.label}</span>
              {item.badge ? (
                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-[var(--radius-full)] bg-[var(--brand-600)] px-1.5 text-xs font-bold text-[var(--text-inverted)]">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--gray-200)] p-4">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-3">
          <Avatar name={user?.name} size="sm" src={user?.profilePhotoUrl} status="online" />
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user?.name}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{user?.role || user?.phone}</p>
          </div>
          <Link className="ml-auto hidden text-[var(--text-muted)] hover:text-[var(--brand-600)] lg:block" to="/account">
            <Settings aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <Button className="mt-3 w-full justify-start" icon={LogOut} onClick={handleLogout} variant="ghost">
          <span className="hidden lg:inline">লগআউট</span>
        </Button>
      </div>
    </div>
  )
}

function NotificationDropdown({ notifications, unreadCount }) {
  return (
    <Menu as="div" className="relative">
      <MenuButton className="relative inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--brand-600)]">
        <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount ? (
          <motion.span
            animate={{ scale: [1, 1.18, 1] }}
            className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-[var(--radius-full)] bg-[var(--danger)] px-1 text-[10px] font-bold text-[var(--text-inverted)]"
          >
            {unreadCount}
          </motion.span>
        ) : null}
      </MenuButton>
      <MenuItems
        as={motion.div}
        className="absolute right-0 mt-2 w-[min(380px,calc(100vw-24px))] origin-top-right overflow-hidden rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-[var(--surface-0)] shadow-[var(--shadow-xl-token)]"
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16 }}
      >
        <div className="flex items-center justify-between border-b border-[var(--gray-200)] px-4 py-3">
          <p className="font-semibold text-[var(--text-primary)]">বিজ্ঞপ্তি</p>
          <Link className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]" to="/notifications">
            সব পড়ুন
          </Link>
        </div>
        <div className="max-h-[480px] overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="grid place-items-center py-12 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)]">
                <Sparkles aria-hidden="true" className="h-8 w-8" />
              </span>
              <p className="mt-4 font-medium text-[var(--text-primary)]">কোনো বিজ্ঞপ্তি নেই</p>
              <p className="text-sm text-[var(--text-secondary)]">সব ঠিকঠাক আছে!</p>
            </div>
          ) : null}
          {notifications.slice(0, 8).map((item) => (
            <MenuItem key={item._id}>
              <Link
                className={`flex gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition hover:bg-[var(--surface-2)] ${
                  !item.readAt ? 'bg-[var(--brand-50)]' : ''
                }`}
                to={item.link || '/notifications'}
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--brand-600)]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </span>
                  <span className="line-clamp-2 text-xs text-[var(--text-secondary)]">{item.message}</span>
                </span>
                <span className="shrink-0 text-xs text-[var(--text-muted)]">{timeAgo(item.createdAt)}</span>
              </Link>
            </MenuItem>
          ))}
        </div>
        <Link
          className="block border-t border-[var(--gray-200)] px-4 py-3 text-center text-sm font-semibold text-[var(--brand-600)] hover:bg-[var(--brand-50)]"
          to="/notifications"
        >
          সব বিজ্ঞপ্তি দেখুন
        </Link>
      </MenuItems>
    </Menu>
  )
}

export default function DashboardShell({ mobileItems, navItems, title }) {
  const { logout, user } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const { homepageControls } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const showDarkToggle = homepageControls.darkModeToggleEnabled !== false
  const showFontControls = homepageControls.fontSizeControlsEnabled !== false

  useEffect(() => {
    const loadNotifications = () => {
      api
        .get('/notifications/my')
        .then((response) => {
          setNotifications(response.data.data.notifications || [])
          setUnreadCount(response.data.data.unreadCount || 0)
        })
        .catch(() => {})
    }

    loadNotifications()
    const interval = window.setInterval(loadNotifications, 30000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKeydown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[var(--surface-1)] pb-20 text-[var(--text-primary)] md:pb-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden border-r border-[color-mix(in_srgb,var(--gray-200)_60%,transparent)] bg-[var(--surface-0)] md:block md:w-[60px] lg:w-[260px]">
        <SidebarContent navItems={navItems} user={user} />
      </aside>

      <Dialog className="relative z-50 md:hidden" onClose={setDrawerOpen} open={drawerOpen}>
        <AnimatePresence>
          {drawerOpen ? (
            <>
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              />
              <motion.div
                animate={{ x: 0 }}
                className="fixed inset-y-0 left-0 w-full max-w-xs"
                exit={{ x: '-100%' }}
                initial={{ x: '-100%' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <DialogPanel className="h-full border-r border-[var(--gray-200)] bg-[var(--surface-0)]">
                  <div className="absolute right-3 top-3">
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
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
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </Dialog>

      <div className="md:pl-[60px] lg:pl-[260px]">
        <header className="navbar sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--gray-200)_60%,transparent)] bg-[color-mix(in_srgb,var(--surface-0)_95%,transparent)] backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                className="md:hidden"
                icon={MenuIcon}
                iconOnly
                onClick={() => setDrawerOpen(true)}
                variant="ghost"
              >
                মেনু
              </Button>
              <div className="hidden min-w-0 md:block">
                <p className="text-xs text-[var(--text-muted)]">
                  <Link className="hover:text-[var(--brand-600)]" to="/">
                    হোম
                  </Link>
                  <span className="px-2">/</span>
                  <span className="text-[var(--text-primary)]">{title}</span>
                </p>
                <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  {title}
                </h1>
              </div>
              <p className="truncate text-sm font-semibold text-[var(--text-primary)] md:hidden">
                দরগাহ পাড়া ঐক্য পরিষদ
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button icon={Search} iconOnly onClick={() => setSearchOpen(true)} variant="ghost">
                সার্চ
              </Button>
              <NotificationDropdown notifications={notifications} unreadCount={unreadCount} />
              <Button className="hidden sm:inline-flex" icon={Languages} onClick={toggleLanguage} variant="ghost">
                {language === 'bn' ? 'বাং | EN' : 'BN | EN'}
              </Button>
              {showDarkToggle ? <ThemeToggle /> : null}
              {showFontControls ? <FontSizeControl className="hidden xl:inline-flex" /> : null}
              <Menu as="div" className="relative">
                <MenuButton className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-1.5 transition hover:bg-[var(--surface-2)]">
                  <Avatar name={user?.name} size="sm" src={user?.profilePhotoUrl} />
                  <ChevronDown aria-hidden="true" className="hidden h-4 w-4 text-[var(--text-muted)] sm:block" />
                </MenuButton>
                <MenuItems
                  as={motion.div}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-52 origin-top-right rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-[var(--surface-0)] p-2 shadow-[var(--shadow-xl-token)]"
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  <MenuItem>
                    <Link
                      className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                      to="/account"
                    >
                      <UserRound className="h-4 w-4" /> প্রোফাইল
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                      to="/account"
                    >
                      <Settings className="h-4 w-4" /> সেটিংস
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <button
                      className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-light)]"
                      onClick={handleLogout}
                      type="button"
                    >
                      <LogOut className="h-4 w-4" /> লগআউট
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </header>

        <Outlet />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--gray-200)] bg-[var(--surface-0)] md:hidden">
        <div className="grid grid-cols-5">
          {mobileItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const active = isActiveRoute(location, item.to)

            return (
              <Link
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? 'text-[var(--brand-600)]' : 'text-[var(--text-muted)]'
                }`}
                key={item.to}
                to={item.to}
              >
                <motion.span whileTap={{ scale: 1.18, y: -2 }}>
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                </motion.span>
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="absolute right-4 top-2 inline-flex min-w-5 items-center justify-center rounded-[var(--radius-full)] bg-[var(--brand-600)] px-1.5 text-xs font-bold text-[var(--text-inverted)]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>
      </nav>

      <GlobalSearchModal onClose={() => setSearchOpen(false)} open={searchOpen} user={user} />
    </div>
  )
}
