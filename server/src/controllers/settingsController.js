const { USER_ROLES } = require('../constants/userConstants')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { getSettings } = require('../services/settingsService')
const { validateRegistrationFee } = require('../validators/registrationValidators')

const ensureAdmin = (user) => {
  if (!user || user.role !== USER_ROLES.ADMIN) {
    throw new AppError('Admin access is required.', 403)
  }
}

const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings()

  res.status(200).json({
    success: true,
    message: 'Settings loaded successfully.',
    data: {
      settings: {
        registrationFee: settings.registrationFee,
        donationNumber: settings.donationNumber,
        donationProvider: settings.donationProvider,
      },
    },
  })
})

const updateRegistrationFee = asyncHandler(async (req, res) => {
  ensureAdmin(req.user)
  const payload = validateRegistrationFee(req.body)
  const settings = await getSettings()

  settings.registrationFee = payload.registrationFee
  await settings.save()

  res.status(200).json({
    success: true,
    message: 'Registration fee updated successfully.',
    data: {
      settings,
    },
  })
})

module.exports = {
  getPublicSettings,
  updateRegistrationFee,
}
