import {
  BarChart3,
  Bell,
  ClipboardList,
  Home,
  Image,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import useAuth from '../hooks/useAuth'
import DashboardShell from './DashboardShell'

export default function AdminLayout() {
  const { user } = useAuth()
  const adminItems = [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', to: '/admin' },
    { icon: BarChart3, label: 'অর্থ ব্যবস্থাপনা', to: '/admin/finance/payments' },
    { icon: ClipboardList, label: 'কনটেন্ট', to: '/admin/notices' },
    { icon: Users, label: 'সদস্য', to: '/admin/members' },
    { icon: SlidersHorizontal, label: 'কন্ট্রোল', to: '/admin/settings/org' },
    { icon: Bell, label: 'লগ ও বার্তা', to: '/admin/notifications' },
    { icon: Settings, label: 'অ্যাকাউন্ট', to: '/account' },
  ]
  const moderatorItems = [
    { icon: ClipboardList, label: 'ব্লগ', to: '/admin/blogs' },
    { icon: Image, label: 'গ্যালারি', to: '/admin/gallery' },
    { icon: Settings, label: 'অ্যাকাউন্ট', to: '/account' },
  ]
  const navItems = user?.role === 'moderator' ? moderatorItems : adminItems
  const mobileItems =
    user?.role === 'moderator'
      ? [
          { icon: ClipboardList, label: 'ব্লগ', to: '/admin/blogs' },
          { icon: Image, label: 'গ্যালারি', to: '/admin/gallery' },
          { icon: Settings, label: 'অ্যাকাউন্ট', to: '/account' },
        ]
      : [
          { icon: Home, label: 'হোম', to: '/admin' },
          { icon: BarChart3, label: 'অর্থ', to: '/admin/finance/payments' },
          { icon: ClipboardList, label: 'নোটিশ', to: '/admin/notices' },
          { icon: Users, label: 'সদস্য', to: '/admin/members' },
          { icon: SlidersHorizontal, label: 'কন্ট্রোল', to: '/admin/settings/org' },
        ]

  return (
    <DashboardShell
      mobileItems={mobileItems}
      navItems={navItems}
      title="অ্যাডমিন ড্যাশবোর্ড"
    />
  )
}
