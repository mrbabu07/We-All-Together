const { USER_ROLES } = require('../constants/userConstants')
const AppError = require('../utils/appError')

const requireString = (body, fieldName, label = fieldName) => {
  const value = body[fieldName]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${label} is required.`, 400)
  }

  return value.trim()
}

const optionalString = (body, fieldName) =>
  typeof body[fieldName] === 'string' ? body[fieldName].trim() : ''

const validateBroadcastNotification = (body) => {
  const role = optionalString(body, 'role')

  if (role && !Object.values(USER_ROLES).includes(role)) {
    throw new AppError('Notification role is invalid.', 400)
  }

  return {
    link: optionalString(body, 'link'),
    message: requireString(body, 'message', 'Message'),
    role,
    title: requireString(body, 'title', 'Title'),
    type: optionalString(body, 'type') || 'general',
  }
}

const validateSendNotification = (body) => {
  const role = optionalString(body, 'role')
  const channel = optionalString(body, 'channel') || 'sms'
  const allowedChannels = ['sms', 'whatsapp', 'both']

  if (role && !Object.values(USER_ROLES).includes(role)) {
    throw new AppError('Notification role is invalid.', 400)
  }

  if (!allowedChannels.includes(channel)) {
    throw new AppError('Notification channel is invalid.', 400)
  }

  return {
    channel,
    link: optionalString(body, 'link') || '/notifications',
    message: requireString(body, 'message', 'Message'),
    role,
    title: requireString(body, 'title', 'Title'),
  }
}

module.exports = {
  validateBroadcastNotification,
  validateSendNotification,
}
