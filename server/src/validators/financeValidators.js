const AppError = require('../utils/appError')
const { isBangladeshiPhone, normalizeBangladeshiPhone } = require('../utils/phoneUtils')

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

const requireString = (body, fieldName, label = fieldName) => {
  const value = body[fieldName]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${label} is required.`, 400)
  }

  return value.trim()
}

const requirePhone = (body, fieldName, label = fieldName) => {
  const phone = normalizeBangladeshiPhone(requireString(body, fieldName, label))

  if (!isBangladeshiPhone(phone)) {
    throw new AppError(`${label} must use Bangladeshi format like 017XXXXXXXX.`, 400)
  }

  return phone
}

const optionalString = (body, fieldName) =>
  typeof body[fieldName] === 'string' ? body[fieldName].trim() : ''

const readAmount = (body, fieldName, label = fieldName) => {
  const amount = Number(body[fieldName])

  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(`${label} must be a valid positive amount.`, 400)
  }

  return amount
}

const readPositiveAmount = (body, fieldName, label = fieldName) => {
  const amount = readAmount(body, fieldName, label)

  if (amount <= 0) {
    throw new AppError(`${label} must be greater than zero.`, 400)
  }

  return amount
}

const validateMonth = (month) => {
  if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) {
    throw new AppError('Month must use YYYY-MM format.', 400)
  }

  return month
}

const validateMonthlyPayment = (body) => ({
  month: validateMonth(body.month),
  method: requireString(body, 'method', 'Payment method'),
  transactionId: requireString(body, 'transactionId', 'Transaction ID'),
  senderPhone: requirePhone(body, 'senderPhone', 'Sender phone'),
  note: optionalString(body, 'note'),
  proofImageUrl: optionalString(body, 'proofImageUrl'),
})

const validatePaymentRejection = (body) => {
  const reason = requireString(body, 'reason', 'Rejection reason')

  if (reason.length > 300) {
    throw new AppError('Rejection reason cannot exceed 300 characters.', 400)
  }

  return { reason }
}

const validateBulkPaymentAction = (body, { requireReason = false } = {}) => {
  const paymentIds = Array.isArray(body.paymentIds) ? body.paymentIds : body.ids

  if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
    throw new AppError('At least one payment is required.', 400)
  }

  const ids = [...new Set(paymentIds.map((id) => String(id).trim()))]
  if (ids.some((id) => !OBJECT_ID_PATTERN.test(id))) {
    throw new AppError('One or more payment IDs are invalid.', 400)
  }

  return {
    paymentIds: ids,
    ...(requireReason ? validatePaymentRejection(body) : {}),
  }
}

const validateExpense = (body) => {
  const date = new Date(requireString(body, 'date', 'Date'))

  if (Number.isNaN(date.getTime())) {
    throw new AppError('Date must be valid.', 400)
  }

  return {
    title: requireString(body, 'title', 'Title'),
    amount: readPositiveAmount(body, 'amount', 'Amount'),
    category: requireString(body, 'category', 'Category'),
    date,
    note: optionalString(body, 'note'),
    receiptImageUrl: optionalString(body, 'receiptImageUrl'),
  }
}

const validateDonation = (body) => ({
  anonymous: body.anonymous === true || body.anonymous === 'true',
  donorName: requireString(body, 'donorName', 'Donor name'),
  phone: requirePhone(body, 'phone', 'Phone'),
  amount: readPositiveAmount(body, 'amount', 'Amount'),
  method: requireString(body, 'method', 'Payment method'),
  transactionId: requireString(body, 'transactionId', 'Transaction ID'),
  note: optionalString(body, 'note'),
  proofImageUrl: optionalString(body, 'proofImageUrl'),
})

const validateManualDonation = (body) => {
  const anonymous = body.anonymous === true || body.anonymous === 'true'
  const donorName = anonymous ? 'Anonymous' : optionalString(body, 'donorName') || 'Anonymous'
  const transactionId = optionalString(body, 'transactionId')

  return {
    anonymous,
    amount: readPositiveAmount(body, 'amount', 'Amount'),
    donorName,
    method: optionalString(body, 'method') || 'Cash',
    note: optionalString(body, 'note'),
    phone: optionalString(body, 'phone') || 'N/A',
    proofImageUrl: optionalString(body, 'proofImageUrl'),
    transactionId: transactionId || `CASH-${Date.now()}`,
  }
}

const validateDonationRejection = validatePaymentRejection

const validateMonthlyFee = (body) => ({
  monthlyFee: readAmount(body, 'monthlyFee', 'Monthly fee'),
})

const validateDonationNumber = (body) => ({
  donationNumber: optionalString(body, 'donationNumber'),
  donationProvider: optionalString(body, 'donationProvider'),
})

const toBoolean = (value) => value === true || value === 'true'

const validateNotificationSettings = (body) => ({
  smsFeeReminderEnabled: toBoolean(body.smsFeeReminderEnabled),
  smsMeetingEnabled: toBoolean(body.smsMeetingEnabled),
  smsNoticeEnabled: toBoolean(body.smsNoticeEnabled),
  whatsappFeeReminderEnabled: toBoolean(body.whatsappFeeReminderEnabled),
  whatsappMeetingEnabled: toBoolean(body.whatsappMeetingEnabled),
  whatsappNoticeEnabled: toBoolean(body.whatsappNoticeEnabled),
})

module.exports = {
  validateDonation,
  validateDonationRejection,
  validateDonationNumber,
  validateExpense,
  validateManualDonation,
  validateMonth,
  validateMonthlyFee,
  validateMonthlyPayment,
  validateNotificationSettings,
  validateBulkPaymentAction,
  validatePaymentRejection,
}
