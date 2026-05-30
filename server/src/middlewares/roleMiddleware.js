const AppError = require('../utils/appError')
const { USER_ROLES } = require('../constants/userConstants')
const { requireAdmin, requireMember } = require('./authMiddleware')

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      next(new AppError('Authentication is required.', 401))
      return
    }

    const isAllowedRole = allowedRoles.includes(req.user.role)
    const hasPermissionBypass = allowedRoles.includes(USER_ROLES.ADMIN) && req.permissionSatisfied
    const isCustomStaffActingAsMember =
      allowedRoles.includes(USER_ROLES.MEMBER) &&
      req.user.role &&
      !Object.values(USER_ROLES).includes(req.user.role)

    if (!isAllowedRole && !hasPermissionBypass && !isCustomStaffActingAsMember) {
      next(new AppError('You do not have permission to access this resource.', 403))
      return
    }

    next()
  }
}

module.exports = {
  authorize,
  requireAdmin,
  requireMember,
}
