const express = require('express')
const {
  approveRegistration,
  getPendingRegistrations,
  registerMember,
  rejectRegistration,
} = require('../controllers/registrationController')
const { protect } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/', registerMember)
router.get('/pending', protect, getPendingRegistrations)
router.patch('/:id/approve', protect, approveRegistration)
router.patch('/:id/reject', protect, rejectRegistration)

module.exports = router
