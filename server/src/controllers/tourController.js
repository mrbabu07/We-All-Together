const Tour = require('../models/Tour')
const createContentController = require('./contentControllerFactory')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { validateTour, validateTourParticipants } = require('../validators/contentValidators')

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

module.exports = {
  ...controllers,
  updateParticipants,
}
