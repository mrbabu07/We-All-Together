const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { generateAccessToken } = require('../utils/tokenUtils')
const { validateBootstrapAdmin, validateLogin } = require('../validators/authValidators')
const env = require('../config/env')

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = generateAccessToken(user)

  res.status(statusCode).json({
    success: true,
    message: 'Authentication successful.',
    data: {
      token,
      user,
    },
  })
}

const bootstrapAdmin = asyncHandler(async (req, res) => {
  const payload = validateBootstrapAdmin(req.body)

  if (!env.adminBootstrapSecret || payload.setupSecret !== env.adminBootstrapSecret) {
    throw new AppError('Invalid admin setup secret.', 401)
  }

  const adminExists = await User.exists({ role: USER_ROLES.ADMIN })

  if (adminExists) {
    throw new AppError('Admin already exists.', 409)
  }

  const user = await User.create({
    name: payload.name,
    phone: payload.phone,
    address: payload.address,
    password: payload.password,
    role: USER_ROLES.ADMIN,
    status: USER_STATUSES.APPROVED,
    approvedAt: new Date(),
  })

  sendAuthResponse(res, user, 201)
})

const login = asyncHandler(async (req, res) => {
  const payload = validateLogin(req.body)
  const user = await User.findOne({ phone: payload.phone }).select('+password')

  if (!user || !(await user.comparePassword(payload.password))) {
    throw new AppError('Invalid phone or password.', 401)
  }

  if (user.status !== USER_STATUSES.APPROVED) {
    throw new AppError('Your account is not approved yet.', 403)
  }

  sendAuthResponse(res, user)
})

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile loaded successfully.',
    data: {
      user: req.user,
    },
  })
})

module.exports = {
  bootstrapAdmin,
  getMe,
  login,
}
