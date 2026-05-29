const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { generateAccessToken } = require('../utils/tokenUtils')
const {
  validateBootstrapAdmin,
  validateChangePassword,
  validateLogin,
  validateProfileUpdate,
} = require('../validators/authValidators')
const env = require('../config/env')
const { recordAuditLog } = require('../services/auditService')

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
    email: payload.email,
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
  const query = payload.email ? { email: payload.email } : { phone: payload.phone }
  const user = await User.findOne(query).select('+password')

  if (!user || !(await user.comparePassword(payload.password))) {
    await recordAuditLog({
      action: 'auth.login.failed',
      actor: user || null,
      entityType: 'Auth',
      ip: req.ip || '',
      metadata: {
        identifier: payload.email || payload.phone,
      },
    })
    throw new AppError('Invalid email/phone or password.', 401)
  }

  user.lastLoginAt = new Date()
  user.lastLoginIp = req.ip || ''
  await user.save()
  await recordAuditLog({
    action: 'auth.login.success',
    actor: user,
    entityType: 'Auth',
    ip: req.ip || '',
    metadata: {
      identifier: payload.email || payload.phone,
    },
  })

  sendAuthResponse(res, user)
})

const refreshToken = asyncHandler(async (req, res) => {
  sendAuthResponse(res, req.user)
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

const updateMe = asyncHandler(async (req, res) => {
  const payload = validateProfileUpdate(req.body)
  const user = await User.findById(req.user._id)

  if (!user) {
    throw new AppError('Authenticated user no longer exists.', 401)
  }

  user.name = payload.name
  user.phone = payload.phone
  user.address = payload.address
  user.profilePhotoUrl = payload.profilePhotoUrl
  user.nidImageUrl = payload.nidImageUrl
  user.birthCertificateUrl = payload.birthCertificateUrl
  user.passportImageUrl = payload.passportImageUrl
  if (payload.emergencyContact) {
    user.emergencyContact = payload.emergencyContact
  }
  if (payload.notificationPreferences) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...payload.notificationPreferences,
    }
  }
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user,
    },
  })
})

const changePassword = asyncHandler(async (req, res) => {
  const payload = validateChangePassword(req.body)
  const user = await User.findById(req.user._id).select('+password')

  if (!user) {
    throw new AppError('Authenticated user no longer exists.', 401)
  }

  if (!(await user.comparePassword(payload.currentPassword))) {
    throw new AppError('Current password is incorrect.', 401)
  }

  user.password = payload.newPassword
  user.passwordChangedAt = new Date()
  user.sessionVersion = Number(user.sessionVersion || 0) + 1
  await user.save()
  await recordAuditLog({
    action: 'auth.password.change',
    actor: user,
    entityType: 'User',
    ip: req.ip || '',
  })

  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
  })
})

module.exports = {
  bootstrapAdmin,
  changePassword,
  getMe,
  login,
  refreshToken,
  updateMe,
}
