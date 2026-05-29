const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const Payment = require('../models/Payment')
const AppError = require('../utils/appError')
const { BENGALI_MONTHS, getPaymentCoveredMonths } = require('../utils/feeCalculator')
const { recordAuditLog } = require('./auditService')
const { createNotification } = require('./notificationService')
const { generatePaymentReceiptFile } = require('./paymentReceiptFileService')
const { getSettings } = require('./settingsService')

const getOrganizationName = (settings) =>
  settings?.siteSettings?.orgName || 'Dargah Para OIkko Porishod'

const formatPaymentMonths = (payment) => {
  const months = getPaymentCoveredMonths(payment)

  if (!months.length) {
    return payment.month || 'selected month'
  }

  return months
    .map((item) => `${BENGALI_MONTHS[item.month - 1] || item.month} ${item.year}`)
    .join(', ')
}

const getPendingPaymentsOrThrow = async (paymentIds, actionLabel) => {
  const payments = await Payment.find({ _id: { $in: paymentIds } }).sort({ createdAt: -1 })

  if (payments.length !== paymentIds.length) {
    throw new AppError('One or more selected payments were not found.', 404)
  }

  const nonPending = payments.filter((payment) => payment.status !== PAYMENT_STATUSES.PENDING)
  if (nonPending.length) {
    throw new AppError(`Only pending payments can be ${actionLabel}.`, 400)
  }

  return payments
}

const approvePaymentDocument = async ({ actor, payment, settings }) => {
  if (!payment) {
    throw new AppError('Payment not found.', 404)
  }
  if (payment.status !== PAYMENT_STATUSES.PENDING) {
    throw new AppError('Only pending payments can be approved.', 400)
  }

  payment.status = PAYMENT_STATUSES.VERIFIED
  payment.verifiedAt = new Date()
  payment.verifiedBy = actor._id
  payment.rejectedAt = null
  payment.rejectedBy = null
  payment.rejectionReason = ''
  payment.receiptNumber =
    payment.receiptNumber && payment.receiptNumber.startsWith('DP-')
      ? payment.receiptNumber
      : `DP-${new Date().getFullYear()}-${String(payment._id).slice(-6).toUpperCase()}`
  payment.receiptGeneratedAt = new Date()
  payment.receiptPdfPath = `/api/v1/receipts/${payment._id}`
  await payment.save()
  await generatePaymentReceiptFile({
    organizationName: getOrganizationName(settings),
    payment,
    settings,
  })
  if (settings.notificationSettings?.paymentDecisionEnabled !== false) {
    await createNotification({
      createdBy: actor,
      link: '/member/fee-history',
      message: `${formatPaymentMonths(payment)} fee payment of Tk ${Number(
        payment.amount || 0,
      ).toLocaleString('en-US')} has been approved. You can download the receipt from fee history.`,
      title: 'Fee payment approved',
      type: 'fee_approved',
      user: payment.user,
    })
  }
  await recordAuditLog({
    action: 'payment.approve',
    actor,
    entityId: payment._id,
    entityType: 'Payment',
    metadata: {
      amount: payment.amount,
      coveredMonths: payment.coveredMonths,
      month: payment.month,
      user: payment.user,
    },
  })

  return payment
}

const rejectPaymentDocument = async ({ actor, payment, reason, settings = null }) => {
  if (!payment) {
    throw new AppError('Payment not found.', 404)
  }
  if (payment.status !== PAYMENT_STATUSES.PENDING) {
    throw new AppError('Only pending payments can be rejected.', 400)
  }

  payment.status = PAYMENT_STATUSES.REJECTED
  payment.verifiedAt = null
  payment.verifiedBy = null
  payment.rejectedAt = new Date()
  payment.rejectedBy = actor._id
  payment.rejectionReason = reason
  await payment.save()
  const activeSettings = settings || (await getSettings())
  if (activeSettings.notificationSettings?.paymentDecisionEnabled !== false) {
    await createNotification({
      createdBy: actor,
      link: '/member?tab=payments',
      message: `${formatPaymentMonths(payment)} fee payment was rejected. Reason: ${reason}`,
      title: 'Fee payment rejected',
      type: 'fee_rejected',
      user: payment.user,
    })
  }
  await recordAuditLog({
    action: 'payment.reject',
    actor,
    entityId: payment._id,
    entityType: 'Payment',
    metadata: {
      amount: payment.amount,
      coveredMonths: payment.coveredMonths,
      month: payment.month,
      reason,
      user: payment.user,
    },
  })

  return payment
}

const approvePaymentById = async ({ actor, paymentId }) => {
  const [payment, settings] = await Promise.all([Payment.findById(paymentId), getSettings()])

  return approvePaymentDocument({ actor, payment, settings })
}

const rejectPaymentById = async ({ actor, paymentId, reason }) => {
  const [payment, settings] = await Promise.all([Payment.findById(paymentId), getSettings()])

  return rejectPaymentDocument({ actor, payment, reason, settings })
}

const bulkApprovePayments = async ({ actor, paymentIds }) => {
  const [payments, settings] = await Promise.all([
    getPendingPaymentsOrThrow(paymentIds, 'approved'),
    getSettings(),
  ])
  const approved = []

  for (const payment of payments) {
    approved.push(await approvePaymentDocument({ actor, payment, settings }))
  }

  return approved
}

const bulkRejectPayments = async ({ actor, paymentIds, reason }) => {
  const [payments, settings] = await Promise.all([
    getPendingPaymentsOrThrow(paymentIds, 'rejected'),
    getSettings(),
  ])
  const rejected = []

  for (const payment of payments) {
    rejected.push(await rejectPaymentDocument({ actor, payment, reason, settings }))
  }

  return rejected
}

module.exports = {
  approvePaymentById,
  approvePaymentDocument,
  bulkApprovePayments,
  bulkRejectPayments,
  rejectPaymentById,
  rejectPaymentDocument,
}
