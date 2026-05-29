const AppError = require('../utils/appError')
const { isBangladeshiPhone, normalizeBangladeshiPhone } = require('../utils/phoneUtils')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

const normalizeEmail = (email) => email.trim().toLowerCase()

const optionalEmail = (body) => {
  if (typeof body.email !== 'string' || body.email.trim() === '') {
    return undefined
  }

  const email = normalizeEmail(body.email)

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError('Email must be valid.', 400)
  }

  return email
}

const requireLoginIdentifier = (body) => {
  const rawIdentifier = body.identifier || body.email || body.phone

  if (typeof rawIdentifier !== 'string' || rawIdentifier.trim() === '') {
    throw new AppError('Email or phone is required.', 400)
  }

  const identifier = rawIdentifier.trim()

  if (identifier.includes('@')) {
    const email = normalizeEmail(identifier)

    if (!EMAIL_PATTERN.test(email)) {
      throw new AppError('Email must be valid.', 400)
    }

    return { email }
  }

  const phone = normalizeBangladeshiPhone(identifier)

  if (!isBangladeshiPhone(phone)) {
    throw new AppError('Phone must use Bangladeshi format like 017XXXXXXXX.', 400)
  }

  return { phone }
}

const validateLogin = (body) => ({
  ...requireLoginIdentifier(body),
  password: requireString(body, 'password', 'Password'),
})

const validateBootstrapAdmin = (body) => {
  const password = requireString(body, 'password', 'Password')

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400)
  }

  return {
    email: optionalEmail(body),
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
  email:
    typeof body.email === 'string' && body.email.trim() !== '' ? optionalEmail(body) : '',
  emergencyContact: {
    name:
      typeof body.emergencyContact?.name === 'string' ? body.emergencyContact.name.trim() : '',
    phone:
      typeof body.emergencyContact?.phone === 'string'
        ? normalizeBangladeshiPhone(body.emergencyContact.phone)
        : '',
    relation:
      typeof body.emergencyContact?.relation === 'string'
        ? body.emergencyContact.relation.trim()
        : '',
  },
  name: requireString(body, 'name', 'Name'),
  nidImageUrl: typeof body.nidImageUrl === 'string' ? body.nidImageUrl.trim() : '',
  notificationPreferences:
    typeof body.notificationPreferences === 'object' && body.notificationPreferences
      ? {
          fees: body.notificationPreferences.fees !== false,
          meetings: body.notificationPreferences.meetings !== false,
          notices: body.notificationPreferences.notices !== false,
          sms: body.notificationPreferences.sms !== false,
          tours: body.notificationPreferences.tours !== false,
          whatsapp: body.notificationPreferences.whatsapp === true,
        }
      : undefined,
  passportImageUrl: typeof body.passportImageUrl === 'string' ? body.passportImageUrl.trim() : '',
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
