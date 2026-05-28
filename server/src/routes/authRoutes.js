const express = require('express')
const {
  bootstrapAdmin,
  changePassword,
  getMe,
  login,
  refreshToken,
  updateMe,
} = require('../controllers/authController')
const { authenticate, protect } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/bootstrap-admin', bootstrapAdmin)
router.post('/login', login)
router.get('/me', authenticate, getMe)
router.post('/refresh', authenticate, refreshToken)
router.patch('/me', protect, updateMe)
router.patch('/change-password', protect, changePassword)

module.exports = router
