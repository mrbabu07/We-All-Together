const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const Payment = require('../models/Payment')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { getSettings } = require('../services/settingsService')
const { ensurePaymentQrCode } = require('../services/paymentQrService')
const {
  approvePaymentById,
  bulkApprovePayments,
  bulkRejectPayments,
  rejectPaymentById,
} = require('../services/paymentModerationService')
const {
  validateBulkPaymentAction,
  validateMonth,
  validateMonthlyPayment,
  validatePaymentRejection,
} = require('../validators/financeValidators')

const resetModerationFields = (payment) => {
  payment.status = PAYMENT_STATUSES.PENDING
  payment.verifiedAt = null
  payment.verifiedBy = null
  payment.rejectedAt = null
  payment.rejectedBy = null
  payment.rejectionReason = ''
}

const submitMonthlyPayment = asyncHandler(async (req, res) => {
  const payload = validateMonthlyPayment(req.body)
  const settings = await getSettings()
  const existingRejectedPayment = await Payment.findOne({
    month: payload.month,
    status: PAYMENT_STATUSES.REJECTED,
    type: PAYMENT_TYPES.MONTHLY_FEE,
    user: req.user._id,
  })
  const payment =
    existingRejectedPayment ||
    new Payment({
      month: payload.month,
      type: PAYMENT_TYPES.MONTHLY_FEE,
      user: req.user._id,
    })

  payment.amount = settings.monthlyFee
  payment.amountPaisa = Math.round(Number(settings.monthlyFee || 0) * 100)
  payment.method = payload.method
  payment.transactionId = payload.transactionId
  payment.senderPhone = payload.senderPhone
  payment.note = payload.note
  payment.proofImageUrl = payload.proofImageUrl
  resetModerationFields(payment)
  payment.receiptNumber = payment.receiptNumber || `PAY-${payment._id}`
  payment.receiptGeneratedAt = new Date()
  await payment.save()
  await ensurePaymentQrCode(payment)

  res.status(201).json({
    success: true,
    message: 'Monthly payment submitted for verification.',
    data: {
      payment,
    },
  })
})

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 })
  await Promise.all(payments.map((payment) => ensurePaymentQrCode(payment)))

  res.status(200).json({
    success: true,
    message: 'Payment history loaded successfully.',
    data: {
      payments,
    },
  })
})

const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('user', 'name phone address role status profilePhotoUrl')
    .populate('verifiedBy', 'name phone role')
    .populate('rejectedBy', 'name phone role')
    .sort({ createdAt: -1 })
  await Promise.all(payments.map((payment) => ensurePaymentQrCode(payment)))

  res.status(200).json({
    success: true,
    message: 'Payments loaded successfully.',
    data: {
      payments,
    },
  })
})

const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('user', 'name phone address role status profilePhotoUrl')
    .populate('verifiedBy', 'name phone role')
    .populate('rejectedBy', 'name phone role')

  if (!payment) {
    throw new AppError('Payment not found.', 404)
  }

  await ensurePaymentQrCode(payment)

  res.status(200).json({
    success: true,
    message: 'Payment loaded successfully.',
    data: {
      payment,
    },
  })
})

const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await approvePaymentById({ actor: req.user, paymentId: req.params.id })

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully.',
    data: {
      payment,
    },
  })
})

const rejectPayment = asyncHandler(async (req, res) => {
  const { reason } = validatePaymentRejection(req.body)
  const payment = await rejectPaymentById({ actor: req.user, paymentId: req.params.id, reason })

  res.status(200).json({
    success: true,
    message: 'Payment rejected successfully.',
    data: {
      payment,
    },
  })
})

const bulkVerifyPayments = asyncHandler(async (req, res) => {
  const { paymentIds } = validateBulkPaymentAction(req.body)
  const payments = await bulkApprovePayments({ actor: req.user, paymentIds })

  res.status(200).json({
    success: true,
    message: 'Payments verified successfully.',
    data: {
      count: payments.length,
      payments,
    },
  })
})

const bulkRejectSelectedPayments = asyncHandler(async (req, res) => {
  const { paymentIds, reason } = validateBulkPaymentAction(req.body, { requireReason: true })
  const payments = await bulkRejectPayments({ actor: req.user, paymentIds, reason })

  res.status(200).json({
    success: true,
    message: 'Payments rejected successfully.',
    data: {
      count: payments.length,
      payments,
    },
  })
})

const getMonthlyPaymentStatus = asyncHandler(async (req, res) => {
  const month = validateMonth(req.query.month)
  const [members, verifiedPayments] = await Promise.all([
    User.find({ role: USER_ROLES.MEMBER, status: USER_STATUSES.APPROVED }).select(
      'name phone address role',
    ),
    Payment.find({
      month,
      type: PAYMENT_TYPES.MONTHLY_FEE,
      status: PAYMENT_STATUSES.VERIFIED,
    }).select('user amount month status'),
  ])

  const paidUserIds = new Set(verifiedPayments.map((payment) => payment.user.toString()))
  const paidMembers = members.filter((member) => paidUserIds.has(member._id.toString()))
  const unpaidMembers = members.filter((member) => !paidUserIds.has(member._id.toString()))

  res.status(200).json({
    success: true,
    message: 'Monthly payment status loaded successfully.',
    data: {
      month,
      paidCount: paidMembers.length,
      paidMembers,
      unpaidCount: unpaidMembers.length,
      unpaidMembers,
    },
  })
})

module.exports = {
  bulkRejectSelectedPayments,
  bulkVerifyPayments,
  getAllPayments,
  getMonthlyPaymentStatus,
  getMyPayments,
  getPaymentById,
  rejectPayment,
  submitMonthlyPayment,
  verifyPayment,
}
