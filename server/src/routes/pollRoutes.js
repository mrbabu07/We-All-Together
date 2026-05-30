const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const pollController = require('../controllers/pollController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission, requirePermissionOrRoles } = require('../middlewares/permissionMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get(
  '/',
  protect,
  requirePermissionOrRoles(
    'poll.view_results',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  pollController.getPolls,
)
router.post('/', protect, requirePermission('poll.create'), pollController.createPoll)
router.get(
  '/:id',
  protect,
  requirePermissionOrRoles(
    'poll.view_results',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  pollController.getPoll,
)
router.post(
  '/:id/vote',
  protect,
  authorize(USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  pollController.votePoll,
)
router.post('/:id/close', protect, requirePermission('poll.edit'), pollController.closePoll)
router.delete('/:id', protect, requirePermission('poll.delete'), pollController.deletePoll)

module.exports = router
