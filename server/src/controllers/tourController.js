const Tour = require('../models/Tour')
const GalleryItem = require('../models/GalleryItem')
const createContentController = require('./contentControllerFactory')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { createNotification } = require('../services/notificationService')
const { sendManualMessageNotification } = require('../services/messageNotificationService')
const { getSettings } = require('../services/settingsService')
const {
  validateRsvp,
  validateTour,
  validateTourExpense,
  validateTourFeedback,
  validateTourParticipants,
  validateTourRegistration,
} = require('../validators/contentValidators')

const controllers = createContentController({
  model: Tour,
  validate: validateTour,
  sort: { startDate: 1 },
  name: 'Tour',
})

const populateTour = (query) =>
  query
    .populate('participants.member', 'name phone profilePhotoUrl')
    .populate('waitlist.member', 'name phone profilePhotoUrl')
    .populate('feedback.member', 'name phone profilePhotoUrl')
    .populate('expenses.addedBy', 'name phone profilePhotoUrl')

const getPublicItems = asyncHandler(async (req, res) => {
  const items = await populateTour(Tour.find({ audience: 'public' }).sort({ startDate: 1 }))

  res.status(200).json({
    success: true,
    message: 'Tour loaded successfully.',
    data: { items },
  })
})

const getMemberItems = asyncHandler(async (req, res) => {
  const items = await populateTour(Tour.find().sort({ startDate: 1 }))

  res.status(200).json({
    success: true,
    message: 'Tour loaded successfully.',
    data: { items },
  })
})

const activeParticipantCount = (tour) =>
  tour.participants.filter((row) => row.status !== 'cancelled').length

const getOpenSeatCount = (tour) => {
  const capacity = Number(tour.seatCapacity || 0)

  if (capacity <= 0) {
    return tour.waitlist.length
  }

  return Math.max(capacity - activeParticipantCount(tour), 0)
}

const notifyTourMember = async ({ actor, message, title, tour, user }) =>
  createNotification({
    createdBy: actor,
    link: '/member?tab=updates',
    message,
    title,
    type: 'tour',
    user,
  })

const promoteWaitlist = async (tour, actor) => {
  if (!tour.registrationOpen || !tour.waitlist.length) {
    return []
  }

  const promoted = []
  let openSeats = getOpenSeatCount(tour)

  while (openSeats > 0 && tour.waitlist.length) {
    const next = tour.waitlist.shift()
    const memberId = next.member?._id || next.member
    const alreadyActive = tour.participants.some(
      (row) =>
        String(row.member?._id || row.member) === String(memberId) &&
        row.status !== 'cancelled',
    )

    if (alreadyActive) {
      continue
    }

    tour.participants.push({
      amountDue: tour.tourFee || 0,
      joinedAt: new Date(),
      member: memberId,
      paidAmount: 0,
      status: 'interested',
    })
    promoted.push(memberId)
    openSeats -= 1
  }

  await Promise.all(
    promoted.map((memberId) =>
      notifyTourMember({
        actor,
        message: `A seat opened for ${tour.title}. Your waitlist entry is now registered.`,
        title: 'Tour waitlist promoted',
        tour,
        user: memberId,
      }),
    ),
  )

  return promoted
}

const buildTourSummary = (tour) => {
  const totalExpense = tour.expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const activeCount = activeParticipantCount(tour)

  return {
    activeParticipantCount: activeCount,
    openSeats: getOpenSeatCount(tour),
    perHeadCost: activeCount ? Math.ceil(totalExpense / activeCount) : 0,
    totalExpense,
    totalPaid: tour.participants.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0),
  }
}

const updateParticipants = asyncHandler(async (req, res) => {
  const payload = validateTourParticipants(req.body)
  const tour = await Tour.findById(req.params.id)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }

  tour.participants = payload.participants
  const promoted = await promoteWaitlist(tour, req.user)
  await tour.save()
  await recordAuditLog({
    action: 'tour.participants.update',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: {
      participantCount: tour.participants.length,
      promotedCount: promoted.length,
      title: tour.title,
    },
  })
  const populatedTour = await populateTour(Tour.findById(tour._id))

  res.status(200).json({
    success: true,
    message: 'Tour participants updated successfully.',
    data: {
      item: populatedTour,
      promotedCount: promoted.length,
      summary: buildTourSummary(populatedTour),
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
  const payload = validateTourFeedback(req.body)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }
  if (tour.status !== 'completed') {
    throw new AppError('Feedback can be submitted after the tour is completed.', 400)
  }

  const existing = tour.feedback.find(
    (row) => row.member.toString() === req.user._id.toString(),
  )

  if (existing) {
    existing.rating = payload.rating
    existing.comment = payload.comment
    existing.createdAt = new Date()
  } else {
    tour.feedback.push({
      comment: payload.comment,
      createdAt: new Date(),
      member: req.user._id,
      rating: payload.rating,
    })
  }

  await tour.save()
  await recordAuditLog({
    action: 'tour.feedback.submit',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: { rating: payload.rating, title: tour.title },
  })

  res.status(200).json({
    success: true,
    message: 'Tour feedback saved successfully.',
    data: { item: tour },
  })
})

const updateRegistration = asyncHandler(async (req, res) => {
  const payload = validateTourRegistration(req.body)
  const tour = await Tour.findById(req.params.id)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }

  const wasRegistrationOpen = tour.registrationOpen
  tour.registrationOpen = payload.registrationOpen
  tour.seatCapacity = payload.seatCapacity
  tour.tourFee = payload.tourFee
  const promoted = await promoteWaitlist(tour, req.user)
  await tour.save()
  await recordAuditLog({
    action: 'tour.registration.update',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: {
      promotedCount: promoted.length,
      registrationOpen: tour.registrationOpen,
      seatCapacity: tour.seatCapacity,
      title: tour.title,
      tourFee: tour.tourFee,
    },
  })
  const settings = await getSettings()
  if (
    !wasRegistrationOpen &&
    tour.registrationOpen &&
    settings.notificationSettings?.tourRegistrationOpenEnabled
  ) {
    await sendManualMessageNotification({
      actor: req.user,
      channel: 'in_app',
      link: '/member?tab=tours',
      message: `${tour.title} tour registration is now open.`,
      recipientMode: 'active',
      title: 'Tour registration open',
      type: 'tour',
    })
  }
  const populatedTour = await populateTour(Tour.findById(tour._id))

  res.status(200).json({
    success: true,
    message: 'Tour registration settings updated successfully.',
    data: {
      item: populatedTour,
      promotedCount: promoted.length,
      summary: buildTourSummary(populatedTour),
    },
  })
})

const addExpense = asyncHandler(async (req, res) => {
  const payload = validateTourExpense(req.body)
  const tour = await Tour.findById(req.params.id)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }

  tour.expenses.push({
    ...payload,
    addedBy: req.user._id,
  })
  await tour.save()
  await recordAuditLog({
    action: 'tour.expense.add',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: {
      amount: payload.amount,
      title: tour.title,
    },
  })
  const populatedTour = await populateTour(Tour.findById(tour._id))

  res.status(201).json({
    success: true,
    message: 'Tour expense added successfully.',
    data: { item: populatedTour, summary: buildTourSummary(populatedTour) },
  })
})

const deleteExpense = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }

  const expense = tour.expenses.id(req.params.expenseId)

  if (!expense) {
    throw new AppError('Tour expense not found.', 404)
  }

  expense.deleteOne()
  await tour.save()
  await recordAuditLog({
    action: 'tour.expense.delete',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: {
      expenseId: req.params.expenseId,
      title: tour.title,
    },
  })
  const populatedTour = await populateTour(Tour.findById(tour._id))

  res.status(200).json({
    success: true,
    message: 'Tour expense deleted successfully.',
    data: { item: populatedTour, summary: buildTourSummary(populatedTour) },
  })
})

const completeTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id)

  if (!tour) {
    throw new AppError('Tour not found.', 404)
  }

  tour.status = 'completed'
  tour.registrationOpen = false
  tour.completedAt = tour.completedAt || new Date()
  tour.galleryAlbum = tour.galleryAlbum || tour.title

  if (!tour.albumCreated && tour.imageUrl) {
    await GalleryItem.create({
      album: tour.galleryAlbum,
      audience: tour.audience,
      createdBy: req.user._id,
      description: `Auto-created album cover for ${tour.title}.`,
      imageUrl: tour.imageUrl,
      title: `${tour.title} album`,
      tourId: tour._id,
    })
  }
  tour.albumCreated = true

  await tour.save()
  await recordAuditLog({
    action: 'tour.complete',
    actor: req.user,
    entityId: tour._id,
    entityType: 'Tour',
    metadata: {
      galleryAlbum: tour.galleryAlbum,
      title: tour.title,
    },
  })
  const populatedTour = await populateTour(Tour.findById(tour._id))

  res.status(200).json({
    success: true,
    message: 'Tour marked complete successfully.',
    data: { item: populatedTour, summary: buildTourSummary(populatedTour) },
  })
})

module.exports = {
  ...controllers,
  addExpense,
  completeTour,
  deleteExpense,
  getMemberItems,
  getPublicItems,
  getRsvps,
  registerForTour,
  submitRsvp,
  submitFeedback,
  updateRegistration,
  updateParticipants,
}
