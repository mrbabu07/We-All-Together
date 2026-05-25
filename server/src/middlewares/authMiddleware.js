const User = require('../models/User')
const { USER_STATUSES } = require('../constants/userConstants')
const AppError = require('../utils/appError')
const asyncHandler = require('../utils/asyncHandler')
const { verifyAccessToken } = require('../utils/tokenUtils')

const protect = asyncHandler(async (req, res, next) => {
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

  if (user.status !== USER_STATUSES.APPROVED) {
    throw new AppError('Your account is not approved yet.', 403)
  }

  req.user = user
  next()
})

module.exports = {
  protect,
}
