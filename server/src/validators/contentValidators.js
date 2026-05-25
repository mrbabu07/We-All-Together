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

const readObjectId = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${label} is required.`, 400)
  }

  return value.trim()
}

const validateNotice = (body) => ({
  title: requireString(body, 'title', 'Title'),
  body: requireString(body, 'body', 'Body'),
  audience: readAudience(body, AUDIENCES.PUBLIC),
  archivedAt: body.archivedAt ? new Date(body.archivedAt) : null,
  category: optionalString(body, 'category') || 'General',
  expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  imageUrl: optionalString(body, 'imageUrl'),
  pinned: Boolean(body.pinned),
  richBody: optionalString(body, 'richBody'),
  scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
})

const validateMeeting = (body) => ({
  title: requireString(body, 'title', 'Title'),
  agenda: requireString(body, 'agenda', 'Agenda'),
  meetingDate: readDate(body, 'meetingDate', 'Meeting date'),
  location: requireString(body, 'location', 'Location'),
  audience: readAudience(body, AUDIENCES.MEMBERS),
  agendaItems: Array.isArray(body.agendaItems)
    ? body.agendaItems.map((item, index) => ({
        completed: Boolean(item.completed),
        order: Number(item.order ?? index),
        title: typeof item.title === 'string' ? item.title.trim() : '',
      }))
    : [],
  attendanceMode: {
    active: ['qr', 'otp'].includes(body.attendanceMode),
    otp: body.attendanceMode === 'otp' ? optionalString(body, 'attendanceOtp') : '',
    qrCodeDataUrl: optionalString(body, 'attendanceQrCodeDataUrl'),
  },
  imageUrl: optionalString(body, 'imageUrl'),
  minutesRichText: optionalString(body, 'minutesRichText'),
})

const validateMeetingAttendance = (body) => {
  const attendance = Array.isArray(body.attendance) ? body.attendance : []
  const validStatuses = ['present', 'absent', 'excused']

  return {
    attendance: attendance.map((item) => {
      const status = typeof item.status === 'string' ? item.status : 'present'

      if (!validStatuses.includes(status)) {
        throw new AppError('Attendance status is invalid.', 400)
      }

      return {
        member: readObjectId(item.member, 'Member'),
        note: typeof item.note === 'string' ? item.note.trim() : '',
        recordedAt: new Date(),
        status,
      }
    }),
    minutes: optionalString(body, 'minutes'),
  }
}

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
    imageUrl: optionalString(body, 'imageUrl'),
    registrationOpen:
      body.registrationOpen === undefined ? true : Boolean(body.registrationOpen),
    seatCapacity: readNumber(body, 'seatCapacity', 'Seat capacity'),
    status: readStatus(body),
    tourFee: readNumber(body, 'tourFee', 'Tour fee'),
  }
}

const validateTourParticipants = (body) => {
  const participants = Array.isArray(body.participants) ? body.participants : []
  const validStatuses = ['interested', 'confirmed', 'paid', 'cancelled']

  return {
    participants: participants.map((item) => {
      const status = typeof item.status === 'string' ? item.status : 'interested'

      if (!validStatuses.includes(status)) {
        throw new AppError('Tour participant status is invalid.', 400)
      }

      return {
        amountDue: readNumber(item, 'amountDue', 'Amount due'),
        joinedAt: item.joinedAt ? new Date(item.joinedAt) : new Date(),
        member: readObjectId(item.member, 'Member'),
        note: typeof item.note === 'string' ? item.note.trim() : '',
        paidAmount: readNumber(item, 'paidAmount', 'Paid amount'),
        status,
      }
    }),
  }
}

const validateRsvp = (body) => {
  const validStatuses = ['going', 'not_going', 'maybe']
  const status = typeof body.status === 'string' ? body.status : ''

  if (!validStatuses.includes(status)) {
    throw new AppError('RSVP status is invalid.', 400)
  }

  return {
    status,
  }
}

const validateActivity = (body) => ({
  title: requireString(body, 'title', 'Title'),
  category: requireString(body, 'category', 'Category'),
  description: requireString(body, 'description', 'Description'),
  activityDate: readDate(body, 'activityDate', 'Activity date'),
  participantsCount: readNumber(body, 'participantsCount', 'Participants count'),
  audience: readAudience(body, AUDIENCES.PUBLIC),
  imageUrl: optionalString(body, 'imageUrl'),
  status: readStatus(body),
})

const validateRule = (body) => ({
  title: requireString(body, 'title', 'Title'),
  description: requireString(body, 'description', 'Description'),
  audience: readAudience(body, AUDIENCES.MEMBERS),
  imageUrl: optionalString(body, 'imageUrl'),
  order: readNumber(body, 'order', 'Order'),
})

module.exports = {
  validateActivity,
  validateMeeting,
  validateMeetingAttendance,
  validateNotice,
  validateRule,
  validateRsvp,
  validateTour,
  validateTourParticipants,
}
