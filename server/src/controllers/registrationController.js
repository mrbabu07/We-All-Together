const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { getSettings } = require('../services/settingsService')
const {
  validateRegistration,
  validateRejectRegistration,
} = require('../validators/registrationValidators')

const ensureAdmin = (user) => {
  if (!user || user.role !== USER_ROLES.ADMIN) {
    throw new AppError('Admin access is required.', 403)
  }
}

const registerMember = asyncHandler(async (req, res) => {
  const payload = validateRegistration(req.body)
  const settings = await getSettings()

  const user = await User.create({
    name: payload.name,
    phone: payload.phone,
    address: payload.address,
    password: payload.password,
    role: USER_ROLES.MEMBER,
    status: USER_STATUSES.PENDING,
    registrationPayment: {
      amount: settings.registrationFee,
      method: payload.payment.method,
      transactionId: payload.payment.transactionId,
      senderPhone: payload.payment.senderPhone,
      note: payload.payment.note,
      status: PAYMENT_STATUSES.PENDING,
      paidAt: new Date(),
    },
  })

  res.status(201).json({
    success: true,
    message: 'Registration submitted. Please wait for admin approval.',
    data: {
      user,
    },
  })
})

const getPendingRegistrations = asyncHandler(async (req, res) => {
  ensureAdmin(req.user)

  const users = await User.find({ status: USER_STATUSES.PENDING }).sort({
    createdAt: -1,
  })

  res.status(200).json({
    success: true,
    message: 'Pending registrations loaded successfully.',
    data: {
      users,
    },
  })
})

const approveRegistration = asyncHandler(async (req, res) => {
  ensureAdmin(req.user)

  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('Registration not found.', 404)
  }

  if (user.status !== USER_STATUSES.PENDING) {
    throw new AppError('Only pending registrations can be approved.', 400)
  }

  user.status = USER_STATUSES.APPROVED
  user.approvedAt = new Date()
  user.approvedBy = req.user._id
  user.registrationPayment.status = PAYMENT_STATUSES.VERIFIED
  user.registrationPayment.verifiedAt = new Date()
  user.registrationPayment.verifiedBy = req.user._id
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Registration approved successfully.',
    data: {
      user,
    },
  })
})

const rejectRegistration = asyncHandler(async (req, res) => {
  ensureAdmin(req.user)
  const payload = validateRejectRegistration(req.body)

  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('Registration not found.', 404)
  }

  if (user.status !== USER_STATUSES.PENDING) {
    throw new AppError('Only pending registrations can be rejected.', 400)
  }

  user.status = USER_STATUSES.REJECTED
  user.rejectedAt = new Date()
  user.rejectedBy = req.user._id
  user.registrationPayment.status = PAYMENT_STATUSES.REJECTED
  user.registrationPayment.note = payload.reason || user.registrationPayment.note
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Registration rejected successfully.',
    data: {
      user,
    },
  })
})

module.exports = {
  approveRegistration,
  getPendingRegistrations,
  registerMember,
  rejectRegistration,
}
