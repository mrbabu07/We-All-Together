const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  deleteUser,
  downloadMyDataPdf,
  getAllUsers,
  getApprovedMembers,
  getMemberActivitySummary,
  getMyData,
  requestAccountDeletion,
  resetUserPassword,
  updateUserAccess,
  updateMemberProfile,
  verifyMemberPublic,
} = require('../controllers/memberController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/verify/:id', verifyMemberPublic)
router.get(
  '/',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  getApprovedMembers,
)
router.get('/my-data', protect, getMyData)
router.get('/my-data.pdf', protect, downloadMyDataPdf)
router.get('/my-activity', protect, getMemberActivitySummary)
router.post('/delete-request', protect, requestAccountDeletion)
router.get('/users', protect, authorize(USER_ROLES.ADMIN), getAllUsers)
router.get('/:id/activity', protect, authorize(USER_ROLES.ADMIN), getMemberActivitySummary)
router.patch('/:id', protect, authorize(USER_ROLES.ADMIN), updateMemberProfile)
router.patch('/:id/access', protect, authorize(USER_ROLES.ADMIN), updateUserAccess)
router.patch('/:id/password', protect, authorize(USER_ROLES.ADMIN), resetUserPassword)
router.delete('/:id', protect, authorize(USER_ROLES.ADMIN), deleteUser)

module.exports = router
