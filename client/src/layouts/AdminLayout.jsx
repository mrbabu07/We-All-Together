import {
  BarChart3,
  Bell,
  ClipboardList,
  Home,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import DashboardShell from './DashboardShell'

export default function AdminLayout() {
  const navItems = [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', to: '/admin' },
    { icon: BarChart3, label: 'অর্থ ব্যবস্থাপনা', to: '/admin/finance/payments' },
    { icon: ClipboardList, label: 'কনটেন্ট', to: '/admin/notices' },
    { icon: Users, label: 'সদস্য', to: '/admin/members' },
    { icon: SlidersHorizontal, label: 'কন্ট্রোল', to: '/admin/settings/org' },
    { icon: Bell, label: 'লগ ও বার্তা', to: '/admin/notifications' },
    { icon: Settings, label: 'অ্যাকাউন্ট', to: '/account' },
  ]

  return (
    <DashboardShell
      mobileItems={[
        { icon: Home, label: 'হোম', to: '/admin' },
        { icon: BarChart3, label: 'অর্থ', to: '/admin/finance/payments' },
        { icon: ClipboardList, label: 'নোটিশ', to: '/admin/notices' },
        { icon: Users, label: 'সদস্য', to: '/admin/members' },
        { icon: SlidersHorizontal, label: 'কন্ট্রোল', to: '/admin/settings/org' },
      ]}
      navItems={navItems}
      title="অ্যাডমিন ড্যাশবোর্ড"
    />
  )
}
