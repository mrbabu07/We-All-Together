const AppError = require('../utils/appError')

const authorize = (...allowedRoles) => {
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

module.exports = {
  authorize,
}
