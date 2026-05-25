const asyncHandler = require('../utils/asyncHandler')
const { getSettings } = require('../services/settingsService')
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

  res.status(200).json({
    success: true,
    message: 'Settings loaded successfully.',
    data: {
      settings: {
        registrationFee: settings.registrationFee,
        monthlyFee: settings.monthlyFee,
        donationNumber: settings.donationNumber,
        donationProvider: settings.donationProvider,
        notificationSettings: {
          smsFeeReminderEnabled: Boolean(notificationSettings.smsFeeReminderEnabled),
          smsMeetingEnabled: Boolean(notificationSettings.smsMeetingEnabled),
          smsNoticeEnabled: Boolean(notificationSettings.smsNoticeEnabled),
          whatsappFeeReminderEnabled: Boolean(notificationSettings.whatsappFeeReminderEnabled),
          whatsappMeetingEnabled: Boolean(notificationSettings.whatsappMeetingEnabled),
          whatsappNoticeEnabled: Boolean(notificationSettings.whatsappNoticeEnabled),
        },
      },
    },
  })
})

const updateNotificationSettings = asyncHandler(async (req, res) => {
  const payload = validateNotificationSettings(req.body)
  const settings = await getSettings()

  settings.notificationSettings = {
    ...settings.notificationSettings,
    ...payload,
  }
  await settings.save()
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
  const settings = await getSettings()

  settings.registrationFee = payload.registrationFee
  await settings.save()
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
  const settings = await getSettings()

  settings.monthlyFee = payload.monthlyFee
  await settings.save()
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
  const settings = await getSettings()

  settings.donationNumber = payload.donationNumber
  settings.donationProvider = payload.donationProvider
  await settings.save()
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
