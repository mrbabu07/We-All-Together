const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const Donation = require('../models/Donation')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { getSettings } = require('../services/settingsService')
const {
  validateDonation,
  validateDonationRejection,
  validateManualDonation,
} = require('../validators/financeValidators')

const createDonation = async (payload, extra = {}) => {
  const donation = new Donation({
    ...payload,
    ...extra,
    donorName: payload.anonymous ? 'Anonymous' : payload.donorName,
  })
  donation.receiptNumber = `DON-${donation._id}`
  donation.receiptGeneratedAt = new Date()
  await donation.save()

  return donation
}

const submitDonation = asyncHandler(async (req, res) => {
  const payload = validateDonation(req.body)
  const settings = await getSettings()

  if (settings.siteSettings?.publicDonationsEnabled === false) {
    throw new AppError('Public donations are currently disabled.', 403)
  }

  const donation = await createDonation(payload)

  res.status(201).json({
    success: true,
    message: 'Donation submitted for verification. Thank you.',
    data: {
      donation,
    },
  })
})

const submitMemberDonation = asyncHandler(async (req, res) => {
  const payload = validateDonation({
    ...req.body,
    donorName: req.body.donorName || req.user.name,
    phone: req.body.phone || req.user.phone,
  })
  const donation = await createDonation(payload, {
    user: req.user._id,
  })

  await recordAuditLog({
    action: 'donation.member.submit',
    actor: req.user,
    entityId: donation._id,
    entityType: 'Donation',
    metadata: {
      amount: donation.amount,
      anonymous: donation.anonymous,
      method: donation.method,
      phone: donation.phone,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Donation submitted for verification. Thank you.',
    data: {
      donation,
    },
  })
})

const createManualDonation = asyncHandler(async (req, res) => {
  const payload = validateManualDonation(req.body)
  const donation = new Donation({
    ...payload,
    createdBy: req.user._id,
    manualEntry: true,
    status: PAYMENT_STATUSES.VERIFIED,
    verifiedAt: new Date(),
    verifiedBy: req.user._id,
  })

  donation.receiptNumber = `DON-${donation._id}`
  donation.receiptGeneratedAt = new Date()
  await donation.save()
  await recordAuditLog({
    action: 'donation.manual.create',
    actor: req.user,
    entityId: donation._id,
    entityType: 'Donation',
    metadata: {
      amount: donation.amount,
      donorName: donation.donorName,
      method: donation.method,
      phone: donation.phone,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Manual donation recorded successfully.',
    data: {
      donation,
    },
  })
})

const getDonations = asyncHandler(async (req, res) => {
  const donations = await Donation.find()
    .populate('createdBy', 'name phone')
    .populate('rejectedBy', 'name phone')
    .populate('user', 'name phone')
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

const getMyDonations = asyncHandler(async (req, res) => {
  const ownerFilters = [{ user: req.user._id }]
  if (req.user.phone) {
    ownerFilters.push({ phone: req.user.phone })
  }

  const donations = await Donation.find({ $or: ownerFilters })
    .populate('verifiedBy', 'name phone')
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    message: 'Your donations loaded successfully.',
    data: {
      donations,
    },
  })
})

const getVerifiedDonations = asyncHandler(async (req, res) => {
  const donations = await Donation.find({ status: PAYMENT_STATUSES.VERIFIED })
    .select('anonymous donorName amount manualEntry method note verifiedAt createdAt')
    .sort({ verifiedAt: -1, createdAt: -1 })
    .limit(30)

  res.status(200).json({
    success: true,
    message: 'Verified donations loaded successfully.',
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
  if (donation.status !== PAYMENT_STATUSES.PENDING) {
    throw new AppError('Only pending donations can be verified.', 400)
  }

  donation.status = PAYMENT_STATUSES.VERIFIED
  donation.verifiedAt = new Date()
  donation.verifiedBy = req.user._id
  donation.rejectedAt = null
  donation.rejectedBy = null
  donation.rejectionReason = ''
  await donation.save()
  await recordAuditLog({
    action: 'donation.verify',
    actor: req.user,
    entityId: donation._id,
    entityType: 'Donation',
    metadata: {
      amount: donation.amount,
      donorName: donation.donorName,
      phone: donation.phone,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Donation verified successfully.',
    data: {
      donation,
    },
  })
})

const rejectDonation = asyncHandler(async (req, res) => {
  const { reason } = validateDonationRejection(req.body)
  const donation = await Donation.findById(req.params.id)

  if (!donation) {
    throw new AppError('Donation not found.', 404)
  }
  if (donation.status !== PAYMENT_STATUSES.PENDING) {
    throw new AppError('Only pending donations can be rejected.', 400)
  }

  donation.status = PAYMENT_STATUSES.REJECTED
  donation.verifiedAt = null
  donation.verifiedBy = null
  donation.rejectedAt = new Date()
  donation.rejectedBy = req.user._id
  donation.rejectionReason = reason
  await donation.save()
  await recordAuditLog({
    action: 'donation.reject',
    actor: req.user,
    entityId: donation._id,
    entityType: 'Donation',
    metadata: {
      amount: donation.amount,
      donorName: donation.donorName,
      phone: donation.phone,
      reason,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Donation rejected successfully.',
    data: {
      donation,
    },
  })
})

module.exports = {
  createManualDonation,
  getDonations,
  getMyDonations,
  getVerifiedDonations,
  rejectDonation,
  submitMemberDonation,
  submitDonation,
  verifyDonation,
}
