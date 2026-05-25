const Tour = require('../models/Tour')
const createContentController = require('./contentControllerFactory')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const {
  validateRsvp,
  validateTour,
  validateTourParticipants,
} = require('../validators/contentValidators')

const controllers = createContentController({
  model: Tour,
  validate: validateTour,
  sort: { startDate: 1 },
  name: 'Tour',
})

const updateParticipants = asyncHandler(async (req, res) => {
  const payload = validateTourParticipants(req.body)
  const tour = await Tour.findById(req.params.id)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }

  tour.participants = payload.participants
  await tour.save()
  await recordAuditLog({
    action: 'tour.participants.update',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: {
      participantCount: tour.participants.length,
      title: tour.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Tour participants updated successfully.',
    data: {
      item: tour,
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
  const tour = await Tour.findById(req.params.id)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }

  const existing = tour.rsvp.find((row) => String(row.memberId) === String(req.user._id))

  if (existing) {
    existing.status = payload.status
    existing.timestamp = new Date()
  } else {
    tour.rsvp.push({
      memberId: req.user._id,
      status: payload.status,
      timestamp: new Date(),
    })
  }

  await tour.save()
  await recordAuditLog({
    action: 'tour.rsvp.update',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: {
      status: payload.status,
      title: tour.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Tour RSVP saved successfully.',
    data: {
      item: tour,
    },
  })
})

const getRsvps = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id).populate(
    'rsvp.memberId',
    'name phone profilePhotoUrl',
  )

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }

  res.status(200).json({
    success: true,
    message: 'Tour RSVP list loaded successfully.',
    data: {
      counts: rsvpCounts(tour.rsvp),
      rsvp: tour.rsvp,
    },
  })
})

module.exports = {
  ...controllers,
  getRsvps,
  submitRsvp,
  updateParticipants,
}
