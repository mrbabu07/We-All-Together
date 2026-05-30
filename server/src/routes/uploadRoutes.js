const express = require('express')
const { uploadImage } = require('../controllers/uploadController')
const { protect } = require('../middlewares/authMiddleware')
const { requireAnyPermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.post('/payment-proof', uploadImage)
router.post('/profile-document', protect, uploadImage)
router.post(
  '/image',
  protect,
  requireAnyPermission(
    'notice.create',
    'notice.edit',
    'meeting.create',
    'meeting.edit',
    'tour.create',
    'tour.edit',
    'blog.edit_any',
    'gallery.upload',
    'homepage.committee',
    'homepage.achievements',
    'homepage.testimonials',
    'homepage.partners',
    'settings.appearance',
  ),
  uploadImage,
)

module.exports = router
