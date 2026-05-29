import { Bell, BookOpen, CreditCard, Home, Image, UserRound, Users, Vote } from 'lucide-react'
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
  const memberRouteAliases = {
    '/account': '/member/profile',
    '/member/fee-history': '/member/fees/history',
    '/member?tab=blogs': '/member/blogs',
    '/member?tab=gallery': '/member/gallery',
    '/member?tab=members': '/member/members',
    '/member?tab=payments': '/member/fees',
    '/member?tab=polls': '/member/polls',
    '/member?tab=updates': '/member/notices',
  }
  const aliasMemberRoute = (item) => ({ ...item, to: memberRouteAliases[item.to] || item.to })
  const navItems = [
    { icon: Home, label: 'হোম', to: '/member' },
    { badge: paymentBadge, icon: CreditCard, label: 'পেমেন্ট', to: '/member?tab=payments' },
    { badge: paymentBadge, icon: CreditCard, label: 'ফি ইতিহাস', to: '/member/fee-history' },
    { icon: BookOpen, label: 'ব্লগ', to: '/member?tab=blogs' },
    { icon: Image, label: 'গ্যালারি', to: '/member?tab=gallery' },
    { icon: Bell, label: 'নোটিশ', to: '/member?tab=updates' },
    { icon: Vote, label: 'ভোট', to: '/member?tab=polls' },
    { icon: Users, label: 'সদস্য', to: '/member?tab=members' },
    { icon: UserRound, label: 'প্রোফাইল', to: '/account' },
  ].map(aliasMemberRoute)

  return (
    <DashboardShell
      mobileItems={[
        { icon: Home, label: 'হোম', to: '/member' },
        { badge: paymentBadge, icon: CreditCard, label: 'পেমেন্ট', to: '/member?tab=payments' },
        { icon: Bell, label: 'নোটিশ', to: '/member?tab=updates' },
        { icon: Image, label: 'গ্যালারি', to: '/member?tab=gallery' },
        { icon: UserRound, label: 'প্রোফাইল', to: '/account' },
      ].map(aliasMemberRoute)}
      navItems={navItems}
      title="সদস্য ড্যাশবোর্ড"
    />
  )
}
