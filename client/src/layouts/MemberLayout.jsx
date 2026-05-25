import { Bell, BookOpen, CreditCard, Home, Image, UserRound, Users, Vote } from 'lucide-react'
import DashboardShell from './DashboardShell'

export default function MemberLayout() {
  const navItems = [
    { icon: Home, label: 'হোম', to: '/member' },
    { icon: CreditCard, label: 'পেমেন্ট', to: '/member?tab=payments' },
    { icon: BookOpen, label: 'ব্লগ', to: '/member?tab=blogs' },
    { icon: Image, label: 'গ্যালারি', to: '/member?tab=gallery' },
    { icon: Bell, label: 'নোটিশ', to: '/member?tab=updates' },
    { icon: Vote, label: 'ভোট', to: '/member?tab=polls' },
    { icon: Users, label: 'সদস্য', to: '/member?tab=members' },
    { icon: UserRound, label: 'প্রোফাইল', to: '/account' },
  ]

  return (
    <DashboardShell
      mobileItems={[
        { icon: Home, label: 'হোম', to: '/member' },
        { icon: CreditCard, label: 'পেমেন্ট', to: '/member?tab=payments' },
        { icon: Bell, label: 'নোটিশ', to: '/member?tab=updates' },
        { icon: Image, label: 'গ্যালারি', to: '/member?tab=gallery' },
        { icon: UserRound, label: 'প্রোফাইল', to: '/account' },
      ]}
      navItems={navItems}
      title="সদস্য ড্যাশবোর্ড"
    />
  )
}
