const asyncHandler = require('../utils/asyncHandler')
const Activity = require('../models/Activity')
const Donation = require('../models/Donation')
const User = require('../models/User')
const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const { getSettings, updateSettings } = require('../services/settingsService')
const {
  validateDonationNumber,
  validateMonthlyFee,
  validateNotificationSettings,
} = require('../validators/financeValidators')
const { validateRegistrationFee } = require('../validators/registrationValidators')
const { recordAuditLog } = require('../services/auditService')

const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings()
  const notificationSettings = settings.notificationSettings || {}
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [
    totalMembers,
    activeMembers,
    newMembersThisMonth,
    yearlyDonationRows,
    completedActivities,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({
      status: USER_STATUSES.APPROVED,
      softDeletedAt: null,
      suspendedAt: null,
    }),
    User.countDocuments({
      createdAt: { $gte: monthStart },
      softDeletedAt: null,
    }),
    Donation.aggregate([
      {
        $match: {
          status: PAYMENT_STATUSES.VERIFIED,
          verifiedAt: { $gte: yearStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Activity.countDocuments({
      status: 'completed',
    }),
  ])

  res.status(200).json({
    success: true,
    message: 'Settings loaded successfully.',
    data: {
      settings: {
        registrationFee: settings.registrationFee,
        monthlyFee: settings.monthlyFee,
        monthlyFeeAmount: settings.monthlyFeeAmount,
        feeLateFeeAmount: settings.feeLateFeeAmount,
        feeDueDay: settings.feeDueDay,
        feeOverdueAlertEnabled: settings.feeOverdueAlertEnabled,
        donationNumber: settings.donationNumber,
        donationProvider: settings.donationProvider,
        appearance: settings.appearance,
        homepageControls: settings.homepageControls,
        siteSettings: settings.siteSettings,
        notificationSettings: {
          meetingReminder24hEnabled: Boolean(notificationSettings.meetingReminder24hEnabled),
          paymentDecisionEnabled: notificationSettings.paymentDecisionEnabled !== false,
          registrationDecisionEnabled: notificationSettings.registrationDecisionEnabled !== false,
          smsFeeReminderEnabled: Boolean(notificationSettings.smsFeeReminderEnabled),
          smsGloballyEnabled: Boolean(notificationSettings.smsGloballyEnabled),
          smsMeetingEnabled: Boolean(notificationSettings.smsMeetingEnabled),
          smsNoticeEnabled: Boolean(notificationSettings.smsNoticeEnabled),
          tourRegistrationOpenEnabled: Boolean(notificationSettings.tourRegistrationOpenEnabled),
          whatsappFeeReminderEnabled: Boolean(notificationSettings.whatsappFeeReminderEnabled),
          whatsappMeetingEnabled: Boolean(notificationSettings.whatsappMeetingEnabled),
          whatsappNoticeEnabled: Boolean(notificationSettings.whatsappNoticeEnabled),
        },
        stats: {
          activeMembers,
          completedActivities,
          newMembersThisMonth,
          totalMembers,
          yearlyDonation: yearlyDonationRows[0]?.total || 0,
          yearsActive: 5,
        },
      },
    },
  })
})

const updateNotificationSettings = asyncHandler(async (req, res) => {
  const payload = validateNotificationSettings(req.body)
  const settings = await updateSettings(
    Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [`notificationSettings.${key}`, value]),
    ),
  )
  await recordAuditLog({
    action: 'settings.notificationSettings.update',
    actor: req.user,
    entityId: settings._id,
    entityType: 'OrganizationSetting',
    metadata: payload,
  })

  res.status(200).json({
    success: true,
    message: 'Notification settings updated successfully.',
    data: {
      settings,
    },
  })
})

const updateRegistrationFee = asyncHandler(async (req, res) => {
  const payload = validateRegistrationFee(req.body)
  const settings = await updateSettings({
    registrationFee: payload.registrationFee,
  })
  await recordAuditLog({
    action: 'settings.registrationFee.update',
    actor: req.user,
    entityId: settings._id,
    entityType: 'OrganizationSetting',
    metadata: {
      registrationFee: settings.registrationFee,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Registration fee updated successfully.',
    data: {
      settings,
    },
  })
})

const updateMonthlyFee = asyncHandler(async (req, res) => {
  const payload = validateMonthlyFee(req.body)
  const settings = await updateSettings({
    monthlyFee: payload.monthlyFee,
    monthlyFeeAmount: Math.round(Number(payload.monthlyFee || 0) * 100),
  })
  await recordAuditLog({
    action: 'settings.monthlyFee.update',
    actor: req.user,
    entityId: settings._id,
    entityType: 'OrganizationSetting',
    metadata: {
      monthlyFee: settings.monthlyFee,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Monthly fee updated successfully.',
    data: {
      settings,
    },
  })
})

const updateDonationNumber = asyncHandler(async (req, res) => {
  const payload = validateDonationNumber(req.body)
  const settings = await updateSettings({
    donationNumber: payload.donationNumber,
    donationProvider: payload.donationProvider,
  })
  await recordAuditLog({
    action: 'settings.donationNumber.update',
    actor: req.user,
    entityId: settings._id,
    entityType: 'OrganizationSetting',
    metadata: {
      donationProvider: settings.donationProvider,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Donation number updated successfully.',
    data: {
      settings,
    },
  })
})

module.exports = {
  getPublicSettings,
  updateDonationNumber,
  updateMonthlyFee,
  updateNotificationSettings,
  updateRegistrationFee,
}
