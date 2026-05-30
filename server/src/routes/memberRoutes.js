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
const roleController = require('../controllers/roleController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')
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
router.get('/users', protect, requirePermission('member.view'), getAllUsers)
router.get('/:id/activity', protect, requirePermission('member.view'), getMemberActivitySummary)
router.get('/:id/permissions', protect, requirePermission('settings.roles'), roleController.getUserPermissions)
router.put('/:id/role', protect, requirePermission('settings.roles'), roleController.assignUserRole)
router.put('/:id/permissions', protect, requirePermission('settings.roles'), roleController.setUserPermissions)
router.patch('/:id', protect, requirePermission('member.edit'), updateMemberProfile)
router.patch('/:id/access', protect, requirePermission('member.suspend'), updateUserAccess)
router.patch('/:id/password', protect, requirePermission('member.reset_password'), resetUserPassword)
router.delete('/:id', protect, requirePermission('member.edit'), deleteUser)

module.exports = router
