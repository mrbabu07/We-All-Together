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
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/public', getPublicGalleryItems)
router.get(
  '/members',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  getMemberGalleryItems,
)
router.post(
  '/',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  createGalleryItem,
)
router.post(
  '/moderation/bulk',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MODERATOR),
  bulkModerateGalleryItems,
)
router.patch(
  '/albums/visibility',
  protect,
  authorize(USER_ROLES.ADMIN),
  updateAlbumVisibility,
)
router.patch(
  '/reorder',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MODERATOR),
  reorderGalleryItems,
)
router.patch(
  '/:id/moderation',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MODERATOR),
  moderateGalleryItem,
)
router.patch(
  '/:id',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  updateGalleryItem,
)
router.delete(
  '/:id',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  deleteGalleryItem,
)

module.exports = router
