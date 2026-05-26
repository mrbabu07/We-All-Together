const PDFDocument = require('pdfkit')
const AuditLog = require('../models/AuditLog')
const Blog = require('../models/Blog')
const Donation = require('../models/Donation')
const Expense = require('../models/Expense')
const Meeting = require('../models/Meeting')
const Notice = require('../models/Notice')
const Payment = require('../models/Payment')
const Tour = require('../models/Tour')
const User = require('../models/User')
const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { createNotification } = require('../services/notificationService')
const { getSettings } = require('../services/settingsService')
const { getOnlineSnapshot } = require('../services/presenceService')
const { isBangladeshiPhone, normalizeBangladeshiPhone } = require('../utils/phoneUtils')

const monthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const previousMonthKey = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return monthKey(date)
}

const safeAssign = (target, source = {}, allowedFields = []) => {
  allowedFields.forEach((field) => {
    if (source[field] !== undefined) {
      target[field] = source[field]
    }
  })
}

const getControls = asyncHandler(async (req, res) => {
  const settings = await getSettings()
  const [users, recentActivity] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(100),
    AuditLog.find().populate('actor', 'name phone role').sort({ createdAt: -1 }).limit(30),
  ])

  res.status(200).json({
    success: true,
    message: 'Admin controls loaded successfully.',
    data: {
      presence: getOnlineSnapshot(),
      recentActivity,
      settings,
      users,
    },
  })
})

const updateControls = asyncHandler(async (req, res) => {
  const settings = await getSettings()
  settings.homepageControls = settings.homepageControls || {}

  safeAssign(settings.siteSettings, req.body.siteSettings, [
    'orgName',
    'logoUrl',
    'tagline',
    'address',
    'contactNumber',
    'email',
    'welcomeMessage',
    'facebookUrl',
    'youtubeUrl',
    'whatsappGroupUrl',
    'registrationEnabled',
    'publicDonationsEnabled',
    'maintenanceMode',
  ])
  safeAssign(settings.financeControls, req.body.financeControls, [
    'monthlyFeeDueDate',
    'lateFeeAmount',
    'lateFeeEnabled',
    'fiscalYearStartMonth',
  ])
  safeAssign(settings.notificationSettings, req.body.notificationSettings, [
    'smsGloballyEnabled',
    'smsNoticeEnabled',
    'smsMeetingEnabled',
    'smsFeeReminderEnabled',
    'whatsappNoticeEnabled',
    'whatsappMeetingEnabled',
    'whatsappFeeReminderEnabled',
  ])
  safeAssign(settings.appearance, req.body.appearance, [
    'primaryColor',
    'colorMode',
    'fontSize',
    'heroImageUrl',
    'customCss',
  ])
  safeAssign(settings.homepageControls, req.body.homepageControls, [
    'achievementsEnabled',
    'certificateEnabled',
    'certificateImageUrl',
    'committeeEnabled',
    'cookieConsentEnabled',
    'countdownEnabled',
    'darkModeToggleEnabled',
    'facebookEmbedEnabled',
    'facebookPageUrl',
    'fontSizeControlsEnabled',
    'galleryDownloadEnabled',
    'googleMapsEmbedUrl',
    'googleMapsEnabled',
    'newsTickerEnabled',
    'partnersEnabled',
    'testimonialsEnabled',
    'trustBadgesEnabled',
    'whatsappButtonEnabled',
    'whatsappNumber',
    'youtubeDescription',
    'youtubeEnabled',
    'youtubeTitle',
    'youtubeUrl',
  ])
  if (Array.isArray(req.body.homepageControls?.typewriterPhrases)) {
    settings.homepageControls.typewriterPhrases = req.body.homepageControls.typewriterPhrases
      .slice(0, 5)
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }
  if (Array.isArray(req.body.homepageControls?.trustBadgeLabels)) {
    settings.homepageControls.trustBadgeLabels = req.body.homepageControls.trustBadgeLabels
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }
  safeAssign(settings.securityControls, req.body.securityControls, [
    'autoBackupSchedule',
    'twoFactorRequiredForAdmins',
    'adminIpWhitelist',
  ])

  if (Array.isArray(req.body.contentControls?.noticeCategories)) {
    settings.contentControls.noticeCategories = req.body.contentControls.noticeCategories
  }
  if (Array.isArray(req.body.contentControls?.meetingTemplates)) {
    settings.contentControls.meetingTemplates = req.body.contentControls.meetingTemplates
  }
  if (req.body.registrationFee !== undefined) {
    settings.registrationFee = Number(req.body.registrationFee)
  }
  if (req.body.monthlyFee !== undefined) {
    settings.monthlyFee = Number(req.body.monthlyFee)
    settings.monthlyFeeAmount = Math.round(Number(req.body.monthlyFee || 0) * 100)
  }
  safeAssign(settings, req.body, [
    'monthlyFeeAmount',
    'feeLateFeeAmount',
    'feeDueDay',
    'feeOverdueAlertEnabled',
  ])
  if (req.body.monthlyFeeAmount !== undefined) {
    settings.monthlyFee = Number(req.body.monthlyFeeAmount || 0) / 100
  }

  await settings.save()
  await recordAuditLog({
    action: 'admin.controls.update',
    actor: req.user,
    entityId: settings._id,
    entityType: 'OrganizationSetting',
    metadata: { sections: Object.keys(req.body) },
  })

  res.status(200).json({
    success: true,
    message: 'Admin controls saved successfully.',
    data: { settings },
  })
})

const bulkApprovePending = asyncHandler(async (req, res) => {
  const result = await User.updateMany(
    { status: USER_STATUSES.PENDING },
    {
      $set: {
        approvedAt: new Date(),
        approvedBy: req.user._id,
        status: USER_STATUSES.APPROVED,
        'registrationPayment.status': PAYMENT_STATUSES.VERIFIED,
        'registrationPayment.verifiedAt': new Date(),
        'registrationPayment.verifiedBy': req.user._id,
      },
    },
  )

  await recordAuditLog({
    action: 'member.bulk.approve',
    actor: req.user,
    entityType: 'User',
    metadata: { modifiedCount: result.modifiedCount },
  })

  res.status(200).json({
    success: true,
    message: 'Pending members approved successfully.',
    data: { modifiedCount: result.modifiedCount },
  })
})

const bulkRejectPending = asyncHandler(async (req, res) => {
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
  const users = await User.find({ status: USER_STATUSES.PENDING })

  await User.updateMany(
    { status: USER_STATUSES.PENDING },
    {
      $set: {
        rejectedAt: new Date(),
        rejectedBy: req.user._id,
        status: USER_STATUSES.REJECTED,
        'registrationPayment.note': reason,
        'registrationPayment.status': PAYMENT_STATUSES.REJECTED,
      },
    },
  )
  await Promise.all(
    users.map((user) =>
      createNotification({
        createdBy: req.user,
        link: '/',
        message: reason || 'Your registration was rejected by admin.',
        title: 'Registration rejected',
        type: 'registration',
        user,
      }),
    ),
  )
  await recordAuditLog({
    action: 'member.bulk.reject',
    actor: req.user,
    entityType: 'User',
    metadata: { count: users.length, reason },
  })

  res.status(200).json({
    success: true,
    message: 'Pending members rejected successfully.',
    data: { modifiedCount: users.length },
  })
})

const setMemberSuspension = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('Member not found.', 404)
  }

  const suspended = req.body.suspended === true
  user.suspendedAt = suspended ? new Date() : null
  user.suspendedBy = suspended ? req.user._id : null
  user.suspensionReason = suspended && typeof req.body.reason === 'string' ? req.body.reason : ''
  await user.save()
  await recordAuditLog({
    action: suspended ? 'member.suspend' : 'member.unsuspend',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
    metadata: { phone: user.phone, reason: user.suspensionReason },
  })

  res.status(200).json({
    success: true,
    message: 'Member suspension updated successfully.',
    data: { user },
  })
})

const manualFeeEntry = asyncHandler(async (req, res) => {
  const settings = await getSettings()
  const user = await User.findById(req.body.userId)

  if (!user) {
    throw new AppError('Member not found.', 404)
  }

  const month = typeof req.body.month === 'string' ? req.body.month : monthKey()
  const baseAmount = Number(req.body.amount ?? settings.monthlyFee)
  const lateFee =
    settings.financeControls?.lateFeeEnabled && Number(settings.financeControls?.lateFeeAmount)
      ? Number(settings.financeControls.lateFeeAmount)
      : 0
  const payment = await Payment.findOneAndUpdate(
    { month, type: PAYMENT_TYPES.MONTHLY_FEE, user: user._id },
    {
      $set: {
        amount: baseAmount + lateFee,
        enteredByAdmin: true,
        lateFeeAmount: lateFee,
        method: req.body.method || 'Manual',
        receiptGeneratedAt: new Date(),
        receiptNumber: `PAY-MANUAL-${user._id}-${month}`,
        senderPhone: req.body.senderPhone || user.phone,
        status: PAYMENT_STATUSES.VERIFIED,
        transactionId: req.body.transactionId || `MANUAL-${Date.now()}`,
        type: PAYMENT_TYPES.MONTHLY_FEE,
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
      },
      $setOnInsert: {
        user: user._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )

  await recordAuditLog({
    action: 'finance.manualFee.create',
    actor: req.user,
    entityId: payment._id,
    entityType: 'Payment',
    metadata: { month, user: user._id },
  })

  res.status(200).json({
    success: true,
    message: 'Manual fee saved successfully.',
    data: { payment },
  })
})

const waiveFee = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.userId)

  if (!user) {
    throw new AppError('Member not found.', 404)
  }

  const month = typeof req.body.month === 'string' ? req.body.month : monthKey()
  const reason = typeof req.body.reason === 'string' ? req.body.reason : ''
  const payment = await Payment.findOneAndUpdate(
    { month, type: PAYMENT_TYPES.MONTHLY_FEE, user: user._id },
    {
      $set: {
        amount: 0,
        enteredByAdmin: true,
        method: 'Waived',
        receiptGeneratedAt: new Date(),
        receiptNumber: `PAY-WAIVED-${user._id}-${month}`,
        senderPhone: user.phone,
        status: PAYMENT_STATUSES.VERIFIED,
        transactionId: `WAIVED-${Date.now()}`,
        type: PAYMENT_TYPES.MONTHLY_FEE,
        waived: true,
        waivedReason: reason,
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
      },
      $setOnInsert: {
        user: user._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )

  await recordAuditLog({
    action: 'finance.fee.waive',
    actor: req.user,
    entityId: payment._id,
    entityType: 'Payment',
    metadata: { month, reason, user: user._id },
  })

  res.status(200).json({
    success: true,
    message: 'Fee waived successfully.',
    data: { payment },
  })
})

const getDashboardWidgets = asyncHandler(async (req, res) => {
  const currentMonth = monthKey()
  const previousMonth = previousMonthKey()
  const [
    members,
    currentPayments,
    previousPayments,
    currentDonations,
    expenses,
    recentActivity,
    upcomingMeetings,
    upcomingTours,
    topDonations,
  ] = await Promise.all([
    User.find({ role: USER_ROLES.MEMBER, status: USER_STATUSES.APPROVED }),
    Payment.find({ month: currentMonth, status: PAYMENT_STATUSES.VERIFIED }),
    Payment.find({ month: previousMonth, status: PAYMENT_STATUSES.VERIFIED }),
    Donation.find({ status: PAYMENT_STATUSES.VERIFIED }),
    Expense.find(),
    AuditLog.find().populate('actor', 'name role').sort({ createdAt: -1 }).limit(20),
    Meeting.find({ meetingDate: { $gte: new Date() } }).sort({ meetingDate: 1 }).limit(3),
    Tour.find({ startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(3),
    Donation.aggregate([
      { $match: { status: PAYMENT_STATUSES.VERIFIED } },
      { $group: { _id: '$donorName', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
  ])
  const paidMemberIds = new Set(currentPayments.map((payment) => String(payment.user)))
  const addressBreakdown = members.reduce((totals, member) => {
    const area = (member.address || 'Unknown').split(',')[0].trim() || 'Unknown'
    totals[area] = (totals[area] || 0) + 1
    return totals
  }, {})

  res.status(200).json({
    success: true,
    message: 'Dashboard widgets loaded successfully.',
    data: {
      addressBreakdown,
      feeProgress: {
        paid: paidMemberIds.size,
        total: members.length,
      },
      memberGrowth: await User.aggregate([
        { $match: { role: USER_ROLES.MEMBER } },
        {
          $group: {
            _id: { $dateToString: { date: '$createdAt', format: '%Y-%m' } },
            members: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      monthlyComparison: {
        currentIncome: currentPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        events: upcomingMeetings.length + upcomingTours.length,
        newMembers: members.filter((member) => monthKey(member.createdAt) === currentMonth).length,
        previousIncome: previousPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      },
      online: getOnlineSnapshot(),
      recentActivity,
      topDonors: topDonations,
      totalExpense: expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      upcomingEvents: [...upcomingMeetings, ...upcomingTours].slice(0, 3),
      verifiedDonationTotal: currentDonations.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    },
  })
})

const globalSearch = asyncHandler(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  if (!q) {
    res.status(200).json({
      success: true,
      message: 'Search completed successfully.',
      data: { blogs: [], meetings: [], notices: [], users: [] },
    })
    return
  }

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  const [users, notices, meetings, blogs] = await Promise.all([
    User.find({ $or: [{ name: regex }, { phone: regex }, { address: regex }] }).limit(8),
    Notice.find({ $or: [{ title: regex }, { body: regex }, { category: regex }] }).limit(8),
    Meeting.find({ $or: [{ title: regex }, { agenda: regex }, { location: regex }] }).limit(8),
    Blog.find({ $or: [{ title: regex }, { body: regex }] }).populate('createdBy', 'name').limit(8),
  ])

  res.status(200).json({
    success: true,
    message: 'Search completed successfully.',
    data: { blogs, meetings, notices, users },
  })
})

const exportFinancePdf = asyncHandler(async (req, res) => {
  const [payments, donations, expenses] = await Promise.all([
    Payment.find().populate('user', 'name phone').sort({ createdAt: -1 }).limit(500),
    Donation.find().sort({ createdAt: -1 }).limit(500),
    Expense.find().sort({ date: -1 }).limit(500),
  ])
  const doc = new PDFDocument({ margin: 48 })
  const chunks = []

  doc.on('data', (chunk) => chunks.push(chunk))
  doc.on('end', () => {
    const buffer = Buffer.concat(chunks)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="finance-report.pdf"')
    res.send(buffer)
  })

  doc.fontSize(18).text('Dargah Para OIkko Porishod Finance Report')
  doc.moveDown()
  doc.fontSize(12).text(`Payments: ${payments.length}`)
  doc.text(`Donations: ${donations.length}`)
  doc.text(`Expenses: ${expenses.length}`)
  doc.moveDown()
  payments.slice(0, 30).forEach((payment) => {
    doc.text(`${payment.month} | ${payment.user?.name || 'Member'} | Tk ${payment.amount}`)
  })
  doc.end()
})

const importMembers = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body.members) ? req.body.members : []

  if (!rows.length) {
    throw new AppError('At least one member row is required.', 400)
  }

  const result = {
    created: 0,
    skipped: [],
  }

  for (const [index, row] of rows.entries()) {
    const name = typeof row.name === 'string' ? row.name.trim() : ''
    const phone = normalizeBangladeshiPhone(row.phone)
    const role = Object.values(USER_ROLES).includes(row.role) ? row.role : USER_ROLES.MEMBER
    const status = Object.values(USER_STATUSES).includes(row.status)
      ? row.status
      : USER_STATUSES.APPROVED

    if (!name || !isBangladeshiPhone(phone)) {
      result.skipped.push({ index, reason: 'Name or Bangladeshi phone is invalid.' })
      continue
    }

    const exists = await User.exists({ phone })

    if (exists) {
      result.skipped.push({ index, phone, reason: 'Phone already exists.' })
      continue
    }

    const user = new User({
      address: typeof row.address === 'string' ? row.address.trim() : '',
      approvedAt: status === USER_STATUSES.APPROVED ? new Date() : null,
      approvedBy: status === USER_STATUSES.APPROVED ? req.user._id : null,
      name,
      password:
        typeof row.password === 'string' && row.password.length >= 6
          ? row.password
          : `Temp@${phone.slice(-4)}`,
      phone,
      registrationPayment: {
        amount: 0,
        method: 'CSV Import',
        status: PAYMENT_STATUSES.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
      },
      role,
      status,
    })

    await user.save()
    result.created += 1
  }

  await recordAuditLog({
    action: 'member.import.csv',
    actor: req.user,
    entityType: 'User',
    metadata: result,
  })

  res.status(201).json({
    success: true,
    message: 'Member import processed successfully.',
    data: result,
  })
})

const exportMembersPdf = asyncHandler(async (req, res) => {
  const filter = {}

  if (req.query.status) {
    filter.status = req.query.status
  }
  if (req.query.role) {
    filter.role = req.query.role
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {}
    if (req.query.from) {
      filter.createdAt.$gte = new Date(req.query.from)
    }
    if (req.query.to) {
      filter.createdAt.$lte = new Date(req.query.to)
    }
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(1000)
  const doc = new PDFDocument({ margin: 42 })
  const chunks = []

  doc.on('data', (chunk) => chunks.push(chunk))
  doc.on('end', () => {
    const buffer = Buffer.concat(chunks)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="member-report.pdf"')
    res.send(buffer)
  })

  doc.fontSize(18).text('Dargah Para OIkko Porishod Member Report')
  doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toISOString()}`)
  doc.moveDown()
  users.forEach((user, index) => {
    doc
      .fillColor('#111')
      .fontSize(10)
      .text(
        `${index + 1}. ${user.name} | ${user.phone} | ${user.role} | ${user.status} | ${user.address || 'N/A'}`,
      )
  })
  doc.end()
})

module.exports = {
  bulkApprovePending,
  bulkRejectPending,
  exportFinancePdf,
  exportMembersPdf,
  getControls,
  getDashboardWidgets,
  globalSearch,
  importMembers,
  manualFeeEntry,
  setMemberSuspension,
  updateControls,
  waiveFee,
}
