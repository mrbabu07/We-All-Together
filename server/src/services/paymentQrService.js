const QRCode = require('qrcode')
const env = require('../config/env')

const buildPaymentVerificationUrl = (paymentId) => {
  const baseUrl = env.clientUrl.replace(/\/$/, '')
  return `${baseUrl}/verify/${paymentId}`
}

const ensurePaymentQrCode = async (payment) => {
  if (!payment) {
    return null
  }

  const verificationUrl = buildPaymentVerificationUrl(payment._id)

  if (payment.qrCodeDataUrl && payment.verificationUrl === verificationUrl) {
    return payment
  }

  payment.verificationUrl = verificationUrl
  payment.qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 220,
  })
  payment.qrGeneratedAt = new Date()
  await payment.save()

  return payment
}

module.exports = {
  buildPaymentVerificationUrl,
  ensurePaymentQrCode,
}
