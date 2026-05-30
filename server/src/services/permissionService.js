const Role = require('../models/Role')
const { ALL_PERMISSIONS, DEFAULT_ROLES } = require('../constants/permissionConstants')
const { USER_ROLES } = require('../constants/userConstants')

const ROLE_CACHE_TTL_MS = 5 * 60 * 1000
const roleCache = new Map()

const normalizePermissionList = (permissions = []) =>
  [...new Set(permissions.filter((permission) => permission === '*' || ALL_PERMISSIONS[permission]))]

const seedDefaultRoles = async () => {
  const count = await Role.countDocuments()

  if (count === 0) {
    await Role.insertMany(DEFAULT_ROLES, { ordered: true })
    return
  }

  await Promise.all(
    DEFAULT_ROLES.map(async (role) => {
      const exists = await Role.exists({ name: role.name })
      if (!exists) {
        await Role.create(role)
      }
    }),
  )
}

const invalidateRoleCache = (roleName = '') => {
  if (roleName) {
    roleCache.delete(roleName)
    return
  }

  roleCache.clear()
}

const getRoleByName = async (name = '') => {
  const roleName = String(name || USER_ROLES.MEMBER).trim() || USER_ROLES.MEMBER
  const cached = roleCache.get(roleName)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.role
  }

  const role = await Role.findOne({ name: roleName })
  roleCache.set(roleName, {
    expiresAt: Date.now() + ROLE_CACHE_TTL_MS,
    role,
  })

  return role
}

const getEffectivePermissions = async (user) => {
  if (!user) {
    return []
  }

  if (user.role === USER_ROLES.ADMIN) {
    return ['*']
  }

  const role = await getRoleByName(user.role)
  const rolePermissions = normalizePermissionList(role?.permissions || [])

  if (rolePermissions.includes('*')) {
    return ['*']
  }

  const customPermissions = normalizePermissionList(user.customPermissions || [])
  const deniedPermissions = new Set(user.deniedPermissions || [])

  return normalizePermissionList([...rolePermissions, ...customPermissions]).filter(
    (permission) => !deniedPermissions.has(permission),
  )
}

const hasPermission = async (user, permission) => {
  if (!user) {
    return false
  }

  if (user.role === USER_ROLES.ADMIN) {
    return true
  }

  const effectivePermissions = await getEffectivePermissions(user)

  return effectivePermissions.includes('*') || effectivePermissions.includes(permission)
}

const getAttachedPermissions = (user) =>
  user?.effectivePermissions || user?.$locals?.effectivePermissions || []

const hasAttachedPermission = (user, permission) => {
  if (!user) {
    return false
  }

  if (user.role === USER_ROLES.ADMIN) {
    return true
  }

  const effectivePermissions = getAttachedPermissions(user)
  return effectivePermissions.includes('*') || effectivePermissions.includes(permission)
}

const attachEffectivePermissions = async (user) => {
  if (!user) {
    return user
  }

  const effectivePermissions = await getEffectivePermissions(user)
  user.$locals = user.$locals || {}
  user.$locals.effectivePermissions = effectivePermissions
  user.effectivePermissions = effectivePermissions

  return user
}

const toUserWithPermissions = async (user) => {
  const effectivePermissions = await getEffectivePermissions(user)
  const payload = typeof user?.toJSON === 'function' ? user.toJSON() : { ...user }

  payload.effectivePermissions = effectivePermissions

  return payload
}

module.exports = {
  attachEffectivePermissions,
  getAttachedPermissions,
  getEffectivePermissions,
  getRoleByName,
  hasAttachedPermission,
  hasPermission,
  invalidateRoleCache,
  seedDefaultRoles,
  toUserWithPermissions,
}
