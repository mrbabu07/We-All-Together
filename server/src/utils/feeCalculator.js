const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../constants/paymentConstants')
const FeeAdjustment = require('../models/FeeAdjustment')
const FeeWaiver = require('../models/FeeWaiver')
const Payment = require('../models/Payment')

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
]

const monthKey = ({ month, year }) => `${year}-${String(month).padStart(2, '0')}`

const parseMonthKey = (value = '') => {
  const [year, month] = String(value).split('-').map(Number)
  return Number.isInteger(month) && Number.isInteger(year) ? { month, year } : null
}

const getCurrentMonth = (date = new Date()) => ({
  month: date.getMonth() + 1,
  year: date.getFullYear(),
})

const toTaka = (paisa = 0) => Math.round(Number(paisa || 0)) / 100

const toPaisaFromTaka = (amount = 0) => Math.round(Number(amount || 0) * 100)

const getFeeSettings = (settings = {}) => {
  const monthlyFeeAmount =
    Number(settings.monthlyFeeAmount || 0) > 0
      ? Number(settings.monthlyFeeAmount)
      : Number(settings.monthlyFee || 0) > 0
        ? toPaisaFromTaka(settings.monthlyFee)
        : 50000

  return {
    feeDueDay: Number(settings.feeDueDay || settings.financeControls?.monthlyFeeDueDate || 1),
    feeLateFeeAmount: Number(settings.feeLateFeeAmount || 0),
    feeOverdueAlertEnabled: settings.feeOverdueAlertEnabled !== false,
    monthlyFeeAmount,
  }
}

const listLiableMonths = (approvedAt, current = new Date()) => {
  if (!approvedAt) {
    return []
  }

  const start = new Date(approvedAt)

  if (Number.isNaN(start.getTime())) {
    return []
  }

  const months = []
  let year = start.getFullYear()
  let month = start.getMonth() + 1
  const endYear = current.getFullYear()
  const endMonth = current.getMonth() + 1

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ month, year })
    month += 1

    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months
}

const getPaymentCoveredMonths = (payment) => {
  if (Array.isArray(payment.coveredMonths) && payment.coveredMonths.length) {
    return payment.coveredMonths.map((row) => ({ month: Number(row.month), year: Number(row.year) }))
  }

  if (payment.forMonth && payment.forYear) {
    return [{ month: Number(payment.forMonth), year: Number(payment.forYear) }]
  }

  const parsed = parseMonthKey(payment.month)
  return parsed ? [parsed] : []
}

const getPaidMonthSet = (payments) => {
  const paid = new Set()

  payments.forEach((payment) => {
    getPaymentCoveredMonths(payment).forEach((coveredMonth) => {
      paid.add(monthKey(coveredMonth))
    })
  })

  return paid
}

const getWaiverMonthSet = (waivers) => {
  const waived = new Set()

  waivers.forEach((waiver) => {
    waived.add(monthKey({ month: waiver.month, year: waiver.year }))
  })

  return waived
}

const getAdjustmentMap = (adjustments) => {
  const adjustmentMap = new Map()

  adjustments.forEach((adjustment) => {
    adjustmentMap.set(monthKey({ month: adjustment.month, year: adjustment.year }), adjustment)
  })

  return adjustmentMap
}

const hasPaidMonth = (payments, target) =>
  getPaidMonthSet(payments).has(monthKey(target))

const isMonthLate = ({ feeDueDay, month, referenceDate = new Date(), year }) => {
  const dueDate = new Date(year, month - 1, feeDueDay, 23, 59, 59, 999)
  return referenceDate > dueDate
}

const calculateMemberFees = async ({ member, referenceDate = new Date(), settings }) => {
  const feeSettings = getFeeSettings(settings)
  const liableMonths = listLiableMonths(member.approvedAt, referenceDate)
  const [adjustments, payments, waivers] = await Promise.all([
    FeeAdjustment.find({ memberId: member._id }).sort({ year: -1, month: -1 }),
    Payment.find({
      type: PAYMENT_TYPES.MONTHLY_FEE,
      user: member._id,
    }).sort({ createdAt: -1 }),
    FeeWaiver.find({ memberId: member._id }).sort({ year: -1, month: -1 }),
  ])
  const approvedPayments = payments.filter((payment) => payment.status === PAYMENT_STATUSES.VERIFIED)

  const adjustmentMap = getAdjustmentMap(adjustments)
  const paidMonths = getPaidMonthSet(approvedPayments)
  const waivedMonths = getWaiverMonthSet(waivers)
  const overdueMonths = liableMonths
    .filter((item) => !paidMonths.has(monthKey(item)) && !waivedMonths.has(monthKey(item)))
    .map((item) => {
      const adjustment = adjustmentMap.get(monthKey(item))
      const amountPaisa = adjustment?.amountPaisa ?? feeSettings.monthlyFeeAmount

      return {
        ...item,
        adjustment,
        amount: toTaka(amountPaisa),
        amountPaisa,
        isWaived: false,
        label: `${BENGALI_MONTHS[item.month - 1]} ${item.year}`,
      }
    })

  const totalDuePaisa = overdueMonths.reduce((sum, item) => sum + Number(item.amountPaisa || 0), 0)
  const currentMonth = getCurrentMonth(referenceDate)
  const currentMonthPaid = paidMonths.has(monthKey(currentMonth))
  const currentMonthWaived = waivedMonths.has(monthKey(currentMonth))

  return {
    adjustments,
    currentMonth,
    currentMonthPaid,
    currentMonthWaived,
    feeSettings,
    isOverdue: overdueMonths.length > 0,
    overdueMonths,
    paidMonths,
    payments,
    totalDue: toTaka(totalDuePaisa),
    totalDuePaisa,
    waivedMonths,
    waivers,
  }
}

module.exports = {
  BENGALI_MONTHS,
  calculateMemberFees,
  getCurrentMonth,
  getFeeSettings,
  getPaymentCoveredMonths,
  hasPaidMonth,
  isMonthLate,
  listLiableMonths,
  monthKey,
  parseMonthKey,
  toPaisaFromTaka,
  toTaka,
}
