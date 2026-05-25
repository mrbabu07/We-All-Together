const AppError = require('../utils/appError')

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

const requireString = (body, fieldName, label = fieldName) => {
  const value = body[fieldName]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${label} is required.`, 400)
  }

  return value.trim()
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
  senderPhone: requireString(body, 'senderPhone', 'Sender phone'),
  note: optionalString(body, 'note'),
  proofImageUrl: optionalString(body, 'proofImageUrl'),
})

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
  }
}

const validateDonation = (body) => ({
  donorName: requireString(body, 'donorName', 'Donor name'),
  phone: requireString(body, 'phone', 'Phone'),
  amount: readPositiveAmount(body, 'amount', 'Amount'),
  method: requireString(body, 'method', 'Payment method'),
  transactionId: requireString(body, 'transactionId', 'Transaction ID'),
  note: optionalString(body, 'note'),
  proofImageUrl: optionalString(body, 'proofImageUrl'),
})

const validateMonthlyFee = (body) => ({
  monthlyFee: readAmount(body, 'monthlyFee', 'Monthly fee'),
})

const validateDonationNumber = (body) => ({
  donationNumber: optionalString(body, 'donationNumber'),
  donationProvider: optionalString(body, 'donationProvider'),
})

module.exports = {
  validateDonation,
  validateDonationNumber,
  validateExpense,
  validateMonth,
  validateMonthlyFee,
  validateMonthlyPayment,
}
