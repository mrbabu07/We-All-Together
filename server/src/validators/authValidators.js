const AppError = require('../utils/appError')
const { isBangladeshiPhone, normalizeBangladeshiPhone } = require('../utils/phoneUtils')

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

const validateLogin = (body) => ({
  phone: requirePhone(body, 'phone', 'Phone'),
  password: requireString(body, 'password', 'Password'),
})

const validateBootstrapAdmin = (body) => {
  const password = requireString(body, 'password', 'Password')

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400)
  }

  return {
    name: requireString(body, 'name', 'Name'),
    phone: requirePhone(body, 'phone', 'Phone'),
    address: typeof body.address === 'string' ? body.address.trim() : '',
    password,
    setupSecret: requireString(body, 'setupSecret', 'Setup secret'),
  }
}

const validateProfileUpdate = (body) => ({
  address: typeof body.address === 'string' ? body.address.trim() : '',
  birthCertificateUrl:
    typeof body.birthCertificateUrl === 'string' ? body.birthCertificateUrl.trim() : '',
  name: requireString(body, 'name', 'Name'),
  nidImageUrl: typeof body.nidImageUrl === 'string' ? body.nidImageUrl.trim() : '',
  phone: requirePhone(body, 'phone', 'Phone'),
  profilePhotoUrl: typeof body.profilePhotoUrl === 'string' ? body.profilePhotoUrl.trim() : '',
})

const validateChangePassword = (body) => {
  const currentPassword = requireString(body, 'currentPassword', 'Current password')
  const newPassword = requireString(body, 'newPassword', 'New password')

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters.', 400)
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password.', 400)
  }

  return {
    currentPassword,
    newPassword,
  }
}

const validateAdminPasswordReset = (body) => {
  const newPassword = requireString(body, 'newPassword', 'New password')

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters.', 400)
  }

  return {
    newPassword,
  }
}

module.exports = {
  validateAdminPasswordReset,
  validateChangePassword,
  validateBootstrapAdmin,
  validateLogin,
  validateProfileUpdate,
}
