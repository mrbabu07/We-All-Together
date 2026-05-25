const express = require('express')
const {
  bootstrapAdmin,
  changePassword,
  getMe,
  login,
  updateMe,
} = require('../controllers/authController')
const { protect } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/bootstrap-admin', bootstrapAdmin)
router.post('/login', login)
router.get('/me', protect, getMe)
router.patch('/me', protect, updateMe)
router.patch('/change-password', protect, changePassword)

module.exports = router
