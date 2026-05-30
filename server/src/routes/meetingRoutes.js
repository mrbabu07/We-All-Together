const { USER_ROLES } = require('../constants/userConstants')
const meetingController = require('../controllers/meetingController')
const createContentRoutes = require('./contentRouteFactory')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = createContentRoutes(meetingController, {
  create: 'meeting.create',
  delete: 'meeting.delete',
  edit: 'meeting.edit',
  view: 'meeting.view',
})

router.patch(
  '/:id/attendance',
  protect,
  requirePermission('meeting.attendance'),
  meetingController.updateAttendance,
)
router.patch(
  '/:id/advanced',
  protect,
  requirePermission('meeting.edit'),
  meetingController.updateAdvancedMeeting,
)
router.post(
  '/:id/check-in',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  meetingController.checkInMeeting,
)
router.post(
  '/:id/recap',
  protect,
  requirePermission('meeting.minutes'),
  meetingController.publishMeetingRecap,
)
router.post(
  '/:id/rsvp',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  meetingController.submitRsvp,
)
router.get('/:id/rsvp', protect, requirePermission('meeting.view'), meetingController.getRsvps)

module.exports = router
