import {
  BarChart3,
  Bell,
  ClipboardList,
  Home,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import DashboardShell from './DashboardShell'

export default function AdminLayout() {
  const navItems = [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', to: '/admin' },
    { icon: BarChart3, label: 'অর্থ ব্যবস্থাপনা', to: '/admin?tab=finance' },
    { icon: ClipboardList, label: 'কনটেন্ট', to: '/admin?tab=content' },
    { icon: Users, label: 'সদস্য', to: '/admin?tab=members' },
    { icon: Bell, label: 'লগ ও বার্তা', to: '/admin?tab=logs' },
    { icon: Settings, label: 'অ্যাকাউন্ট', to: '/account' },
  ]

  return (
    <DashboardShell
      mobileItems={[
        { icon: Home, label: 'হোম', to: '/admin' },
        { icon: BarChart3, label: 'অর্থ', to: '/admin?tab=finance' },
        { icon: ClipboardList, label: 'নোটিশ', to: '/admin?tab=content' },
        { icon: Users, label: 'সদস্য', to: '/admin?tab=members' },
        { icon: Settings, label: 'প্রোফাইল', to: '/account' },
      ]}
      navItems={navItems}
      title="অ্যাডমিন ড্যাশবোর্ড"
    />
  )
}
