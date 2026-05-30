const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  bulkModerateGalleryItems,
  createGalleryItem,
  deleteGalleryItem,
  getMemberGalleryItems,
  getPublicGalleryItems,
  moderateGalleryItem,
  reorderGalleryItems,
  updateAlbumVisibility,
  updateGalleryItem,
} = require('../controllers/galleryController')
const { protect } = require('../middlewares/authMiddleware')
const {
  requirePermission,
  requirePermissionOrRoles,
} = require('../middlewares/permissionMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/public', getPublicGalleryItems)
router.get(
  '/members',
  protect,
  requirePermissionOrRoles(
    'gallery.view',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  getMemberGalleryItems,
)
router.post(
  '/',
  protect,
  requirePermissionOrRoles(
    'gallery.upload',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  createGalleryItem,
)
router.post(
  '/moderation/bulk',
  protect,
  requirePermission('gallery.approve'),
  bulkModerateGalleryItems,
)
router.patch(
  '/albums/visibility',
  protect,
  requirePermission('gallery.manage_albums'),
  updateAlbumVisibility,
)
router.patch(
  '/reorder',
  protect,
  requirePermission('gallery.manage_albums'),
  reorderGalleryItems,
)
router.patch(
  '/:id/moderation',
  protect,
  requirePermission('gallery.approve'),
  moderateGalleryItem,
)
router.patch(
  '/:id',
  protect,
  requirePermissionOrRoles(
    'gallery.manage_albums',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  updateGalleryItem,
)
router.delete(
  '/:id',
  protect,
  requirePermissionOrRoles(
    'gallery.delete',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  deleteGalleryItem,
)

module.exports = router
