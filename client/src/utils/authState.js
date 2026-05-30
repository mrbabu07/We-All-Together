import { isStaffUser } from './permissionUtils'

export const ACCOUNT_STATUS_PATHS = ['/pending', '/rejected', '/suspended']
export const MODERATOR_ADMIN_PATHS = ['/admin/blogs', '/admin/gallery']

export const getAccountStatusPath = (user) => {
  if (!user) {
    return null
  }

  if (user.suspendedAt || user.softDeletedAt) {
    return '/suspended'
  }

  if (user.status === 'pending') {
    return '/pending'
  }

  if (user.status === 'rejected') {
    return '/rejected'
  }

  return null
}

export const getDashboardPath = (user) => {
  if (isStaffUser(user)) {
    return '/admin'
  }

  return '/member'
}

export const getReturnUrl = (location) => {
  const path = `${location.pathname}${location.search || ''}`
  return `/login?returnUrl=${encodeURIComponent(path)}`
}

export const isSafeReturnUrl = (url) =>
  typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login')

export const canUseReturnUrlForUser = (url, user) => {
  if (!isSafeReturnUrl(url)) {
    return false
  }

  if (!url.startsWith('/admin')) {
    return true
  }

  if (user?.role === 'admin') {
    return true
  }

  if (isStaffUser(user)) {
    return true
  }

  return (
    user?.role === 'moderator' &&
    MODERATOR_ADMIN_PATHS.some((path) => url === path || url.startsWith(`${path}/`))
  )
}

export const getJwtExpiry = (token) => {
  try {
    const [, payload] = token.split('.')

    if (!payload) {
      return null
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = JSON.parse(window.atob(padded))

    return decoded.exp ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}
