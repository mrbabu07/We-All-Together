const fs = require('fs/promises')
const path = require('path')
const { createReceiptPdf } = require('./receiptPdfService')
const { ensurePaymentQrCode } = require('./paymentQrService')

const receiptDirectory = path.join(__dirname, '../../storage/receipts')

const toReceiptFilePath = (receiptPdfPath = '') => {
  if (!receiptPdfPath) {
    return ''
  }

  return path.isAbsolute(receiptPdfPath)
    ? receiptPdfPath
    : path.join(__dirname, '../..', receiptPdfPath.replace(/^[/\\]/, ''))
}

const createPaymentReceiptBuffer = async ({ organizationName, payment, settings }) => {
  await payment.populate([
    { path: 'user', select: 'name phone address role status' },
    { path: 'verifiedBy', select: 'name phone role' },
  ])
  await ensurePaymentQrCode(payment)

  return createReceiptPdf({
    amount: payment.amount,
    adminName: payment.verifiedBy?.name || '',
    coveredMonths: payment.coveredMonths || [],
    date: payment.createdAt,
    lateFee: payment.lateFeeApplied || payment.lateFeeAmount || 0,
    method: payment.method,
    organization: {
      address: settings.address,
      contactNumber: settings.contactNumber,
      logoUrl: settings.logoUrl,
      name: organizationName,
    },
    payerAddress: payment.user?.address,
    payerName: payment.user?.name,
    payerPhone: payment.user?.phone,
    qrCodeDataUrl: payment.qrCodeDataUrl,
    receiptNo: payment.receiptNumber,
    status: payment.status,
    transactionId: payment.transactionId,
    type: 'Monthly member fee',
    verificationUrl: payment.verificationUrl,
  })
}

const generatePaymentReceiptFile = async ({ organizationName, payment, settings }) => {
  const buffer = await createPaymentReceiptBuffer({ organizationName, payment, settings })
  const safeReceiptNumber = String(payment.receiptNumber || payment._id).replace(/[^\w-]/g, '-')
  const filename = `${safeReceiptNumber}.pdf`

  await fs.mkdir(receiptDirectory, { recursive: true })
  await fs.writeFile(path.join(receiptDirectory, filename), buffer)

  payment.receiptPdfPath = `storage/receipts/${filename}`
  await payment.save()

  return {
    buffer,
    filename,
    path: payment.receiptPdfPath,
  }
}

const readReceiptPdfFile = async (receiptPdfPath) => {
  const filePath = toReceiptFilePath(receiptPdfPath)

  if (!filePath) {
    return null
  }

  try {
    return await fs.readFile(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }

    throw error
  }
}

module.exports = {
  createPaymentReceiptBuffer,
  generatePaymentReceiptFile,
  readReceiptPdfFile,
}
