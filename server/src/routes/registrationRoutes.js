const express = require('express')
const {
  approveRegistration,
  bulkApproveRegistrations,
  bulkRejectRegistrations,
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
router.post('/bulk-approve', protect, authorize(USER_ROLES.ADMIN), bulkApproveRegistrations)
router.post('/bulk-reject', protect, authorize(USER_ROLES.ADMIN), bulkRejectRegistrations)
router.patch('/:id/approve', protect, authorize(USER_ROLES.ADMIN), approveRegistration)
router.patch('/:id/reject', protect, authorize(USER_ROLES.ADMIN), rejectRegistration)

module.exports = router
