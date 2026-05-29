const { AUDIENCES } = require('../constants/contentConstants')
const { USER_ROLES } = require('../constants/userConstants')
const GalleryItem = require('../models/GalleryItem')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { createNotification } = require('../services/notificationService')
const {
  validateBulkGalleryModeration,
  validateGalleryAlbumVisibility,
  validateGalleryItem,
  validateGalleryModeration,
  validateGalleryReorder,
} = require('../validators/communityValidators')

const populateGallery = (query) =>
  query
    .populate('createdBy', 'name phone role profilePhotoUrl')
    .populate('moderatedBy', 'name phone role profilePhotoUrl')

const canManageGalleryItem = (user, item) =>
  user.role === USER_ROLES.ADMIN || item.createdBy.toString() === user._id.toString()

const canModerateGallery = (user) =>
  [USER_ROLES.ADMIN, USER_ROLES.MODERATOR].includes(user.role)

const gallerySort = { album: 1, displayOrder: 1, createdAt: -1 }

const notifyUploader = async ({ actor, item, message, title }) =>
  createNotification({
    createdBy: actor,
    link: '/member?tab=gallery',
    message,
    title,
    type: 'gallery',
    user: item.createdBy,
  })

const getPublicGalleryItems = asyncHandler(async (req, res) => {
  const items = await populateGallery(
    GalleryItem.find({
      albumVisible: true,
      audience: AUDIENCES.PUBLIC,
      moderationStatus: 'approved',
    }).sort(gallerySort),
  )

  res.status(200).json({
    success: true,
    message: 'Gallery loaded successfully.',
    data: {
      items,
    },
  })
})

const getMemberGalleryItems = asyncHandler(async (req, res) => {
  const filter = canModerateGallery(req.user)
    ? {}
    : {
        $or: [
          { albumVisible: true, moderationStatus: 'approved' },
          { createdBy: req.user._id },
        ],
      }
  const items = await populateGallery(GalleryItem.find(filter).sort(gallerySort))

  res.status(200).json({
    success: true,
    message: 'Gallery loaded successfully.',
    data: {
      items,
    },
  })
})

const createGalleryItem = asyncHandler(async (req, res) => {
  const payload = validateGalleryItem(req.body)
  const moderationStatus = canModerateGallery(req.user)
    ? payload.moderationStatus === 'pending'
      ? 'approved'
      : payload.moderationStatus
    : 'pending'
  const item = await GalleryItem.create({
    ...payload,
    moderatedAt: moderationStatus === 'approved' ? new Date() : null,
    moderatedBy: moderationStatus === 'approved' ? req.user._id : null,
    moderationNote: '',
    moderationStatus,
    createdBy: req.user._id,
  })
  await recordAuditLog({
    action: 'gallery.create',
    actor: req.user,
    entityId: item._id,
    entityType: 'GalleryItem',
    metadata: {
      audience: item.audience,
      album: item.album,
      status: item.moderationStatus,
      title: item.title,
    },
  })

  const populatedItem = await populateGallery(GalleryItem.findById(item._id))

  res.status(201).json({
    success: true,
    message: 'Gallery item created successfully.',
    data: {
      item: populatedItem,
    },
  })
})

const updateGalleryItem = asyncHandler(async (req, res) => {
  const payload = validateGalleryItem(req.body)
  const item = await GalleryItem.findById(req.params.id)

  if (!item) {
    throw new AppError('Gallery item not found.', 404)
  }

  if (!canManageGalleryItem(req.user, item)) {
    throw new AppError('You can only update gallery items you manage.', 403)
  }

  const previousStatus = item.moderationStatus
  Object.assign(item, payload)
  if (canModerateGallery(req.user) && req.body.moderationStatus === undefined) {
    item.moderationStatus = previousStatus
  } else if (!canModerateGallery(req.user)) {
    item.moderationStatus = 'pending'
    item.moderationNote = ''
    item.moderatedAt = null
    item.moderatedBy = null
  }
  await item.save()
  await recordAuditLog({
    action: 'gallery.update',
    actor: req.user,
    entityId: item._id,
    entityType: 'GalleryItem',
    metadata: {
      audience: item.audience,
      album: item.album,
      status: item.moderationStatus,
      title: item.title,
    },
  })

  const populatedItem = await populateGallery(GalleryItem.findById(item._id))

  res.status(200).json({
    success: true,
    message: 'Gallery item updated successfully.',
    data: {
      item: populatedItem,
    },
  })
})

const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await GalleryItem.findById(req.params.id)

  if (!item) {
    throw new AppError('Gallery item not found.', 404)
  }

  if (!canManageGalleryItem(req.user, item)) {
    throw new AppError('You can only delete gallery items you manage.', 403)
  }

  await item.deleteOne()
  await recordAuditLog({
    action: 'gallery.delete',
    actor: req.user,
    entityId: req.params.id,
    entityType: 'GalleryItem',
    metadata: {
      audience: item.audience,
      title: item.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Gallery item deleted successfully.',
    data: {
      id: req.params.id,
    },
  })
})

const moderateGalleryItem = asyncHandler(async (req, res) => {
  const payload = validateGalleryModeration(req.body)
  const item = await GalleryItem.findById(req.params.id)

  if (!item) {
    throw new AppError('Gallery item not found.', 404)
  }

  item.moderationStatus = payload.status
  item.moderationNote = payload.note
  item.moderatedAt = new Date()
  item.moderatedBy = req.user._id
  await item.save()
  await recordAuditLog({
    action: 'gallery.moderate',
    actor: req.user,
    entityId: item._id,
    entityType: 'GalleryItem',
    metadata: {
      album: item.album,
      status: payload.status,
      title: item.title,
    },
  })

  if (payload.status === 'approved') {
    await notifyUploader({
      actor: req.user,
      item,
      message: `Your gallery photo "${item.title}" has been approved.`,
      title: 'Gallery photo approved',
    })
  }
  if (payload.status === 'rejected') {
    await notifyUploader({
      actor: req.user,
      item,
      message: `Your gallery photo "${item.title}" was rejected. Reason: ${payload.note}`,
      title: 'Gallery photo rejected',
    })
  }

  const populatedItem = await populateGallery(GalleryItem.findById(item._id))

  res.status(200).json({
    success: true,
    message: 'Gallery moderation updated successfully.',
    data: { item: populatedItem },
  })
})

const bulkModerateGalleryItems = asyncHandler(async (req, res) => {
  const payload = validateBulkGalleryModeration(req.body)
  const items = await GalleryItem.find({ _id: { $in: payload.itemIds } })

  if (!items.length) {
    throw new AppError('No matching gallery items found.', 404)
  }

  await Promise.all(
    items.map(async (item) => {
      item.moderationStatus = payload.status
      item.moderationNote = payload.note
      item.moderatedAt = new Date()
      item.moderatedBy = req.user._id
      await item.save()

      if (payload.status === 'approved') {
        await notifyUploader({
          actor: req.user,
          item,
          message: `Your gallery photo "${item.title}" has been approved.`,
          title: 'Gallery photo approved',
        })
      }
      if (payload.status === 'rejected') {
        await notifyUploader({
          actor: req.user,
          item,
          message: `Your gallery photo "${item.title}" was rejected. Reason: ${payload.note}`,
          title: 'Gallery photo rejected',
        })
      }
    }),
  )
  await recordAuditLog({
    action: 'gallery.moderate.bulk',
    actor: req.user,
    entityType: 'GalleryItem',
    metadata: {
      count: items.length,
      status: payload.status,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Gallery moderation updated successfully.',
    data: { count: items.length },
  })
})

const updateAlbumVisibility = asyncHandler(async (req, res) => {
  const payload = validateGalleryAlbumVisibility(req.body)
  const result = await GalleryItem.updateMany(
    { album: payload.album },
    { $set: { albumVisible: payload.albumVisible } },
  )

  await recordAuditLog({
    action: 'gallery.album.visibility',
    actor: req.user,
    entityType: 'GalleryAlbum',
    metadata: {
      album: payload.album,
      albumVisible: payload.albumVisible,
      count: result.modifiedCount,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Gallery album visibility updated successfully.',
    data: { count: result.modifiedCount },
  })
})

const reorderGalleryItems = asyncHandler(async (req, res) => {
  const payload = validateGalleryReorder(req.body)

  await Promise.all(
    payload.orderedIds.map((id, index) =>
      GalleryItem.findByIdAndUpdate(id, {
        ...(payload.album ? { album: payload.album } : {}),
        displayOrder: index,
      }),
    ),
  )
  await recordAuditLog({
    action: 'gallery.reorder',
    actor: req.user,
    entityType: 'GalleryItem',
    metadata: {
      album: payload.album,
      count: payload.orderedIds.length,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Gallery order updated successfully.',
    data: { count: payload.orderedIds.length },
  })
})

module.exports = {
  bulkModerateGalleryItems,
  createGalleryItem,
  deleteGalleryItem,
  getMemberGalleryItems,
  getPublicGalleryItems,
  moderateGalleryItem,
  reorderGalleryItems,
  updateAlbumVisibility,
  updateGalleryItem,
}
