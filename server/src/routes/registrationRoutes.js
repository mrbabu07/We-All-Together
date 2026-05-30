const express = require('express')
const {
  approveRegistration,
  bulkApproveRegistrations,
  bulkRejectRegistrations,
  getPendingRegistrations,
  registerMember,
  rejectRegistration,
} = require('../controllers/registrationController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.post('/', registerMember)
router.get('/pending', protect, requirePermission('member.view'), getPendingRegistrations)
router.post('/bulk-approve', protect, requirePermission('member.approve'), bulkApproveRegistrations)
router.post('/bulk-reject', protect, requirePermission('member.reject'), bulkRejectRegistrations)
router.patch('/:id/approve', protect, requirePermission('member.approve'), approveRegistration)
router.patch('/:id/reject', protect, requirePermission('member.reject'), rejectRegistration)

module.exports = router
