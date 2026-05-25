const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const Payment = require('../models/Payment')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { getSettings } = require('../services/settingsService')
const {
  validateMonth,
  validateMonthlyPayment,
} = require('../validators/financeValidators')

const submitMonthlyPayment = asyncHandler(async (req, res) => {
  const payload = validateMonthlyPayment(req.body)
  const settings = await getSettings()

  const payment = await Payment.create({
    user: req.user._id,
    type: PAYMENT_TYPES.MONTHLY_FEE,
    month: payload.month,
    amount: settings.monthlyFee,
    method: payload.method,
    transactionId: payload.transactionId,
    senderPhone: payload.senderPhone,
    note: payload.note,
    proofImageUrl: payload.proofImageUrl,
  })

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
    .populate('user', 'name phone address role status')
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    message: 'Payments loaded successfully.',
    data: {
      payments,
    },
  })
})

const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)

  if (!payment) {
    throw new AppError('Payment not found.', 404)
  }

  payment.status = PAYMENT_STATUSES.VERIFIED
  payment.verifiedAt = new Date()
  payment.verifiedBy = req.user._id
  await payment.save()

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully.',
    data: {
      payment,
    },
  })
})

const rejectPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)

  if (!payment) {
    throw new AppError('Payment not found.', 404)
  }

  payment.status = PAYMENT_STATUSES.REJECTED
  payment.verifiedAt = null
  payment.verifiedBy = null
  await payment.save()

  res.status(200).json({
    success: true,
    message: 'Payment rejected successfully.',
    data: {
      payment,
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
      paidMembers,
      unpaidMembers,
      paidCount: paidMembers.length,
      unpaidCount: unpaidMembers.length,
    },
  })
})

module.exports = {
  getAllPayments,
  getMonthlyPaymentStatus,
  getMyPayments,
  rejectPayment,
  submitMonthlyPayment,
  verifyPayment,
}
