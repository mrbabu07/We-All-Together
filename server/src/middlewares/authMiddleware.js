const User = require('../models/User')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const AppError = require('../utils/appError')
const asyncHandler = require('../utils/asyncHandler')
const { verifyAccessToken } = require('../utils/tokenUtils')

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication token is required.', 401)
  }

  const decoded = verifyAccessToken(token)
  const user = await User.findById(decoded.id)

  if (!user) {
    throw new AppError('Authenticated user no longer exists.', 401)
  }

  if (Number(user.sessionVersion || 0) > Number(decoded.sessionVersion || 0)) {
    throw new AppError('Your session has expired. Please log in again.', 401)
  }

  req.user = user
  next()
})

const requireActive = (req, res, next) => {
  if (!req.user) {
    next(new AppError('Authentication is required.', 401))
    return
  }

  if (req.user.softDeletedAt) {
    next(new AppError('Your account is no longer active.', 403))
    return
  }

  if (req.user.suspendedAt) {
    next(new AppError(req.user.suspensionReason || 'Your account is suspended.', 403))
    return
  }

  if (req.user.status === USER_STATUSES.PENDING) {
    next(new AppError('Your account is pending admin approval.', 403))
    return
  }

  if (req.user.status === USER_STATUSES.REJECTED) {
    next(new AppError('Your registration was rejected.', 403))
    return
  }

  if (req.user.status !== USER_STATUSES.APPROVED) {
    next(new AppError('Your account is not active.', 403))
    return
  }

  next()
}

const protect = (req, res, next) => {
  authenticate(req, res, (error) => {
    if (error) {
      next(error)
      return
    }

    requireActive(req, res, next)
  })
}

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      next(new AppError('Authentication is required.', 401))
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('You do not have permission to access this resource.', 403))
      return
    }

    next()
  }
}

const requireAdmin = requireRole(USER_ROLES.ADMIN)

const requireMember = requireRole(USER_ROLES.MEMBER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN)

const getDefaultOwnerId = (req) =>
  req.params.memberId || req.params.userId || req.params.id || req.body.memberId || req.body.userId

const buildOwnershipMiddleware = (resolveOwnerId = getDefaultOwnerId) => {
  return (req, res, next) => {
    if (!req.user) {
      next(new AppError('Authentication is required.', 401))
      return
    }

    const ownerId = resolveOwnerId(req)

    if (!ownerId) {
      next(new AppError('Resource owner could not be resolved.', 400))
      return
    }

    if (ownerId.toString() !== req.user._id.toString()) {
      next(new AppError('You can only access your own resource.', 403))
      return
    }

    next()
  }
}

const requireOwnership = (resolveOwnerIdOrReq, res, next) => {
  if (typeof next === 'function') {
    return buildOwnershipMiddleware()(resolveOwnerIdOrReq, res, next)
  }

  const resolveOwnerId =
    typeof resolveOwnerIdOrReq === 'function' ? resolveOwnerIdOrReq : getDefaultOwnerId
  return buildOwnershipMiddleware(resolveOwnerId)
}

module.exports = {
  authenticate,
  protect,
  requireActive,
  requireAdmin,
  requireMember,
  requireOwnership,
}
