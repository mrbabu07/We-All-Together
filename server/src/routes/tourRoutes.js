const { USER_ROLES } = require('../constants/userConstants')
const tourController = require('../controllers/tourController')
const createContentRoutes = require('./contentRouteFactory')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = createContentRoutes(tourController, {
  create: 'tour.create',
  delete: 'tour.delete',
  edit: 'tour.edit',
  view: 'tour.view',
})

router.patch(
  '/:id/participants',
  protect,
  requirePermission('tour.manage_registration'),
  tourController.updateParticipants,
)
router.patch(
  '/:id/registration',
  protect,
  requirePermission('tour.manage_registration'),
  tourController.updateRegistration,
)
router.post(
  '/:id/expenses',
  protect,
  requirePermission('tour.edit'),
  tourController.addExpense,
)
router.delete(
  '/:id/expenses/:expenseId',
  protect,
  requirePermission('tour.edit'),
  tourController.deleteExpense,
)
router.post(
  '/:id/complete',
  protect,
  requirePermission('tour.edit'),
  tourController.completeTour,
)
router.post(
  '/:id/rsvp',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  tourController.submitRsvp,
)
router.get('/:id/rsvp', protect, requirePermission('tour.view'), tourController.getRsvps)
router.post(
  '/:id/register',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  tourController.registerForTour,
)
router.post(
  '/:id/feedback',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  tourController.submitFeedback,
)

module.exports = router
