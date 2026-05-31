const Donation = require('../models/Donation')
const Payment = require('../models/Payment')
const User = require('../models/User')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { getSettings } = require('../services/settingsService')
const { createReceiptPdf } = require('../services/receiptPdfService')
const {
  createPaymentReceiptBuffer,
  readReceiptPdfFile,
} = require('../services/paymentReceiptFileService')
const { ensurePaymentQrCode } = require('../services/paymentQrService')
const { verifyAccessToken } = require('../utils/tokenUtils')

const organizationName = 'Dargah Para OIkko Porishod'

const buildReceiptOrganization = (settings) => ({
  address: settings.siteSettings?.address || settings.address || '',
  contactNumber: settings.siteSettings?.contactNumber || settings.contactNumber || '',
  donationNumber: settings.donationNumber,
  donationProvider: settings.donationProvider,
  email: settings.siteSettings?.email || settings.email || '',
  logoUrl: settings.siteSettings?.logoUrl || settings.logoUrl || '',
  name: settings.siteSettings?.orgName || organizationName,
})

const canReadUserReceipt = (req, userId) =>
  req.user.role === USER_ROLES.ADMIN || req.user._id.toString() === userId.toString()

const getOptionalReceiptUser = async (req) => {
  const authHeader = req.headers.authorization || ''
  const [scheme, token] = authHeader.split(' ')

  if (!token) {
    return null
  }

  if (scheme !== 'Bearer') {
    throw new AppError('Authentication token is invalid.', 401)
  }

  const decoded = verifyAccessToken(token)
  const user = await User.findById(decoded.id)

  if (!user || user.status !== USER_STATUSES.APPROVED) {
    throw new AppError('Authenticated user is not allowed to access this receipt.', 401)
  }

  return user
}

const sendPdf = (res, filename, buffer) => {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.status(200).send(buffer)
}

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

  await ensurePaymentQrCode(payment)

  res.status(200).json({
    success: true,
    message: 'Payment receipt loaded successfully.',
    data: {
      receipt: {
        issuedAt: new Date(),
        organization: buildReceiptOrganization(settings),
        payment,
        receiptNo: payment.receiptNumber || `PAY-${payment._id}`,
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
        organization: buildReceiptOrganization(settings),
        receiptNo: `REG-${user._id}`,
        registrationPayment: user.registrationPayment,
        type: 'registration-fee',
        user,
      },
    },
  })
})

const downloadRegistrationReceiptPdf = asyncHandler(async (req, res) => {
  const [user, settings] = await Promise.all([
    User.findById(req.params.id).populate('registrationPayment.verifiedBy', 'name phone role'),
    getSettings(),
  ])

  if (!user) {
    throw new AppError('Registration not found.', 404)
  }

  if (!canReadUserReceipt(req, user._id)) {
    throw new AppError('You do not have permission to download this receipt.', 403)
  }

  const payment = user.registrationPayment || {}
  const receiptNo = `REG-${user._id}`
  const buffer = await createReceiptPdf({
    adminName: payment.verifiedBy?.name || '',
    amount: payment.amount || 0,
    date: payment.paidAt || user.createdAt,
    method: payment.method || 'Registration',
    organization: buildReceiptOrganization(settings),
    payerAddress: user.address,
    payerName: user.name,
    payerPhone: user.phone,
    receiptNo,
    status: payment.status || user.status,
    transactionId: payment.transactionId || '',
    type: 'Registration fee',
  })

  sendPdf(res, `${receiptNo}.pdf`, buffer)
})

const getDonationReceipt = asyncHandler(async (req, res) => {
  const [donation, settings] = await Promise.all([
    Donation.findById(req.params.id)
      .populate('createdBy', 'name phone role')
      .populate('rejectedBy', 'name phone role')
      .populate('user', 'name phone role')
      .populate('verifiedBy', 'name phone role'),
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
        organization: buildReceiptOrganization(settings),
        receiptNo: donation.receiptNumber || `DON-${donation._id}`,
        type: 'donation',
      },
    },
  })
})

const downloadReceiptPdf = asyncHandler(async (req, res) => {
  const [settings, payment, donation] = await Promise.all([
    getSettings(),
    Payment.findById(req.params.id)
      .populate('user', 'name phone address role status')
      .populate('verifiedBy', 'name phone role'),
    Donation.findById(req.params.id),
  ])

  if (payment) {
    const requester = await getOptionalReceiptUser(req)

    if (!requester) {
      throw new AppError('Authentication is required to download this payment receipt.', 401)
    }

    if (
      requester.role !== USER_ROLES.ADMIN &&
      requester._id.toString() !== payment.user._id.toString()
    ) {
      throw new AppError('You do not have permission to download this receipt.', 403)
    }

    if (!payment.receiptNumber || !payment.receiptGeneratedAt) {
      payment.receiptNumber = payment.receiptNumber || `PAY-${payment._id}`
      payment.receiptGeneratedAt = payment.receiptGeneratedAt || new Date()
      await payment.save()
    }
    const storedBuffer = await readReceiptPdfFile(payment.receiptPdfPath)
    const buffer =
      storedBuffer ||
      (await createPaymentReceiptBuffer({
        organizationName,
        payment,
        settings,
      }))

    sendPdf(res, `${payment.receiptNumber}.pdf`, buffer)
    return
  }

  if (donation) {
    if (!donation.receiptNumber || !donation.receiptGeneratedAt) {
      donation.receiptNumber = donation.receiptNumber || `DON-${donation._id}`
      donation.receiptGeneratedAt = donation.receiptGeneratedAt || new Date()
      await donation.save()
    }

    const buffer = await createReceiptPdf({
      amount: donation.amount,
      date: donation.createdAt,
      method: donation.method,
      organization: buildReceiptOrganization(settings),
      payerName: donation.donorName,
      payerPhone: donation.phone,
      receiptNo: donation.receiptNumber,
      status: donation.status,
      transactionId: donation.transactionId,
      type: 'Donation',
    })

    sendPdf(res, `${donation.receiptNumber}.pdf`, buffer)
    return
  }

  throw new AppError('Receipt not found.', 404)
})

module.exports = {
  downloadRegistrationReceiptPdf,
  downloadReceiptPdf,
  getDonationReceipt,
  getPaymentReceipt,
  getRegistrationReceipt,
}
