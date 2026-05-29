const Meeting = require('../models/Meeting')
const createContentController = require('./contentControllerFactory')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { createNotification } = require('../services/notificationService')
const QRCode = require('qrcode')
const {
  validateMeeting,
  validateMeetingAdvanced,
  validateMeetingAttendance,
  validateMeetingCheckIn,
  validateMeetingRecap,
  validateRsvp,
} = require('../validators/contentValidators')

const controllers = createContentController({
  model: Meeting,
  validate: validateMeeting,
  sort: { meetingDate: 1 },
  name: 'Meeting',
})

const updateAttendance = asyncHandler(async (req, res) => {
  const payload = validateMeetingAttendance(req.body)
  const meeting = await Meeting.findById(req.params.id)

  if (!meeting) {
    throw new AppError('Meeting not found.', 404)
  }

  meeting.minutes = payload.minutes
  meeting.attendance = payload.attendance
  await meeting.save()
  await recordAuditLog({
    action: 'meeting.attendance.update',
    actor: req.user,
    entityId: meeting._id,
    entityType: 'Meeting',
    metadata: {
      attendanceCount: meeting.attendance.length,
      title: meeting.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Meeting attendance updated successfully.',
    data: {
      item: meeting,
    },
  })
})

const rsvpCounts = (rows = []) =>
  rows.reduce(
    (summary, row) => ({
      ...summary,
      [row.status]: (summary[row.status] || 0) + 1,
    }),
    { going: 0, maybe: 0, not_going: 0 },
  )

const meetingAttendanceCode = (meeting) =>
  meeting.attendanceMode?.otp || String(meeting._id).slice(-6).toUpperCase()

const ensureQrCode = async (attendanceMode, code) => {
  if (attendanceMode?.method !== 'qr') {
    return attendanceMode?.qrCodeDataUrl || ''
  }

  if (attendanceMode?.qrCodeDataUrl) {
    return attendanceMode.qrCodeDataUrl
  }

  return QRCode.toDataURL(code, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 220,
  })
}

const upsertAttendance = (meeting, memberId, status = 'present', note = '') => {
  const existing = meeting.attendance.find(
    (row) => String(row.member?._id || row.member) === String(memberId),
  )

  if (existing) {
    existing.status = status
    existing.note = note
    existing.recordedAt = new Date()
    return
  }

  meeting.attendance.push({
    member: memberId,
    note,
    recordedAt: new Date(),
    status,
  })
}

const submitRsvp = asyncHandler(async (req, res) => {
  const payload = validateRsvp(req.body)
  const meeting = await Meeting.findById(req.params.id)

  if (!meeting) {
    throw new AppError('Meeting not found.', 404)
  }

  const existing = meeting.rsvp.find((row) => String(row.memberId) === String(req.user._id))

  if (existing) {
    existing.status = payload.status
    existing.timestamp = new Date()
  } else {
    meeting.rsvp.push({
      memberId: req.user._id,
      status: payload.status,
      timestamp: new Date(),
    })
  }

  await meeting.save()
  await recordAuditLog({
    action: 'meeting.rsvp.update',
    actor: req.user,
    entityId: meeting._id,
    entityType: 'Meeting',
    metadata: {
      status: payload.status,
      title: meeting.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Meeting RSVP saved successfully.',
    data: {
      item: meeting,
    },
  })
})

const getRsvps = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id).populate(
    'rsvp.memberId',
    'name phone profilePhotoUrl',
  )

  if (!meeting) {
    throw new AppError('Meeting not found.', 404)
  }

  res.status(200).json({
    success: true,
    message: 'Meeting RSVP list loaded successfully.',
    data: {
      counts: rsvpCounts(meeting.rsvp),
      rsvp: meeting.rsvp,
    },
  })
})

const updateAdvancedMeeting = asyncHandler(async (req, res) => {
  const payload = validateMeetingAdvanced(req.body)
  const meeting = await Meeting.findById(req.params.id)

  if (!meeting) {
    throw new AppError('Meeting not found.', 404)
  }

  meeting.agendaItems = payload.agendaItems
  meeting.actionItems = payload.actionItems
  meeting.minutes = payload.minutes
  meeting.minutesRichText = payload.minutesRichText
  meeting.minutesStatus = payload.minutesStatus
  meeting.minutesPublishedAt =
    payload.minutesStatus === 'published' ? meeting.minutesPublishedAt || new Date() : null

  const nextAttendanceMode = {
    ...payload.attendanceMode,
  }
  if (nextAttendanceMode.active) {
    const code = nextAttendanceMode.otp || meetingAttendanceCode(meeting)
    nextAttendanceMode.otp = code
    nextAttendanceMode.openedAt = meeting.attendanceMode?.active
      ? meeting.attendanceMode.openedAt || nextAttendanceMode.openedAt
      : nextAttendanceMode.openedAt
    nextAttendanceMode.qrCodeDataUrl =
      nextAttendanceMode.qrCodeDataUrl || (await ensureQrCode(nextAttendanceMode, code))
  } else {
    nextAttendanceMode.closedAt = meeting.attendanceMode?.active
      ? nextAttendanceMode.closedAt
      : meeting.attendanceMode?.closedAt || nextAttendanceMode.closedAt
  }
  meeting.attendanceMode = nextAttendanceMode

  await meeting.save()
  await recordAuditLog({
    action: 'meeting.advanced.update',
    actor: req.user,
    entityId: meeting._id,
    entityType: 'Meeting',
    metadata: {
      actionItemCount: meeting.actionItems.length,
      agendaCount: meeting.agendaItems.length,
      title: meeting.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Meeting advanced settings saved successfully.',
    data: { item: meeting },
  })
})

const checkInMeeting = asyncHandler(async (req, res) => {
  const payload = validateMeetingCheckIn(req.body)
  const meeting = await Meeting.findById(req.params.id)

  if (!meeting) {
    throw new AppError('Meeting not found.', 404)
  }

  if (!meeting.attendanceMode?.active) {
    throw new AppError('Attendance is not open for this meeting.', 403)
  }

  if (
    ['otp', 'qr'].includes(meeting.attendanceMode.method) &&
    payload.code !== meetingAttendanceCode(meeting)
  ) {
    throw new AppError('Attendance code is invalid.', 400)
  }

  upsertAttendance(meeting, req.user._id, 'present', 'Self check-in')
  await meeting.save()
  await recordAuditLog({
    action: 'meeting.attendance.checkin',
    actor: req.user,
    entityId: meeting._id,
    entityType: 'Meeting',
    metadata: {
      title: meeting.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Meeting attendance checked in successfully.',
    data: { item: meeting },
  })
})

const publishMeetingRecap = asyncHandler(async (req, res) => {
  const payload = validateMeetingRecap(req.body)
  const meeting = await Meeting.findById(req.params.id)

  if (!meeting) {
    throw new AppError('Meeting not found.', 404)
  }

  const recipientIds = [
    ...new Set(
      [
        ...meeting.attendance
          .filter((row) => row.status === 'present')
          .map((row) => String(row.member?._id || row.member)),
        ...meeting.rsvp
          .filter((row) => row.status === 'going')
          .map((row) => String(row.memberId?._id || row.memberId)),
      ].filter(Boolean),
    ),
  ]
  const message =
    payload.message ||
    meeting.minutes ||
    meeting.minutesRichText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
    'Meeting recap is now available.'

  await Promise.all(
    recipientIds.map((userId) =>
      createNotification({
        createdBy: req.user,
        link: '/member?tab=updates',
        message,
        title: `Meeting recap: ${meeting.title}`,
        type: 'meeting',
        user: userId,
      }),
    ),
  )

  meeting.recapMessage = message
  meeting.recapSentAt = new Date()
  meeting.recapSentBy = req.user._id
  await meeting.save()
  await recordAuditLog({
    action: 'meeting.recap.publish',
    actor: req.user,
    entityId: meeting._id,
    entityType: 'Meeting',
    metadata: {
      recipientCount: recipientIds.length,
      title: meeting.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Meeting recap sent successfully.',
    data: { item: meeting, recipientCount: recipientIds.length },
  })
})

module.exports = {
  ...controllers,
  checkInMeeting,
  getRsvps,
  publishMeetingRecap,
  submitRsvp,
  updateAdvancedMeeting,
  updateAttendance,
}
