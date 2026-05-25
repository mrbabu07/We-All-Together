const Donation = require('../models/Donation')
const Payment = require('../models/Payment')
const User = require('../models/User')
const { USER_ROLES } = require('../constants/userConstants')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { getSettings } = require('../services/settingsService')

const organizationName = 'Dargah Para OIkko Porishod'

const canReadUserReceipt = (req, userId) =>
  req.user.role === USER_ROLES.ADMIN || req.user._id.toString() === userId.toString()

const getPaymentReceipt = asyncHandler(async (req, res) => {
  const [payment, settings] = await Promise.all([
    Payment.findById(req.params.id)
      .populate('user', 'name phone address role status')
      .populate('verifiedBy', 'name phone role'),
    getSettings(),
  ])

  if (!payment) {
    throw new AppError('Payment not found.', 404)
  }

  if (!canReadUserReceipt(req, payment.user._id)) {
    throw new AppError('You do not have permission to view this receipt.', 403)
  }

  res.status(200).json({
    success: true,
    message: 'Payment receipt loaded successfully.',
    data: {
      receipt: {
        issuedAt: new Date(),
        organization: {
          donationNumber: settings.donationNumber,
          donationProvider: settings.donationProvider,
          name: organizationName,
        },
        payment,
        receiptNo: `PAY-${payment._id}`,
        type: 'monthly-payment',
      },
    },
  })
})

const getRegistrationReceipt = asyncHandler(async (req, res) => {
  const [user, settings] = await Promise.all([
    User.findById(req.params.id).populate('registrationPayment.verifiedBy', 'name phone role'),
    getSettings(),
  ])

  if (!user) {
    throw new AppError('Registration not found.', 404)
  }

  if (!canReadUserReceipt(req, user._id)) {
    throw new AppError('You do not have permission to view this receipt.', 403)
  }

  res.status(200).json({
    success: true,
    message: 'Registration receipt loaded successfully.',
    data: {
      receipt: {
        issuedAt: new Date(),
        organization: {
          donationNumber: settings.donationNumber,
          donationProvider: settings.donationProvider,
          name: organizationName,
        },
        receiptNo: `REG-${user._id}`,
        registrationPayment: user.registrationPayment,
        type: 'registration-fee',
        user,
      },
    },
  })
})

const getDonationReceipt = asyncHandler(async (req, res) => {
  const [donation, settings] = await Promise.all([
    Donation.findById(req.params.id).populate('verifiedBy', 'name phone role'),
    getSettings(),
  ])

  if (!donation) {
    throw new AppError('Donation not found.', 404)
  }

  res.status(200).json({
    success: true,
    message: 'Donation receipt loaded successfully.',
    data: {
      receipt: {
        donation,
        issuedAt: new Date(),
        organization: {
          donationNumber: settings.donationNumber,
          donationProvider: settings.donationProvider,
          name: organizationName,
        },
        receiptNo: `DON-${donation._id}`,
        type: 'donation',
      },
    },
  })
})

module.exports = {
  getDonationReceipt,
  getPaymentReceipt,
  getRegistrationReceipt,
}
