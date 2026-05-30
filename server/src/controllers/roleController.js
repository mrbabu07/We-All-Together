const Role = require('../models/Role')
const User = require('../models/User')
const AppError = require('../utils/appError')
const asyncHandler = require('../utils/asyncHandler')
const { recordAuditLog } = require('../services/auditService')
const {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  SETTINGS_PERMISSIONS,
} = require('../constants/permissionConstants')
const {
  getEffectivePermissions,
  invalidateRoleCache,
} = require('../services/permissionService')

const normalizeRoleName = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const normalizePermissionList = (permissions = [], { allowSettings = false } = {}) => {
  if (!Array.isArray(permissions)) {
    return []
  }

  return [
    ...new Set(
      permissions
        .map((permission) => String(permission || '').trim())
        .filter((permission) => {
          if (permission === '*') return allowSettings
          if (!ALL_PERMISSIONS[permission]) return false
          if (!allowSettings && SETTINGS_PERMISSIONS.includes(permission)) return false
          return true
        }),
    ),
  ]
}

const buildRolePayload = (body, existingRole = null) => {
  const roleName = normalizeRoleName(body.name || existingRole?.name)

  if (!roleName) {
    throw new AppError('Role name is required.', 400)
  }

  const isSystemRole = Boolean(existingRole?.isSystem)
  const allowSettings = roleName === 'admin'
  const payload = {
    color: typeof body.color === 'string' && body.color.trim() ? body.color.trim() : '#00ADB5',
    description: typeof body.description === 'string' ? body.description.trim() : '',
    name: roleName,
    nameEnglish: typeof body.nameEnglish === 'string' ? body.nameEnglish.trim() : '',
    permissions: normalizePermissionList(body.permissions, { allowSettings }),
  }

  if (isSystemRole) {
    payload.name = existingRole.name
    payload.isSystem = existingRole.isSystem
    payload.isDefault = existingRole.isDefault
  }

  return payload
}

const serializeRole = async (role) => {
  const memberCount = await User.countDocuments({ role: role.name, softDeletedAt: null })
  const raw = typeof role.toObject === 'function' ? role.toObject() : role

  return {
    ...raw,
    memberCount,
  }
}

const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ isSystem: -1, name: 1 })
  const serialized = await Promise.all(roles.map(serializeRole))

  res.status(200).json({
    success: true,
    message: 'Roles loaded successfully.',
    data: {
      allPermissions: ALL_PERMISSIONS,
      permissionGroups: PERMISSION_GROUPS,
      roles: serialized,
      settingsPermissions: SETTINGS_PERMISSIONS,
    },
  })
})

const createRole = asyncHandler(async (req, res) => {
  const payload = buildRolePayload(req.body)
  const role = await Role.create({
    ...payload,
    createdBy: req.user._id,
  })
  invalidateRoleCache(role.name)
  await recordAuditLog({
    action: 'role.created',
    actor: req.user,
    entityId: role._id,
    entityType: 'Role',
    metadata: {
      name: role.name,
      permissions: role.permissions,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Role created successfully.',
    data: { role: await serializeRole(role) },
  })
})

const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id)

  if (!role) {
    throw new AppError('Role not found.', 404)
  }

  if (role.isSystem && role.name !== 'member') {
    throw new AppError('This system role cannot be edited.', 400)
  }

  const previousRole = role.name
  const previousPermissions = [...role.permissions]
  const payload = buildRolePayload(req.body, role)

  Object.assign(role, payload)
  await role.save()
  invalidateRoleCache(previousRole)
  invalidateRoleCache(role.name)

  if (previousRole !== role.name) {
    await User.updateMany({ role: previousRole }, { $set: { role: role.name }, $inc: { sessionVersion: 1 } })
  } else {
    await User.updateMany({ role: role.name }, { $inc: { sessionVersion: 1 } })
  }

  await recordAuditLog({
    action: 'role.updated',
    actor: req.user,
    entityId: role._id,
    entityType: 'Role',
    metadata: {
      name: role.name,
      previousPermissions,
      permissions: role.permissions,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Role updated successfully.',
    data: { role: await serializeRole(role) },
  })
})

const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id)

  if (!role) {
    throw new AppError('Role not found.', 404)
  }

  if (role.isSystem || role.isDefault) {
    throw new AppError('System roles cannot be deleted.', 400)
  }

  const reassignTo = normalizeRoleName(req.body.reassignTo || 'member')
  const targetRole = await Role.findOne({ name: reassignTo })

  if (!targetRole || targetRole._id.equals(role._id)) {
    throw new AppError('Select a valid role to reassign members.', 400)
  }

  const memberCount = await User.countDocuments({ role: role.name })
  await User.updateMany({ role: role.name }, { $set: { role: targetRole.name }, $inc: { sessionVersion: 1 } })
  await role.deleteOne()
  invalidateRoleCache(role.name)
  await recordAuditLog({
    action: 'role.deleted',
    actor: req.user,
    entityId: req.params.id,
    entityType: 'Role',
    metadata: {
      memberCount,
      name: role.name,
      reassignedTo: targetRole.name,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Role deleted successfully.',
    data: { id: req.params.id, reassignedTo: targetRole.name },
  })
})

const getRoleMembers = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id)

  if (!role) {
    throw new AppError('Role not found.', 404)
  }

  const members = await User.find({ role: role.name, softDeletedAt: null }).sort({ name: 1 })

  res.status(200).json({
    success: true,
    message: 'Role members loaded successfully.',
    data: { members, role },
  })
})

const getUserPermissions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found.', 404)
  }

  const effectivePermissions = await getEffectivePermissions(user)

  res.status(200).json({
    success: true,
    message: 'User permissions loaded successfully.',
    data: {
      customPermissions: user.customPermissions || [],
      deniedPermissions: user.deniedPermissions || [],
      effectivePermissions,
      role: user.role,
      user,
    },
  })
})

const assignUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found.', 404)
  }

  const roleName = normalizeRoleName(req.body.role)
  const role = await Role.findOne({ name: roleName })

  if (!role) {
    throw new AppError('Role not found.', 404)
  }

  const previousRole = user.role
  user.role = role.name
  user.sessionVersion = Number(user.sessionVersion || 0) + 1
  await user.save()
  await recordAuditLog({
    action: 'role.assigned',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
    metadata: {
      newRole: role.name,
      previousRole,
      reason: typeof req.body.reason === 'string' ? req.body.reason.trim() : '',
    },
  })

  res.status(200).json({
    success: true,
    message: 'Role assigned successfully.',
    data: { user },
  })
})

const setUserPermissions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found.', 404)
  }

  const previousCustomPermissions = [...(user.customPermissions || [])]
  const previousDeniedPermissions = [...(user.deniedPermissions || [])]
  user.customPermissions = normalizePermissionList(req.body.customPermissions)
  user.deniedPermissions = normalizePermissionList(req.body.deniedPermissions, { allowSettings: true }).filter(
    (permission) => permission !== '*',
  )
  user.sessionVersion = Number(user.sessionVersion || 0) + 1
  await user.save()
  await recordAuditLog({
    action: 'permission.updated',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
    metadata: {
      customPermissions: user.customPermissions,
      deniedPermissions: user.deniedPermissions,
      previousCustomPermissions,
      previousDeniedPermissions,
      reason: typeof req.body.reason === 'string' ? req.body.reason.trim() : '',
    },
  })

  res.status(200).json({
    success: true,
    message: 'Permissions updated successfully.',
    data: {
      effectivePermissions: await getEffectivePermissions(user),
      user,
    },
  })
})

module.exports = {
  assignUserRole,
  createRole,
  deleteRole,
  getRoleMembers,
  getRoles,
  getUserPermissions,
  setUserPermissions,
  updateRole,
}
