import {
  BarChart3,
  Bell,
  BookOpenText,
  CalendarDays,
  ClipboardList,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  MapPin,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Vote,
} from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { getNavItemsForUser } from '../utils/permissionUtils'
import DashboardShell from './DashboardShell'

const iconMap = {
  BarChart3,
  Bell,
  BookOpenText,
  CalendarDays,
  ClipboardList,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  MapPin,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Vote,
}

export default function AdminLayout() {
  const { user } = useAuth()
  const navItems = getNavItemsForUser(user).map((item) => ({
    icon: iconMap[item.icon] || LayoutDashboard,
    label: item.label,
    to: item.path,
  }))
  const mobileItems = navItems.slice(0, 5)

  return (
    <DashboardShell
      mobileItems={mobileItems}
      navItems={navItems}
      title="অ্যাডমিন ড্যাশবোর্ড"
    />
  )
}
