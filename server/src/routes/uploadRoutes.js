const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const { uploadImage } = require('../controllers/uploadController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.post('/image', protect, authorize(USER_ROLES.ADMIN), uploadImage)

module.exports = router
