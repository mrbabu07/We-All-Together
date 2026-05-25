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
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const [totalMembers, yearlyDonationRows, completedActivities] = await Promise.all([
    User.countDocuments({
      role: { $in: [USER_ROLES.MEMBER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN] },
      status: USER_STATUSES.APPROVED,
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
        donationNumber: settings.donationNumber,
        donationProvider: settings.donationProvider,
        appearance: settings.appearance,
        siteSettings: settings.siteSettings,
        notificationSettings: {
          smsFeeReminderEnabled: Boolean(notificationSettings.smsFeeReminderEnabled),
          smsMeetingEnabled: Boolean(notificationSettings.smsMeetingEnabled),
          smsNoticeEnabled: Boolean(notificationSettings.smsNoticeEnabled),
          whatsappFeeReminderEnabled: Boolean(notificationSettings.whatsappFeeReminderEnabled),
          whatsappMeetingEnabled: Boolean(notificationSettings.whatsappMeetingEnabled),
          whatsappNoticeEnabled: Boolean(notificationSettings.whatsappNoticeEnabled),
        },
        stats: {
          completedActivities,
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
