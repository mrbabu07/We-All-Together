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

const registerForTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }
  if (!tour.registrationOpen) {
    throw new AppError('Tour registration is closed.', 403)
  }

  const alreadyRegistered = tour.participants.some(
    (row) => row.member.toString() === req.user._id.toString(),
  )
  const alreadyWaiting = tour.waitlist.some(
    (row) => row.member.toString() === req.user._id.toString(),
  )

  if (alreadyRegistered || alreadyWaiting) {
    throw new AppError('You already registered for this tour.', 400)
  }

  const capacityReached =
    Number(tour.seatCapacity || 0) > 0 && tour.participants.length >= Number(tour.seatCapacity)

  if (capacityReached) {
    tour.waitlist.push({ joinedAt: new Date(), member: req.user._id })
  } else {
    tour.participants.push({
      amountDue: tour.tourFee || 0,
      joinedAt: new Date(),
      member: req.user._id,
      status: 'interested',
    })
  }

  await tour.save()
  await recordAuditLog({
    action: capacityReached ? 'tour.waitlist.join' : 'tour.register',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: { title: tour.title },
  })

  res.status(200).json({
    success: true,
    message: capacityReached ? 'Added to tour waitlist.' : 'Tour registration saved.',
    data: { item: tour, waitlisted: capacityReached },
  })
})

const submitFeedback = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id)
  const rating = Number(req.body.rating)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5.', 400)
  }

  const existing = tour.feedback.find(
    (row) => row.member.toString() === req.user._id.toString(),
  )

  if (existing) {
    existing.rating = rating
    existing.comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : ''
    existing.createdAt = new Date()
  } else {
    tour.feedback.push({
      comment: typeof req.body.comment === 'string' ? req.body.comment.trim() : '',
      createdAt: new Date(),
      member: req.user._id,
      rating,
    })
  }

  await tour.save()

  res.status(200).json({
    success: true,
    message: 'Tour feedback saved successfully.',
    data: { item: tour },
  })
})

module.exports = {
  ...controllers,
  getRsvps,
  registerForTour,
  submitRsvp,
  submitFeedback,
  updateParticipants,
}
