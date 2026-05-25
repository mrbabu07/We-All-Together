const noticeController = require('../controllers/noticeController')
const createContentRoutes = require('./contentRouteFactory')
const { USER_ROLES } = require('../constants/userConstants')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = createContentRoutes(noticeController)

router.post(
  '/archive-bulk',
  protect,
  authorize(USER_ROLES.ADMIN),
  noticeController.archiveNotices,
)
router.post(
  '/:id/read',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  noticeController.markNoticeRead,
)
router.post(
  '/:id/reactions',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  noticeController.reactToNotice,
)
router.post(
  '/:id/comments',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  noticeController.addNoticeComment,
)

module.exports = router
