export const BASE_ROLES = ['admin', 'member', 'moderator']

export const NOTICE_MANAGE_PERMISSIONS = [
  'notice.view',
  'notice.create',
  'notice.edit',
  'notice.delete',
  'notice.pin',
  'notice.publish',
  'notice.archive',
]

export const MEETING_MANAGE_PERMISSIONS = [
  'meeting.view',
  'meeting.create',
  'meeting.edit',
  'meeting.delete',
  'meeting.attendance',
  'meeting.minutes',
]

export const TOUR_MANAGE_PERMISSIONS = [
  'tour.view',
  'tour.create',
  'tour.edit',
  'tour.delete',
  'tour.manage_registration',
]

export const BLOG_MANAGE_PERMISSIONS = [
  'blog.view',
  'blog.approve',
  'blog.reject',
  'blog.delete',
  'blog.edit_any',
]

export const GALLERY_MANAGE_PERMISSIONS = [
  'gallery.view',
  'gallery.upload',
  'gallery.approve',
  'gallery.delete',
  'gallery.manage_albums',
]

export const MEMBER_MANAGE_PERMISSIONS = [
  'member.view',
  'member.approve',
  'member.reject',
  'member.suspend',
  'member.edit',
  'member.reset_password',
  'member.export',
]

export const FINANCE_MANAGE_PERMISSIONS = [
  'finance.view',
  'finance.approve_fees',
  'finance.add_expense',
  'finance.add_donation',
  'finance.waive_fee',
  'finance.export',
]

export const POLL_MANAGE_PERMISSIONS = ['poll.view_results', 'poll.create', 'poll.edit', 'poll.delete']

export const NAV_ITEMS = [
  { icon: 'LayoutDashboard', label: 'ড্যাশবোর্ড', path: '/admin/dashboard', requiredPermission: null },
  { icon: 'ClipboardList', label: 'নোটিশ', path: '/admin/notices', anyPermissions: NOTICE_MANAGE_PERMISSIONS },
  { icon: 'CalendarDays', label: 'মিটিং', path: '/admin/meetings', anyPermissions: MEETING_MANAGE_PERMISSIONS },
  { icon: 'MapPin', label: 'ট্যুর', path: '/admin/tours', anyPermissions: TOUR_MANAGE_PERMISSIONS },
  { icon: 'Users', label: 'সদস্য', path: '/admin/members', anyPermissions: MEMBER_MANAGE_PERMISSIONS },
  { icon: 'BarChart3', label: 'আর্থিক', path: '/admin/finance/payments', anyPermissions: FINANCE_MANAGE_PERMISSIONS },
  { icon: 'BookOpenText', label: 'ব্লগ', path: '/admin/blogs', anyPermissions: BLOG_MANAGE_PERMISSIONS },
  { icon: 'Image', label: 'গ্যালারি', path: '/admin/gallery', anyPermissions: GALLERY_MANAGE_PERMISSIONS },
  {
    icon: 'Vote',
    label: 'পোল',
    path: '/admin/polls',
    anyPermissions: POLL_MANAGE_PERMISSIONS,
  },
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
  { prefix: '/admin/finance', anyPermissions: FINANCE_MANAGE_PERMISSIONS },
  { prefix: '/admin/members', anyPermissions: MEMBER_MANAGE_PERMISSIONS },
  { prefix: '/admin/notices', anyPermissions: NOTICE_MANAGE_PERMISSIONS },
  { prefix: '/admin/meetings', anyPermissions: MEETING_MANAGE_PERMISSIONS },
  { prefix: '/admin/tours', anyPermissions: TOUR_MANAGE_PERMISSIONS },
  { prefix: '/admin/blogs', anyPermissions: BLOG_MANAGE_PERMISSIONS },
  { prefix: '/admin/gallery', anyPermissions: GALLERY_MANAGE_PERMISSIONS },
  { prefix: '/admin/polls', anyPermissions: POLL_MANAGE_PERMISSIONS },
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
