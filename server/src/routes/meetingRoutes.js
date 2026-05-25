const { USER_ROLES } = require('../constants/userConstants')
const meetingController = require('../controllers/meetingController')
const createContentRoutes = require('./contentRouteFactory')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = createContentRoutes(meetingController)

router.patch(
  '/:id/attendance',
  protect,
  authorize(USER_ROLES.ADMIN),
  meetingController.updateAttendance,
)
router.post('/:id/rsvp', protect, authorize(USER_ROLES.MEMBER), meetingController.submitRsvp)
router.get('/:id/rsvp', protect, authorize(USER_ROLES.ADMIN), meetingController.getRsvps)

module.exports = router
