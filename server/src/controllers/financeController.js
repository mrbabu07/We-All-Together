const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const Donation = require('../models/Donation')
const Expense = require('../models/Expense')
const Payment = require('../models/Payment')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const { getSettings } = require('../services/settingsService')
const {
  getRecentMonthKeys,
  monthKeyFromDate,
  monthStartFromKey,
} = require('../utils/monthUtils')

const createEmptyMonthRow = (month) => ({
  balance: 0,
  donationIncome: 0,
  expense: 0,
  income: 0,
  month,
  paymentIncome: 0,
})

const getFinanceAnalytics = asyncHandler(async (req, res) => {
  const months = getRecentMonthKeys(6)
  const monthSet = new Set(months)
  const firstMonthStart = monthStartFromKey(months[0])
  const currentMonth = months[months.length - 1]

  const [
    donations,
    expenses,
    members,
    payments,
    pendingApprovalCount,
    settings,
    verifiedCurrentPayments,
  ] = await Promise.all([
    Donation.find({
      status: PAYMENT_STATUSES.VERIFIED,
      $or: [{ verifiedAt: { $gte: firstMonthStart } }, { createdAt: { $gte: firstMonthStart } }],
    }).select('amount verifiedAt createdAt status'),
    Expense.find({ date: { $gte: firstMonthStart } }).select('amount category date'),
    User.find({ role: USER_ROLES.MEMBER, status: USER_STATUSES.APPROVED }).select(
      'name phone address profilePhotoUrl',
    ),
    Payment.find({
      month: { $in: months },
      status: PAYMENT_STATUSES.VERIFIED,
      type: PAYMENT_TYPES.MONTHLY_FEE,
    }).select('amount month user status'),
    User.countDocuments({ status: USER_STATUSES.PENDING }),
    getSettings(),
    Payment.find({
      month: currentMonth,
      status: PAYMENT_STATUSES.VERIFIED,
      type: PAYMENT_TYPES.MONTHLY_FEE,
    }).select('user'),
  ])

  const monthMap = new Map(months.map((month) => [month, createEmptyMonthRow(month)]))

  payments.forEach((payment) => {
    const row = monthMap.get(payment.month)

    if (!row) {
      return
    }

    row.paymentIncome += Number(payment.amount || 0)
    row.income += Number(payment.amount || 0)
  })

  donations.forEach((donation) => {
    const month = monthKeyFromDate(donation.verifiedAt || donation.createdAt)
    const row = monthMap.get(month)

    if (!row || !monthSet.has(month)) {
      return
    }

    row.donationIncome += Number(donation.amount || 0)
    row.income += Number(donation.amount || 0)
  })

  expenses.forEach((expense) => {
    const month = monthKeyFromDate(expense.date)
    const row = monthMap.get(month)

    if (!row || !monthSet.has(month)) {
      return
    }

    row.expense += Number(expense.amount || 0)
  })

  const monthly = [...monthMap.values()].map((row) => ({
    ...row,
    balance: row.income - row.expense,
  }))
  const paidCurrentMemberIds = new Set(
    verifiedCurrentPayments.map((payment) => payment.user.toString()),
  )
  const overdueMembers = members.filter(
    (member) => !paidCurrentMemberIds.has(member._id.toString()),
  )
  const thisMonth = monthly[monthly.length - 1] || createEmptyMonthRow(currentMonth)

  res.status(200).json({
    success: true,
    message: 'Finance analytics loaded successfully.',
    data: {
      currentMonth,
      donationTrend: monthly.map((row) => ({
        donations: row.donationIncome,
        month: row.month,
      })),
      monthly,
      overdue: {
        amount: overdueMembers.length * Number(settings.monthlyFee || 0),
        count: overdueMembers.length,
        members: overdueMembers,
      },
      summary: {
        overdueFees: overdueMembers.length * Number(settings.monthlyFee || 0),
        pendingApprovals: pendingApprovalCount,
        thisMonthExpense: thisMonth.expense,
        thisMonthIncome: thisMonth.income,
        totalMembers: members.length,
      },
    },
  })
})

module.exports = {
  getFinanceAnalytics,
}
