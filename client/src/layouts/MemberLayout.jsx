import { Bell, BookOpen, CreditCard, HeartHandshake, Home, Image, UserRound, Users, Vote } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/http'
import DashboardShell from './DashboardShell'

export default function MemberLayout() {
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    let active = true

    api
      .get('/fees/my-status')
      .then((response) => {
        if (active) {
          setOverdueCount(response.data.data.overdueMonths?.length || 0)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  const paymentBadge = overdueCount > 0 ? overdueCount : null
  const navItems = [
    { icon: Home, label: 'হোম', to: '/member' },
    { badge: paymentBadge, icon: CreditCard, label: 'পেমেন্ট', to: '/member/fees' },
    { badge: paymentBadge, icon: CreditCard, label: 'ফি ইতিহাস', to: '/member/fees/history' },
    { icon: BookOpen, label: 'ব্লগ', to: '/member/blogs' },
    { icon: Image, label: 'গ্যালারি', to: '/member/gallery' },
    { icon: Bell, label: 'নোটিশ', to: '/member/notices' },
    { icon: Vote, label: 'ভোট', to: '/member/polls' },
    { icon: HeartHandshake, label: 'দান', to: '/member/donate' },
    { icon: Users, label: 'সদস্য', to: '/member/members' },
    { icon: UserRound, label: 'প্রোফাইল', to: '/member/profile' },
  ]

  return (
    <DashboardShell
      mobileItems={[
        { icon: Home, label: 'হোম', to: '/member' },
        { badge: paymentBadge, icon: CreditCard, label: 'পেমেন্ট', to: '/member/fees' },
        { icon: Bell, label: 'নোটিশ', to: '/member/notices' },
        { icon: Image, label: 'গ্যালারি', to: '/member/gallery' },
        { icon: UserRound, label: 'প্রোফাইল', to: '/member/profile' },
      ]}
      navItems={navItems}
      title="সদস্য ড্যাশবোর্ড"
    />
  )
}
