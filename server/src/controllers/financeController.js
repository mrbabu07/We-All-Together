const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const Donation = require('../models/Donation')
const Expense = require('../models/Expense')
const Payment = require('../models/Payment')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const { getSettings } = require('../services/settingsService')
const { monthKeyFromDate } = require('../utils/monthUtils')
const { resolveFinanceDateRange } = require('../utils/financeRange')

const createEmptyMonthRow = (month) => ({
  balance: 0,
  donationIncome: 0,
  expense: 0,
  income: 0,
  month,
  paymentIncome: 0,
})

const getFinanceAnalytics = asyncHandler(async (req, res) => {
  const range = resolveFinanceDateRange(req.query)
  const { currentMonth, endDate, months, startDate } = range
  const monthSet = new Set(months)

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
      $or: [
        { verifiedAt: { $gte: startDate, $lte: endDate } },
        { verifiedAt: null, createdAt: { $gte: startDate, $lte: endDate } },
      ],
    }).select('amount verifiedAt createdAt status'),
    Expense.find({ date: { $gte: startDate, $lte: endDate } }).select('amount category date'),
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

  const expenseBreakdown = Object.entries(
    expenses.reduce((totals, expense) => {
      const category = expense.category || 'Other'
      totals[category] = (totals[category] || 0) + Number(expense.amount || 0)
      return totals
    }, {}),
  )
    .map(([category, amount]) => ({ amount, category }))
    .sort((left, right) => right.amount - left.amount)
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
  const totalPayments = monthly.reduce((sum, row) => sum + row.paymentIncome, 0)
  const totalDonations = monthly.reduce((sum, row) => sum + row.donationIncome, 0)
  const totalExpense = monthly.reduce((sum, row) => sum + row.expense, 0)
  const totalIncome = totalPayments + totalDonations
  const monthlyFee = Number(settings.monthlyFee || settings.monthlyFeeAmount / 100 || 0)
  const collectionRate = members.length
    ? Math.round((verifiedCurrentPayments.length / members.length) * 100)
    : 0

  res.status(200).json({
    success: true,
    message: 'Finance analytics loaded successfully.',
    data: {
      currentMonth,
      donationTrend: monthly.map((row) => ({
        donations: row.donationIncome,
        month: row.month,
      })),
      expenseBreakdown,
      monthly,
      overdue: {
        amount: overdueMembers.length * monthlyFee,
        count: overdueMembers.length,
        members: overdueMembers,
      },
      range,
      summary: {
        collectionRate,
        netBalance: totalIncome - totalExpense,
        overdueFees: overdueMembers.length * monthlyFee,
        paidThisMonth: verifiedCurrentPayments.length,
        pendingApprovals: pendingApprovalCount,
        thisMonthExpense: thisMonth.expense,
        thisMonthIncome: thisMonth.income,
        totalDonations,
        totalExpense,
        totalIncome,
        totalMembers: members.length,
        totalPayments,
      },
    },
  })
})

module.exports = {
  getFinanceAnalytics,
}
