const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const Donation = require('../models/Donation')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { validateDonation } = require('../validators/financeValidators')

const submitDonation = asyncHandler(async (req, res) => {
  const payload = validateDonation(req.body)
  const donation = await Donation.create(payload)

  res.status(201).json({
    success: true,
    message: 'Donation submitted for verification. Thank you.',
    data: {
      donation,
    },
  })
})

const getDonations = asyncHandler(async (req, res) => {
  const donations = await Donation.find()
    .populate('verifiedBy', 'name phone')
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    message: 'Donations loaded successfully.',
    data: {
      donations,
    },
  })
})

const verifyDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id)

  if (!donation) {
    throw new AppError('Donation not found.', 404)
  }

  donation.status = PAYMENT_STATUSES.VERIFIED
  donation.verifiedAt = new Date()
  donation.verifiedBy = req.user._id
  await donation.save()

  res.status(200).json({
    success: true,
    message: 'Donation verified successfully.',
    data: {
      donation,
    },
  })
})

const rejectDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id)

  if (!donation) {
    throw new AppError('Donation not found.', 404)
  }

  donation.status = PAYMENT_STATUSES.REJECTED
  donation.verifiedAt = null
  donation.verifiedBy = null
  await donation.save()

  res.status(200).json({
    success: true,
    message: 'Donation rejected successfully.',
    data: {
      donation,
    },
  })
})

module.exports = {
  getDonations,
  rejectDonation,
  submitDonation,
  verifyDonation,
}
