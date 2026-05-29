const ruleController = require('../controllers/ruleController')
const createContentRoutes = require('./contentRouteFactory')
const { USER_ROLES } = require('../constants/userConstants')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = createContentRoutes(ruleController)

router.get(
  '/:id/history',
  protect,
  authorize(USER_ROLES.ADMIN),
  ruleController.getVersionHistory,
)
router.post(
  '/:id/restore/:version',
  protect,
  authorize(USER_ROLES.ADMIN),
  ruleController.restoreVersion,
)

module.exports = router
