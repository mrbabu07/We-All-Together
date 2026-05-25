const Notice = require('../models/Notice')
const createContentController = require('./contentControllerFactory')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { validateNotice } = require('../validators/contentValidators')

const controllers = createContentController({
  model: Notice,
  validate: validateNotice,
  sort: { pinned: -1, createdAt: -1 },
  name: 'Notice',
})

const markNoticeRead = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id)

  if (!notice) {
    throw new AppError('Notice not found.', 404)
  }

  const alreadyRead = notice.readReceipts.some(
    (row) => row.user.toString() === req.user._id.toString(),
  )

  if (!alreadyRead) {
    notice.readReceipts.push({ readAt: new Date(), user: req.user._id })
    await notice.save()
  }

  res.status(200).json({
    success: true,
    message: 'Notice marked as read.',
    data: { item: notice },
  })
})

const reactToNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id)
  const type = req.body.type === 'love' ? 'love' : 'like'

  if (!notice) {
    throw new AppError('Notice not found.', 404)
  }

  const existing = notice.reactions.find(
    (row) => row.user.toString() === req.user._id.toString(),
  )

  if (existing) {
    if (existing.type === type) {
      notice.reactions = notice.reactions.filter(
        (row) => row.user.toString() !== req.user._id.toString(),
      )
    } else {
      existing.type = type
      existing.reactedAt = new Date()
    }
  } else {
    notice.reactions.push({ reactedAt: new Date(), type, user: req.user._id })
  }

  await notice.save()

  res.status(200).json({
    success: true,
    message: 'Notice reaction updated.',
    data: { item: notice },
  })
})

const addNoticeComment = asyncHandler(async (req, res) => {
  const body = typeof req.body.body === 'string' ? req.body.body.trim() : ''
  const notice = await Notice.findById(req.params.id)

  if (!notice) {
    throw new AppError('Notice not found.', 404)
  }
  if (!body) {
    throw new AppError('Comment is required.', 400)
  }

  notice.comments.push({ body, createdAt: new Date(), user: req.user._id })
  await notice.save()

  res.status(201).json({
    success: true,
    message: 'Notice comment added.',
    data: { item: notice },
  })
})

const archiveNotices = asyncHandler(async (req, res) => {
  const from = req.body.from ? new Date(req.body.from) : null
  const to = req.body.to ? new Date(req.body.to) : null
  const filter = {}

  if (from || to) {
    filter.createdAt = {}
    if (from) {
      filter.createdAt.$gte = from
    }
    if (to) {
      filter.createdAt.$lte = to
    }
  }

  const result = await Notice.updateMany(filter, { $set: { archivedAt: new Date() } })

  await recordAuditLog({
    action: 'notice.archive.bulk',
    actor: req.user,
    entityType: 'Notice',
    metadata: { modifiedCount: result.modifiedCount },
  })

  res.status(200).json({
    success: true,
    message: 'Notices archived successfully.',
    data: { modifiedCount: result.modifiedCount },
  })
})

module.exports = {
  ...controllers,
  addNoticeComment,
  archiveNotices,
  markNoticeRead,
  reactToNotice,
}
