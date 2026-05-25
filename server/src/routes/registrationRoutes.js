const express = require('express')
const {
  approveRegistration,
  getPendingRegistrations,
  registerMember,
  rejectRegistration,
} = require('../controllers/registrationController')
const { USER_ROLES } = require('../constants/userConstants')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.post('/', registerMember)
router.get('/pending', protect, authorize(USER_ROLES.ADMIN), getPendingRegistrations)
router.patch('/:id/approve', protect, authorize(USER_ROLES.ADMIN), approveRegistration)
router.patch('/:id/reject', protect, authorize(USER_ROLES.ADMIN), rejectRegistration)

module.exports = router
