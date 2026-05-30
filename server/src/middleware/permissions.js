const {
  requireAnyPermission,
  requirePermission,
  requirePermissionOrRoles,
} = require('../middlewares/permissionMiddleware')
const {
  getAttachedPermissions,
  getEffectivePermissions,
  hasAttachedPermission,
  hasPermission,
} = require('../services/permissionService')

module.exports = {
  getAttachedPermissions,
  getEffectivePermissions,
  hasAttachedPermission,
  hasPermission,
  requireAnyPermission,
  requirePermission,
  requirePermissionOrRoles,
}
