const express = require('express')
const { bootstrapAdmin, getMe, login } = require('../controllers/authController')
const { protect } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/bootstrap-admin', bootstrapAdmin)
router.post('/login', login)
router.get('/me', protect, getMe)

module.exports = router
