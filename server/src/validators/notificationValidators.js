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

const normalizeStringList = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))]
}

const parseScheduledFor = (value) => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new AppError('Scheduled date is invalid.', 400)
  }

  return date
}

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
  const channel = optionalString(body, 'channel') || 'in_app'
  const recipientMode = optionalString(body, 'recipientMode') || (role || 'all')
  const allowedChannels = ['in_app', 'sms', 'whatsapp', 'both']
  const allowedRecipientModes = [
    'active',
    'all',
    'overdue',
    'specific',
    ...Object.values(USER_ROLES),
  ]

  if (role && !Object.values(USER_ROLES).includes(role)) {
    throw new AppError('Notification role is invalid.', 400)
  }

  if (!allowedChannels.includes(channel)) {
    throw new AppError('Notification channel is invalid.', 400)
  }

  if (!allowedRecipientModes.includes(recipientMode)) {
    throw new AppError('Notification recipient mode is invalid.', 400)
  }

  const userIds = normalizeStringList(body.userIds)
  if (recipientMode === 'specific' && !userIds.length) {
    throw new AppError('Select at least one notification recipient.', 400)
  }

  return {
    channel,
    link: optionalString(body, 'link') || '/notifications',
    message: requireString(body, 'message', 'Message'),
    recipientMode,
    role,
    scheduledFor: parseScheduledFor(body.scheduledFor),
    title: requireString(body, 'title', 'Title'),
    type: optionalString(body, 'type') || 'announcement',
    userIds,
  }
}

module.exports = {
  validateBroadcastNotification,
  validateSendNotification,
}
