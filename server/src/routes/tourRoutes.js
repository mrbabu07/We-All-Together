const { USER_ROLES } = require('../constants/userConstants')
const tourController = require('../controllers/tourController')
const createContentRoutes = require('./contentRouteFactory')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = createContentRoutes(tourController)

router.patch(
  '/:id/participants',
  protect,
  authorize(USER_ROLES.ADMIN),
  tourController.updateParticipants,
)
router.post('/:id/rsvp', protect, authorize(USER_ROLES.MEMBER), tourController.submitRsvp)
router.get('/:id/rsvp', protect, authorize(USER_ROLES.ADMIN), tourController.getRsvps)

module.exports = router
