const AppError = require('../utils/appError')

const requireString = (body, fieldName, label = fieldName) => {
  const value = body[fieldName]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${label} is required.`, 400)
  }

  return value.trim()
}

const validateLogin = (body) => ({
  phone: requireString(body, 'phone', 'Phone'),
  password: requireString(body, 'password', 'Password'),
})

const validateBootstrapAdmin = (body) => {
  const password = requireString(body, 'password', 'Password')

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400)
  }

  return {
    name: requireString(body, 'name', 'Name'),
    phone: requireString(body, 'phone', 'Phone'),
    address: typeof body.address === 'string' ? body.address.trim() : '',
    password,
    setupSecret: requireString(body, 'setupSecret', 'Setup secret'),
  }
}

module.exports = {
  validateBootstrapAdmin,
  validateLogin,
}
