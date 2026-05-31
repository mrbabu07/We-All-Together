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
import { useEffect, useState } from 'react'
import api from '../api/http'
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
  const [navCounts, setNavCounts] = useState({})

  useEffect(() => {
    if (!user) {
      return undefined
    }

    let active = true

    const loadCounts = () => {
      api
        .get('/admin-controls/nav-counts')
        .then((response) => {
          if (active) {
            setNavCounts(response.data.data.counts || {})
          }
        })
        .catch(() => {
          if (active) {
            setNavCounts({})
          }
        })
    }

    loadCounts()
    const timer = window.setInterval(loadCounts, 30000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [user])

  const navItems = getNavItemsForUser(user).map((item) => ({
    badge: navCounts[item.path] || null,
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
