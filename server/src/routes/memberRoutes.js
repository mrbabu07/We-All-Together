const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  deleteUser,
  getAllUsers,
  getApprovedMembers,
  updateUserAccess,
  updateMemberProfile,
} = require('../controllers/memberController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), getApprovedMembers)
router.get('/users', protect, authorize(USER_ROLES.ADMIN), getAllUsers)
router.patch('/:id', protect, authorize(USER_ROLES.ADMIN), updateMemberProfile)
router.patch('/:id/access', protect, authorize(USER_ROLES.ADMIN), updateUserAccess)
router.delete('/:id', protect, authorize(USER_ROLES.ADMIN), deleteUser)

module.exports = router
