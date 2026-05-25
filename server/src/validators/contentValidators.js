const { AUDIENCES, ITEM_STATUSES } = require('../constants/contentConstants')
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

const readAudience = (body, fallback = AUDIENCES.PUBLIC) => {
  if (!body.audience) {
    return fallback
  }

  if (!Object.values(AUDIENCES).includes(body.audience)) {
    throw new AppError('Audience must be public or members.', 400)
  }

  return body.audience
}

const readStatus = (body, fallback = ITEM_STATUSES.PLANNED) => {
  if (!body.status) {
    return fallback
  }

  if (!Object.values(ITEM_STATUSES).includes(body.status)) {
    throw new AppError('Status is invalid.', 400)
  }

  return body.status
}

const readDate = (body, fieldName, label = fieldName) => {
  const date = new Date(requireString(body, fieldName, label))

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${label} must be valid.`, 400)
  }

  return date
}

const readNumber = (body, fieldName, label = fieldName, fallback = 0) => {
  if (body[fieldName] === undefined || body[fieldName] === '') {
    return fallback
  }

  const value = Number(body[fieldName])

  if (!Number.isFinite(value) || value < 0) {
    throw new AppError(`${label} must be zero or greater.`, 400)
  }

  return value
}

const validateNotice = (body) => ({
  title: requireString(body, 'title', 'Title'),
  body: requireString(body, 'body', 'Body'),
  audience: readAudience(body, AUDIENCES.PUBLIC),
  pinned: Boolean(body.pinned),
})

const validateMeeting = (body) => ({
  title: requireString(body, 'title', 'Title'),
  agenda: requireString(body, 'agenda', 'Agenda'),
  meetingDate: readDate(body, 'meetingDate', 'Meeting date'),
  location: requireString(body, 'location', 'Location'),
  audience: readAudience(body, AUDIENCES.MEMBERS),
})

const validateTour = (body) => {
  const startDate = readDate(body, 'startDate', 'Start date')
  const endDate = readDate(body, 'endDate', 'End date')

  if (endDate < startDate) {
    throw new AppError('End date cannot be before start date.', 400)
  }

  return {
    title: requireString(body, 'title', 'Title'),
    destination: requireString(body, 'destination', 'Destination'),
    startDate,
    endDate,
    budget: readNumber(body, 'budget', 'Budget'),
    details: optionalString(body, 'details'),
    audience: readAudience(body, AUDIENCES.MEMBERS),
    status: readStatus(body),
  }
}

const validateActivity = (body) => ({
  title: requireString(body, 'title', 'Title'),
  category: requireString(body, 'category', 'Category'),
  description: requireString(body, 'description', 'Description'),
  activityDate: readDate(body, 'activityDate', 'Activity date'),
  participantsCount: readNumber(body, 'participantsCount', 'Participants count'),
  audience: readAudience(body, AUDIENCES.PUBLIC),
  status: readStatus(body),
})

const validateRule = (body) => ({
  title: requireString(body, 'title', 'Title'),
  description: requireString(body, 'description', 'Description'),
  audience: readAudience(body, AUDIENCES.MEMBERS),
  order: readNumber(body, 'order', 'Order'),
})

module.exports = {
  validateActivity,
  validateMeeting,
  validateNotice,
  validateRule,
  validateTour,
}
