const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const FeeAdjustment = require('../models/FeeAdjustment')
const FeeWaiver = require('../models/FeeWaiver')
const Payment = require('../models/Payment')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { createNotification } = require('../services/notificationService')
const { getSettings } = require('../services/settingsService')
const { recordAuditLog } = require('../services/auditService')
const { ensurePaymentQrCode } = require('../services/paymentQrService')
const { sendTextMessage } = require('../services/smsService')
const { isBangladeshiPhone, normalizeBangladeshiPhone } = require('../utils/phoneUtils')
const {
  BENGALI_MONTHS,
  calculateMemberFees,
  getCurrentMonth,
  getPaymentCoveredMonths,
  isMonthLate,
  monthKey,
  parseMonthKey,
  toTaka,
} = require('../utils/feeCalculator')

const APPROVED_MEMBER_FILTER = {
  role: { $in: [USER_ROLES.MEMBER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN] },
  softDeletedAt: null,
  status: USER_STATUSES.APPROVED,
  suspendedAt: null,
}

const normalizeMonthPayload = (months) => {
  if (!Array.isArray(months) || months.length === 0) {
    throw new AppError('At least one fee month is required.', 400)
  }

  const seen = new Set()
  return months.map((item) => {
    const month = Number(item.month)
    const year = Number(item.year)

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError('Fee month must be between 1 and 12.', 400)
    }
    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
      throw new AppError('Fee year is invalid.', 400)
    }

    const key = monthKey({ month, year })
    if (seen.has(key)) {
      throw new AppError('Duplicate fee months are not allowed.', 400)
    }
    seen.add(key)

    return { month, year }
  })
}

const getMemberOrThrow = async (id) => {
  const member = await User.findById(id)

  if (!member || member.status !== USER_STATUSES.APPROVED) {
    throw new AppError('Approved member not found.', 404)
  }

  return member
}

const paymentCoversMonth = (payment, target) =>
  getPaymentCoveredMonths(payment).some(
    (item) => Number(item.month) === Number(target.month) && Number(item.year) === Number(target.year),
  )

const getMonthAmountPaisa = (feeStatus, month) => {
  const key = monthKey(month)
  const overdue = feeStatus.overdueMonths.find((item) => monthKey(item) === key)
  const adjustment = feeStatus.adjustments?.find((item) => monthKey(item) === key)

  return overdue?.amountPaisa || adjustment?.amountPaisa || feeStatus.feeSettings.monthlyFeeAmount
}

const validateFeePaymentDetails = (body) => {
  const method = String(body.method || '').trim()
  const proofImageUrl =
    typeof body.proofImageUrl === 'string' ? body.proofImageUrl.trim() : ''
  const senderPhone = normalizeBangladeshiPhone(String(body.senderPhone || ''))
  const transactionId = String(body.transactionId || '').trim()

  if (!method || !transactionId || !senderPhone || !proofImageUrl) {
    throw new AppError(
      'Payment method, transaction ID, sender phone, and proof image are required.',
      400,
    )
  }

  if (!isBangladeshiPhone(senderPhone)) {
    throw new AppError('Sender phone must use Bangladeshi format like 017XXXXXXXX.', 400)
  }

  return {
    method,
    proofImageUrl,
    senderPhone,
    transactionId,
  }
}

const findExistingPaymentsForMonths = async (memberId, months) => {
  const payments = await Payment.find({
    status: { $in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.VERIFIED] },
    type: PAYMENT_TYPES.MONTHLY_FEE,
    user: memberId,
  })

  return payments.filter((payment) => months.some((month) => paymentCoversMonth(payment, month)))
}

const getLastPaidMonthLabel = (payments) => {
  const verified = payments
    .filter((payment) => payment.status === PAYMENT_STATUSES.VERIFIED)
    .flatMap((payment) => getPaymentCoveredMonths(payment))
    .sort((left, right) => right.year - left.year || right.month - left.month)

  if (!verified.length) {
    return 'N/A'
  }

  const [latest] = verified
  return `${BENGALI_MONTHS[latest.month - 1]} ${latest.year}`
}

const buildHistoryGrid = ({ feeStatus, member, selectedYear }) => {
  const joinDate = member.approvedAt ? new Date(member.approvedAt) : null
  const current = getCurrentMonth()

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const key = monthKey({ month, year: selectedYear })
    const notYetMember =
      joinDate &&
      (selectedYear < joinDate.getFullYear() ||
        (selectedYear === joinDate.getFullYear() && month < joinDate.getMonth() + 1))
    const future =
      selectedYear > current.year || (selectedYear === current.year && month > current.month)
    const paymentsForMonth = feeStatus.payments.filter((row) =>
      paymentCoversMonth(row, { month, year: selectedYear }),
    )
    const verifiedPayment = paymentsForMonth.find(
      (row) => row.status === PAYMENT_STATUSES.VERIFIED,
    )
    const pendingPayment = paymentsForMonth.find((row) => row.status === PAYMENT_STATUSES.PENDING)
    const payment = verifiedPayment || pendingPayment || paymentsForMonth[0]
    const waiver = feeStatus.waivers.find(
      (row) => Number(row.month) === month && Number(row.year) === selectedYear,
    )
    const overdue = feeStatus.overdueMonths.find(
      (row) => Number(row.month) === month && Number(row.year) === selectedYear,
    )

    let status = 'future'
    if (notYetMember) status = 'not_applicable'
    else if (waiver) status = 'waived'
    else if (payment?.status === PAYMENT_STATUSES.VERIFIED) status = 'approved'
    else if (payment?.status === PAYMENT_STATUSES.PENDING) status = 'pending'
    else if (overdue) status = 'overdue'
    else if (!future) status = 'unpaid'

    return {
      adjustment: feeStatus.adjustments?.find(
        (row) => Number(row.month) === month && Number(row.year) === selectedYear,
      ),
      amount:
        overdue?.amount ||
        payment?.amount ||
        toTaka(getMonthAmountPaisa(feeStatus, { month, year: selectedYear })),
      amountPaisa:
        overdue?.amountPaisa ||
        payment?.amountPaisa ||
        getMonthAmountPaisa(feeStatus, { month, year: selectedYear }),
      label: BENGALI_MONTHS[index],
      month,
      paidAt: payment?.verifiedAt || payment?.createdAt || null,
      payment,
      status,
      waiver,
      year: selectedYear,
    }
  })
}

const buildMemberStatusPayload = ({ feeStatus, member }) => {
  const current = feeStatus.currentMonth
  const currentKey = monthKey(current)
  const payableMonths = [...feeStatus.overdueMonths]
  const alreadyIncluded = payableMonths.some((item) => monthKey(item) === currentKey)

  if (!feeStatus.currentMonthPaid && !feeStatus.currentMonthWaived && !alreadyIncluded) {
    payableMonths.push({
      ...current,
      amount: toTaka(getMonthAmountPaisa(feeStatus, current)),
      amountPaisa: getMonthAmountPaisa(feeStatus, current),
      isWaived: false,
      label: `${BENGALI_MONTHS[current.month - 1]} ${current.year}`,
    })
  }

  const lateFeePaisa = payableMonths.some((item) =>
    isMonthLate({
      feeDueDay: feeStatus.feeSettings.feeDueDay,
      month: item.month,
      year: item.year,
    }),
  )
    ? feeStatus.feeSettings.feeLateFeeAmount
    : 0
  const nextPaymentAmountPaisa =
    payableMonths.reduce((sum, item) => sum + Number(item.amountPaisa || 0), 0) + lateFeePaisa

  return {
    currentMonthPaid: feeStatus.currentMonthPaid,
    isOverdue: feeStatus.isOverdue,
    lateFee: toTaka(lateFeePaisa),
    lateFeePaisa,
    memberId: member._id,
    nextPaymentAmount: toTaka(nextPaymentAmountPaisa),
    nextPaymentAmountPaisa,
    overdueMonths: feeStatus.overdueMonths,
    payableMonths,
    paymentHistory: feeStatus.payments.map((payment) => ({
      amount: payment.amount,
      amountPaisa: payment.amountPaisa,
      coveredMonths: getPaymentCoveredMonths(payment),
      id: payment._id,
      lateFee: payment.lateFeeApplied,
      lateFeePaisa: payment.lateFeeAppliedPaisa,
      month: payment.forMonth || parseMonthKey(payment.month)?.month,
      paidAt: payment.verifiedAt || payment.createdAt,
      receiptNumber: payment.receiptNumber,
      status: payment.status,
      year: payment.forYear || parseMonthKey(payment.month)?.year,
    })),
    settings: {
      feeDueDay: feeStatus.feeSettings.feeDueDay,
      feeLateFeeAmount: toTaka(feeStatus.feeSettings.feeLateFeeAmount),
      feeLateFeeAmountPaisa: feeStatus.feeSettings.feeLateFeeAmount,
      monthlyFeeAmount: toTaka(feeStatus.feeSettings.monthlyFeeAmount),
      monthlyFeeAmountPaisa: feeStatus.feeSettings.monthlyFeeAmount,
    },
    totalDue: feeStatus.totalDue,
    totalDuePaisa: feeStatus.totalDuePaisa,
  }
}

const getMyFeeStatus = asyncHandler(async (req, res) => {
  const [settings, member] = await Promise.all([getSettings(), getMemberOrThrow(req.user._id)])
  const feeStatus = await calculateMemberFees({ member, settings })

  res.status(200).json({
    success: true,
    message: 'Fee status loaded successfully.',
    data: buildMemberStatusPayload({ feeStatus, member }),
  })
})

const getOverdueMembers = asyncHandler(async (req, res) => {
  const [settings, members] = await Promise.all([
    getSettings(),
    User.find(APPROVED_MEMBER_FILTER).sort({ name: 1 }),
  ])
  const rows = []

  for (const member of members) {
    const feeStatus = await calculateMemberFees({ member, settings })
    if (!feeStatus.isOverdue) {
      continue
    }

    rows.push({
      lastPaidMonth: getLastPaidMonthLabel(feeStatus.payments),
      memberId: member._id,
      memberSince: member.approvedAt,
      name: member.name,
      overdueMonths: feeStatus.overdueMonths,
      phone: member.phone,
      photo: member.profilePhotoUrl,
      totalDue: feeStatus.totalDue,
      totalDuePaisa: feeStatus.totalDuePaisa,
    })
  }

  const current = getCurrentMonth()
  let paidCurrentCount = 0
  for (const member of members) {
    const existing = await findExistingPaymentsForMonths(member._id, [current])
    if (existing.some((payment) => payment.status === PAYMENT_STATUSES.VERIFIED)) {
      paidCurrentCount += 1
    }
  }

  res.status(200).json({
    success: true,
    message: 'Overdue members loaded successfully.',
    data: {
      overdueMembers: rows,
      summary: {
        paidThisMonth: paidCurrentCount,
        totalAmountDue: toTaka(rows.reduce((sum, row) => sum + row.totalDuePaisa, 0)),
        totalAmountDuePaisa: rows.reduce((sum, row) => sum + row.totalDuePaisa, 0),
        totalMembers: members.length,
        totalOverdueMembers: rows.length,
      },
    },
  })
})

const payFees = asyncHandler(async (req, res) => {
  const months = normalizeMonthPayload(req.body.months)
  const paymentDetails = validateFeePaymentDetails(req.body)
  const [settings, member] = await Promise.all([getSettings(), getMemberOrThrow(req.user._id)])
  const feeStatus = await calculateMemberFees({ member, settings })
  const requestedKeys = new Set(months.map(monthKey))
  const missingOverdue = feeStatus.overdueMonths.filter((item) => !requestedKeys.has(monthKey(item)))

  if (missingOverdue.length) {
    throw new AppError('You must include all overdue months before paying the current month.', 400)
  }

  const existingPayments = await findExistingPaymentsForMonths(member._id, months)
  if (existingPayments.length) {
    throw new AppError('One or more selected months already have a pending or approved payment.', 409)
  }

  const lateFeePaisa = months.some((item) =>
    isMonthLate({
      feeDueDay: feeStatus.feeSettings.feeDueDay,
      month: item.month,
      year: item.year,
    }),
  )
    ? feeStatus.feeSettings.feeLateFeeAmount
    : 0
  const baseAmountPaisa = months.reduce(
    (sum, item) => sum + getMonthAmountPaisa(feeStatus, item),
    0,
  )
  const totalPaisa = baseAmountPaisa + lateFeePaisa
  const firstMonth = months[0]
  const paymentMonth = monthKey(firstMonth)
  const existingRejectedPayment = await Payment.findOne({
    month: paymentMonth,
    status: PAYMENT_STATUSES.REJECTED,
    type: PAYMENT_TYPES.MONTHLY_FEE,
    user: member._id,
  })
  const payment =
    existingRejectedPayment ||
    new Payment({
      month: paymentMonth,
      type: PAYMENT_TYPES.MONTHLY_FEE,
      user: member._id,
    })

  payment.amount = toTaka(totalPaisa)
  payment.amountPaisa = totalPaisa
  payment.coveredMonths = months
  payment.forMonth = firstMonth.month
  payment.forYear = firstMonth.year
  payment.isLate = lateFeePaisa > 0
  payment.lateFeeAmount = toTaka(lateFeePaisa)
  payment.lateFeeApplied = toTaka(lateFeePaisa)
  payment.lateFeeAppliedPaisa = lateFeePaisa
  payment.method = paymentDetails.method
  payment.note = typeof req.body.note === 'string' ? req.body.note.trim() : ''
  payment.proofImageUrl = paymentDetails.proofImageUrl
  payment.senderPhone = paymentDetails.senderPhone
  payment.status = PAYMENT_STATUSES.PENDING
  payment.transactionId = paymentDetails.transactionId
  payment.verifiedAt = null
  payment.verifiedBy = null
  payment.rejectedAt = null
  payment.rejectedBy = null
  payment.rejectionReason = ''

  payment.receiptNumber = payment.receiptNumber || `PAY-${payment._id}`
  payment.receiptGeneratedAt = new Date()
  await payment.save()
  await ensurePaymentQrCode(payment)

  await recordAuditLog({
    action: 'fee.payment.submit',
    actor: req.user,
    entityId: payment._id,
    entityType: 'Payment',
    metadata: { coveredMonths: months, totalPaisa },
  })

  res.status(201).json({
    success: true,
    message: 'Fee payment submitted for verification.',
    data: { payment },
  })
})

const waiveFee = asyncHandler(async (req, res) => {
  const member = await getMemberOrThrow(req.body.memberId)
  const month = Number(req.body.month)
  const year = Number(req.body.year)
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || !reason) {
    throw new AppError('Member, month, year, and reason are required for fee waiver.', 400)
  }

  const waiver = await FeeWaiver.findOneAndUpdate(
    { memberId: member._id, month, year },
    {
      $set: {
        reason,
        waivedBy: req.user._id,
        waivedAt: new Date(),
      },
    },
    { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true },
  )

  await createNotification({
    createdBy: req.user,
    link: '/member/fee-history',
    message: `${BENGALI_MONTHS[month - 1]} ${year} মাসের ফি মওকুফ করা হয়েছে।`,
    title: 'ফি মওকুফ',
    type: 'fee_waived',
    user: member,
  })
  await recordAuditLog({
    action: 'fee.waive',
    actor: req.user,
    entityId: waiver._id,
    entityType: 'FeeWaiver',
    metadata: { memberId: member._id, month, reason, year },
  })

  res.status(201).json({
    success: true,
    message: 'Fee waiver saved successfully.',
    data: { waiver },
  })
})

const removeWaiver = asyncHandler(async (req, res) => {
  const waiver = await FeeWaiver.findById(req.params.waiverId)

  if (!waiver) {
    throw new AppError('Fee waiver not found.', 404)
  }

  await waiver.deleteOne()
  await recordAuditLog({
    action: 'fee.waiver.remove',
    actor: req.user,
    entityId: req.params.waiverId,
    entityType: 'FeeWaiver',
    metadata: { memberId: waiver.memberId, month: waiver.month, year: waiver.year },
  })

  res.status(200).json({
    success: true,
    message: 'Fee waiver removed successfully.',
    data: { id: req.params.waiverId },
  })
})

const adjustFeeAmount = asyncHandler(async (req, res) => {
  const member = await getMemberOrThrow(req.body.memberId)
  const month = Number(req.body.month)
  const year = Number(req.body.year)
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
  const amountPaisa =
    req.body.amountPaisa !== undefined
      ? Number(req.body.amountPaisa)
      : Math.round(Number(req.body.amount || 0) * 100)

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    !Number.isFinite(amountPaisa) ||
    amountPaisa < 0 ||
    !reason
  ) {
    throw new AppError('Member, month, year, amount, and reason are required for fee adjustment.', 400)
  }

  const adjustment = await FeeAdjustment.findOneAndUpdate(
    { memberId: member._id, month, year },
    {
      $set: {
        adjustedAt: new Date(),
        adjustedBy: req.user._id,
        amountPaisa,
        reason,
      },
    },
    { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true },
  )

  await recordAuditLog({
    action: 'fee.adjust',
    actor: req.user,
    entityId: adjustment._id,
    entityType: 'FeeAdjustment',
    metadata: { amountPaisa, memberId: member._id, month, reason, year },
  })

  res.status(201).json({
    success: true,
    message: 'Fee amount adjusted successfully.',
    data: { adjustment },
  })
})

const removeFeeAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await FeeAdjustment.findById(req.params.adjustmentId)

  if (!adjustment) {
    throw new AppError('Fee adjustment not found.', 404)
  }

  await adjustment.deleteOne()
  await recordAuditLog({
    action: 'fee.adjust.remove',
    actor: req.user,
    entityId: req.params.adjustmentId,
    entityType: 'FeeAdjustment',
    metadata: { memberId: adjustment.memberId, month: adjustment.month, year: adjustment.year },
  })

  res.status(200).json({
    success: true,
    message: 'Fee adjustment removed successfully.',
    data: { id: req.params.adjustmentId },
  })
})

const getMemberHistory = asyncHandler(async (req, res) => {
  const [settings, member] = await Promise.all([
    getSettings(),
    getMemberOrThrow(req.params.memberId),
  ])
  const selectedYear = Number(req.query.year || new Date().getFullYear())
  const feeStatus = await calculateMemberFees({ member, settings })
  const grid = buildHistoryGrid({ feeStatus, member, selectedYear })
  const joinYear = member.approvedAt ? new Date(member.approvedAt).getFullYear() : selectedYear
  const years = []
  for (let year = new Date().getFullYear(); year >= joinYear; year -= 1) {
    years.push(year)
  }

  res.status(200).json({
    success: true,
    message: 'Member fee history loaded successfully.',
    data: {
      grid,
      member,
      payments: feeStatus.payments,
      selectedYear,
      status: buildMemberStatusPayload({ feeStatus, member }),
      waivers: feeStatus.waivers,
      years,
    },
  })
})

const sendMemberFeeReminder = asyncHandler(async (req, res) => {
  const [settings, member] = await Promise.all([
    getSettings(),
    getMemberOrThrow(req.params.memberId),
  ])
  const feeStatus = await calculateMemberFees({ member, settings })
  const amount = feeStatus.isOverdue
    ? feeStatus.totalDue
    : toTaka(feeStatus.feeSettings.monthlyFeeAmount)
  const title = 'Fee payment reminder'
  const message = feeStatus.isOverdue
    ? `আপনার ${feeStatus.overdueMonths.length} মাসের ফি বকেয়া রয়েছে। মোট বকেয়া: ৳${amount}।`
    : `এই মাসের ফি পরিশোধের অনুরোধ করা হলো। পরিমাণ: ৳${amount}।`

  await createNotification({
    createdBy: req.user,
    link: '/member/fee-history',
    message,
    title,
    type: 'fee_reminder',
    user: member,
  })

  let smsResult = { skipped: true, reason: 'SMS fee reminder is disabled.' }
  if (settings.notificationSettings?.smsFeeReminderEnabled) {
    smsResult = await sendTextMessage({
      body: `${title}: ${message}`,
      channel: 'sms',
      phone: member.phone,
    })
  }

  await recordAuditLog({
    action: 'fee.reminder.send',
    actor: req.user,
    entityId: member._id,
    entityType: 'User',
    metadata: {
      isOverdue: feeStatus.isOverdue,
      overdueMonths: feeStatus.overdueMonths.length,
      smsSkipped: Boolean(smsResult.skipped),
      totalDuePaisa: feeStatus.totalDuePaisa,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Fee reminder sent successfully.',
    data: {
      notificationSent: true,
      smsResult,
    },
  })
})

const getMyFeeHistory = asyncHandler(async (req, res) => {
  const [settings, member] = await Promise.all([
    getSettings(),
    getMemberOrThrow(req.user._id),
  ])
  const selectedYear = Number(req.query.year || new Date().getFullYear())
  const feeStatus = await calculateMemberFees({ member, settings })
  const grid = buildHistoryGrid({ feeStatus, member, selectedYear })
  const joinYear = member.approvedAt ? new Date(member.approvedAt).getFullYear() : selectedYear
  const years = []
  for (let year = new Date().getFullYear(); year >= joinYear; year -= 1) {
    years.push(year)
  }

  res.status(200).json({
    success: true,
    message: 'Fee history loaded successfully.',
    data: {
      grid,
      member,
      payments: feeStatus.payments,
      selectedYear,
      status: buildMemberStatusPayload({ feeStatus, member }),
      waivers: feeStatus.waivers,
      years,
    },
  })
})

module.exports = {
  adjustFeeAmount,
  getMemberHistory,
  getMyFeeHistory,
  getMyFeeStatus,
  getOverdueMembers,
  payFees,
  removeWaiver,
  removeFeeAdjustment,
  sendMemberFeeReminder,
  validateFeePaymentDetails,
  waiveFee,
}
