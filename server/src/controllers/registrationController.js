const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { getSettings } = require('../services/settingsService')
const { recordAuditLog } = require('../services/auditService')
const { createNotification } = require('../services/notificationService')
const {
  validateRegistration,
  validateRejectRegistration,
} = require('../validators/registrationValidators')

const registerMember = asyncHandler(async (req, res) => {
  const payload = validateRegistration(req.body)
  const settings = await getSettings()

  if (settings.siteSettings?.registrationEnabled === false) {
    throw new AppError('New registrations are currently disabled.', 403)
  }

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
      proofImageUrl: payload.payment.proofImageUrl,
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
  await createNotification({
    createdBy: req.user,
    link: '/member',
    message: 'Your registration has been approved. You can now access member features.',
    title: 'Registration approved',
    type: 'registration',
    user,
  })
  await recordAuditLog({
    action: 'registration.approve',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
    metadata: {
      phone: user.phone,
      registrationFee: user.registrationPayment.amount,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Registration approved successfully.',
    data: {
      user,
    },
  })
})

const rejectRegistration = asyncHandler(async (req, res) => {
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
  await recordAuditLog({
    action: 'registration.reject',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
    metadata: {
      phone: user.phone,
      reason: payload.reason || '',
    },
  })

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
