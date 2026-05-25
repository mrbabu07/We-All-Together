const Meeting = require('../models/Meeting')
const createContentController = require('./contentControllerFactory')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const {
  validateMeeting,
  validateMeetingAttendance,
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

module.exports = {
  ...controllers,
  updateAttendance,
}
