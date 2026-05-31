export const BASE_ROLES = ['admin', 'member', 'moderator']

export const NAV_ITEMS = [
  { icon: 'LayoutDashboard', label: 'ড্যাশবোর্ড', path: '/admin/dashboard', requiredPermission: null },
  { icon: 'ClipboardList', label: 'নোটিশ', path: '/admin/notices', requiredPermission: 'notice.view' },
  { icon: 'CalendarDays', label: 'মিটিং', path: '/admin/meetings', requiredPermission: 'meeting.view' },
  { icon: 'MapPin', label: 'ট্যুর', path: '/admin/tours', requiredPermission: 'tour.view' },
  { icon: 'Users', label: 'সদস্য', path: '/admin/members', requiredPermission: 'member.view' },
  { icon: 'BarChart3', label: 'আর্থিক', path: '/admin/finance/payments', requiredPermission: 'finance.view' },
  { icon: 'BookOpenText', label: 'ব্লগ', path: '/admin/blogs', requiredPermission: 'blog.view' },
  { icon: 'Image', label: 'গ্যালারি', path: '/admin/gallery', requiredPermission: 'gallery.view' },
  { icon: 'Vote', label: 'পোল', path: '/admin/polls', requiredPermission: 'poll.view_results' },
  { icon: 'SlidersHorizontal', label: 'অ্যাডমিন কন্ট্রোল', path: '/admin/controls', requiredPermission: 'settings.org' },
  { icon: 'Bell', label: 'বিজ্ঞপ্তি', path: '/admin/notifications', anyPermissions: ['notification.send', 'notification.view_log'] },
  {
    icon: 'LayoutTemplate',
    label: 'হোমপেজ',
    path: '/admin/committee',
    anyPermissions: [
      'homepage.committee',
      'homepage.achievements',
      'homepage.testimonials',
      'homepage.partners',
    ],
  },
  {
    icon: 'ShieldCheck',
    label: 'ভূমিকা',
    path: '/admin/settings/roles',
    requiredPermission: 'settings.roles',
  },
  {
    icon: 'SlidersHorizontal',
    label: 'সেটিংস',
    path: '/admin/settings/org',
    anyPermissions: ['settings.org', 'settings.appearance', 'settings.security', 'settings.backup'],
  },
  { icon: 'Settings', label: 'অ্যাকাউন্ট', path: '/account', requiredPermission: null },
]

export const ADMIN_ROUTE_REQUIREMENTS = [
  { prefix: '/admin/settings/roles', requiredPermission: 'settings.roles' },
  { prefix: '/admin/settings/security', requiredPermission: 'settings.security' },
  { prefix: '/admin/settings/appearance', requiredPermission: 'settings.appearance' },
  { prefix: '/admin/settings', requiredPermission: 'settings.org' },
  { prefix: '/admin/controls', requiredPermission: 'settings.org' },
  { prefix: '/admin/audit', requiredPermission: 'audit.view' },
  { prefix: '/admin/finance', requiredPermission: 'finance.view' },
  { prefix: '/admin/members', requiredPermission: 'member.view' },
  { prefix: '/admin/notices', requiredPermission: 'notice.view' },
  { prefix: '/admin/meetings', requiredPermission: 'meeting.view' },
  { prefix: '/admin/tours', requiredPermission: 'tour.view' },
  { prefix: '/admin/blogs', requiredPermission: 'blog.view' },
  { prefix: '/admin/gallery', requiredPermission: 'gallery.view' },
  { prefix: '/admin/polls', requiredPermission: 'poll.view_results' },
  { prefix: '/admin/notifications', anyPermissions: ['notification.send', 'notification.view_log'] },
  { prefix: '/admin/committee', requiredPermission: 'homepage.committee' },
  { prefix: '/admin/achievements', requiredPermission: 'homepage.achievements' },
  { prefix: '/admin/testimonials', requiredPermission: 'homepage.testimonials' },
  { prefix: '/admin/partners', requiredPermission: 'homepage.partners' },
  { prefix: '/admin', requiredPermission: null },
]

export const hasPermission = (user, permission) => {
  if (!permission) {
    return true
  }

  if (!user) {
    return false
  }

  if (user.role === 'admin') {
    return true
  }

  const permissions = user.effectivePermissions || []
  return permissions.includes('*') || permissions.includes(permission)
}

export const hasAnyPermission = (user, permissions = []) =>
  permissions.some((permission) => hasPermission(user, permission))

export const isStaffUser = (user) => {
  if (!user) {
    return false
  }

  if (user.role === 'admin' || user.role === 'moderator') {
    return true
  }

  return (user.effectivePermissions || []).some(
    (permission) => permission === '*' || !['notice.view', 'meeting.view', 'tour.view', 'blog.view', 'gallery.view', 'gallery.upload', 'poll.view_results'].includes(permission),
  )
}

export const getNavItemsForUser = (user) =>
  NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission && !item.anyPermissions) {
      return true
    }

    if (item.anyPermissions) {
      return hasAnyPermission(user, item.anyPermissions)
    }

    return hasPermission(user, item.requiredPermission)
  })

export const getAdminRouteRequirement = (pathname) =>
  ADMIN_ROUTE_REQUIREMENTS.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  ) || { requiredPermission: null }

export const canAccessRequirement = (user, requirement) => {
  if (!requirement) {
    return true
  }

  if (requirement.anyPermissions) {
    return hasAnyPermission(user, requirement.anyPermissions)
  }

  return hasPermission(user, requirement.requiredPermission)
}

export const getFirstAdminPath = (user) => {
  const firstItem = getNavItemsForUser(user).find((item) => item.path.startsWith('/admin'))
  return firstItem?.path || '/admin/unauthorized'
}
