const { AUDIENCES } = require('../constants/contentConstants')
const { USER_ROLES } = require('../constants/userConstants')
const GalleryItem = require('../models/GalleryItem')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { validateGalleryItem } = require('../validators/communityValidators')

const populateGallery = (query) => query.populate('createdBy', 'name phone role profilePhotoUrl')

const canManageGalleryItem = (user, item) =>
  user.role === USER_ROLES.ADMIN || item.createdBy.toString() === user._id.toString()

const getPublicGalleryItems = asyncHandler(async (req, res) => {
  const items = await populateGallery(
    GalleryItem.find({ audience: AUDIENCES.PUBLIC }).sort({ createdAt: -1 }),
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
  const items = await populateGallery(GalleryItem.find().sort({ createdAt: -1 }))

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
  const item = await GalleryItem.create({
    ...payload,
    createdBy: req.user._id,
  })
  await recordAuditLog({
    action: 'gallery.create',
    actor: req.user,
    entityId: item._id,
    entityType: 'GalleryItem',
    metadata: {
      audience: item.audience,
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

  Object.assign(item, payload)
  await item.save()
  await recordAuditLog({
    action: 'gallery.update',
    actor: req.user,
    entityId: item._id,
    entityType: 'GalleryItem',
    metadata: {
      audience: item.audience,
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

module.exports = {
  createGalleryItem,
  deleteGalleryItem,
  getMemberGalleryItems,
  getPublicGalleryItems,
  updateGalleryItem,
}
