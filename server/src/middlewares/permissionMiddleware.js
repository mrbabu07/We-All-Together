const AuditLog = require('../models/AuditLog')
const AppError = require('../utils/appError')
const asyncHandler = require('../utils/asyncHandler')
const { hasPermission } = require('../services/permissionService')

const DENIED_MESSAGE = 'আপনার এই কাজ করার অনুমতি নেই'
const UNAUTHORIZED_MESSAGE = 'অননুমোদিত'

const logDeniedPermission = (req, metadata) =>
  AuditLog.create({
    action: 'permission.denied',
    actor: req.user._id,
    entityType: 'Permission',
    ip: req.ip || '',
    metadata: {
      path: req.originalUrl || req.path,
      ...metadata,
    },
  })

const requirePermission = (permission) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError(UNAUTHORIZED_MESSAGE, 401)
    }

    const allowed = await hasPermission(req.user, permission)

    if (!allowed) {
      await logDeniedPermission(req, { permission })
      throw new AppError(DENIED_MESSAGE, 403, { required: permission })
    }

    req.requiredPermission = permission
    req.permissionSatisfied = true
    next()
  })

const requireAnyPermission = (...permissions) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError(UNAUTHORIZED_MESSAGE, 401)
    }

    for (const permission of permissions) {
      if (await hasPermission(req.user, permission)) {
        req.requiredPermission = permission
        req.permissionSatisfied = true
        next()
        return
      }
    }

    await logDeniedPermission(req, { permissions })
    throw new AppError(DENIED_MESSAGE, 403, { required: permissions })
  })

const requirePermissionOrRoles = (permission, ...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError(UNAUTHORIZED_MESSAGE, 401)
    }

    if (roles.includes(req.user.role) || (await hasPermission(req.user, permission))) {
      req.requiredPermission = permission
      req.permissionSatisfied = true
      next()
      return
    }

    await logDeniedPermission(req, { permission })
    throw new AppError(DENIED_MESSAGE, 403, { required: permission })
  })

module.exports = {
  requireAnyPermission,
  requirePermission,
  requirePermissionOrRoles,
}
