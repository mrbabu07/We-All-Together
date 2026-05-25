const AppError = require('../utils/appError')

const requireString = (body, fieldName, label = fieldName) => {
  const value = body[fieldName]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${label} is required.`, 400)
  }

  return value.trim()
}

const readOptionalString = (body, fieldName) =>
  typeof body[fieldName] === 'string' ? body[fieldName].trim() : ''

const readAmount = (body, fieldName, label = fieldName) => {
  const amount = Number(body[fieldName])

  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(`${label} must be a valid positive amount.`, 400)
  }

  return amount
}

const validateRegistration = (body) => {
  const password = requireString(body, 'password', 'Password')

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400)
  }

  return {
    name: requireString(body, 'name', 'Name'),
    phone: requireString(body, 'phone', 'Phone'),
    address: requireString(body, 'address', 'Address'),
    password,
    payment: {
      method: requireString(body, 'paymentMethod', 'Payment method'),
      transactionId: requireString(body, 'transactionId', 'Transaction ID'),
      senderPhone: requireString(body, 'senderPhone', 'Sender phone'),
      note: readOptionalString(body, 'paymentNote'),
    },
  }
}

const validateRegistrationFee = (body) => ({
  registrationFee: readAmount(body, 'registrationFee', 'Registration fee'),
})

const validateRejectRegistration = (body) => ({
  reason: readOptionalString(body, 'reason'),
})

module.exports = {
  validateRegistration,
  validateRegistrationFee,
  validateRejectRegistration,
}
