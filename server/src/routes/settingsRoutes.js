const express = require('express')
const {
  getPublicSettings,
  updateRegistrationFee,
} = require('../controllers/settingsController')
const { protect } = require('../middlewares/authMiddleware')

const router = express.Router()

router.get('/public', getPublicSettings)
router.patch('/registration-fee', protect, updateRegistrationFee)

module.exports = router
