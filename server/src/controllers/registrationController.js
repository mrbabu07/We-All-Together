const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { getSettings } = require('../services/settingsService')
const {
  approvePendingRegistrations,
  rejectPendingRegistrations,
} = require('../services/registrationModerationService')
const {
  validateRegistration,
  validateRejectRegistration,
} = require('../validators/registrationValidators')

const RE_REGISTRATION_WAIT_MS = 30 * 24 * 60 * 60 * 1000

const getBodyUserIds = (body) => body.userIds || body.ids || body.memberIds

const getReRegistrationDate = (user) =>
  new Date((user.rejectedAt || user.updatedAt || user.createdAt).getTime() + RE_REGISTRATION_WAIT_MS)

const assertCanUsePhoneForRegistration = async (payload) => {
  const existingUser = await User.findOne({ phone: payload.phone }).select('+password')

  if (!existingUser) {
    return null
  }

  if (existingUser.status !== USER_STATUSES.REJECTED) {
    throw new AppError('This phone number is already registered.', 409)
  }

  const nextRegistrationAt = getReRegistrationDate(existingUser)

  if (nextRegistrationAt > new Date()) {
    throw new AppError(
      `This phone number can re-register after ${nextRegistrationAt.toISOString().slice(0, 10)}.`,
      409,
    )
  }

  return existingUser
}

const buildRegistrationFields = ({ payload, registrationFee }) => ({
  address: payload.address,
  name: payload.name,
  password: payload.password,
  role: USER_ROLES.MEMBER,
  status: USER_STATUSES.PENDING,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  softDeletedAt: null,
  suspendedAt: null,
  suspendedBy: null,
  suspensionReason: '',
  deleteRequestedAt: null,
  deleteRequestReason: '',
  registrationPayment: {
    amount: registrationFee,
    method: payload.payment.method,
    transactionId: payload.payment.transactionId,
    senderPhone: payload.payment.senderPhone,
    note: payload.payment.note,
    proofImageUrl: payload.payment.proofImageUrl,
    status: PAYMENT_STATUSES.PENDING,
    paidAt: new Date(),
    verifiedAt: null,
    verifiedBy: null,
  },
})

const registerMember = asyncHandler(async (req, res) => {
  const payload = validateRegistration(req.body)
  const settings = await getSettings()

  if (settings.siteSettings?.registrationEnabled === false) {
    throw new AppError('New registrations are currently disabled.', 403)
  }

  const reusableRejectedUser = await assertCanUsePhoneForRegistration(payload)
  const registrationFields = buildRegistrationFields({
    payload,
    registrationFee: settings.registrationFee,
  })
  const user = reusableRejectedUser || new User({ phone: payload.phone })

  Object.assign(user, registrationFields)
  await user.save()

  res.status(201).json({
    success: true,
    message: 'Registration submitted. Please wait for admin approval.',
    data: {
      user,
    },
  })
})

const getPendingRegistrations = asyncHandler(async (req, res) => {
  const filter = { status: USER_STATUSES.PENDING }
  const createdAt = {}
  const from = req.query.from || req.query.dateFrom
  const to = req.query.to || req.query.dateTo
  const address = req.query.address || req.query.area

  if (from) {
    createdAt.$gte = new Date(from)
  }

  if (to) {
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    createdAt.$lte = end
  }

  if (Object.keys(createdAt).length) {
    filter.createdAt = createdAt
  }

  if (typeof address === 'string' && address.trim()) {
    filter.address = { $regex: address.trim(), $options: 'i' }
  }

  const users = await User.find(filter).sort({
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
  const result = await approvePendingRegistrations({
    actor: req.user,
    userIds: [req.params.id],
  })
  const user = result.users[0]

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
  const result = await rejectPendingRegistrations({
    actor: req.user,
    reason: payload.reason,
    userIds: [req.params.id],
  })
  const user = result.users[0]

  res.status(200).json({
    success: true,
    message: 'Registration rejected successfully.',
    data: {
      user,
    },
  })
})

const bulkApproveRegistrations = asyncHandler(async (req, res) => {
  const result = await approvePendingRegistrations({
    actor: req.user,
    userIds: getBodyUserIds(req.body),
  })

  res.status(200).json({
    success: true,
    message: 'Pending registrations approved successfully.',
    data: {
      modifiedCount: result.modifiedCount,
      users: result.users,
    },
  })
})

const bulkRejectRegistrations = asyncHandler(async (req, res) => {
  const payload = validateRejectRegistration(req.body)
  const result = await rejectPendingRegistrations({
    actor: req.user,
    reason: payload.reason,
    userIds: getBodyUserIds(req.body),
  })

  res.status(200).json({
    success: true,
    message: 'Pending registrations rejected successfully.',
    data: {
      modifiedCount: result.modifiedCount,
      users: result.users,
    },
  })
})

module.exports = {
  approveRegistration,
  bulkApproveRegistrations,
  bulkRejectRegistrations,
  getPendingRegistrations,
  registerMember,
  rejectRegistration,
}
