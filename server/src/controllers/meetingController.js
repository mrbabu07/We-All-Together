const Meeting = require('../models/Meeting')
const createContentController = require('./contentControllerFactory')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const {
  validateMeeting,
  validateMeetingAttendance,
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
  const meeting = await Meeting.findById(req.params.id)

  if (!meeting) {
    throw new AppError('Meeting not found.', 404)
  }

  if (Array.isArray(req.body.agendaItems)) {
    meeting.agendaItems = req.body.agendaItems.map((item, index) => ({
      completed: Boolean(item.completed),
      order: Number(item.order ?? index),
      title: typeof item.title === 'string' ? item.title.trim() : '',
    }))
  }

  if (Array.isArray(req.body.actionItems)) {
    meeting.actionItems = req.body.actionItems.map((item) => ({
      assignedTo: item.assignedTo || null,
      completed: Boolean(item.completed),
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      title: typeof item.title === 'string' ? item.title.trim() : '',
    }))
  }

  if (typeof req.body.minutesRichText === 'string') {
    meeting.minutesRichText = req.body.minutesRichText
  }
  if (['closed', 'qr', 'otp'].includes(req.body.attendanceMode)) {
    meeting.attendanceMode = {
      active: req.body.attendanceMode !== 'closed',
      otp:
        req.body.attendanceMode === 'otp' && typeof req.body.attendanceOtp === 'string'
          ? req.body.attendanceOtp.trim()
          : '',
      qrCodeDataUrl:
        typeof req.body.attendanceQrCodeDataUrl === 'string'
          ? req.body.attendanceQrCodeDataUrl.trim()
          : meeting.attendanceMode?.qrCodeDataUrl || '',
    }
  }

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

module.exports = {
  ...controllers,
  getRsvps,
  submitRsvp,
  updateAdvancedMeeting,
  updateAttendance,
}
