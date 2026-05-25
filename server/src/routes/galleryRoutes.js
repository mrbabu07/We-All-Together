const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  createGalleryItem,
  deleteGalleryItem,
  getMemberGalleryItems,
  getPublicGalleryItems,
  updateGalleryItem,
} = require('../controllers/galleryController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/public', getPublicGalleryItems)
router.get(
  '/members',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER),
  getMemberGalleryItems,
)
router.post('/', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), createGalleryItem)
router.patch('/:id', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), updateGalleryItem)
router.delete('/:id', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), deleteGalleryItem)

module.exports = router
