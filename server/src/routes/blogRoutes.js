const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  addBlogComment,
  createBlog,
  deleteBlog,
  deleteBlogComment,
  getMemberBlogs,
  getPublicBlogs,
  moderateBlog,
  toggleBlogLike,
  updateBlog,
} = require('../controllers/blogController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/public', getPublicBlogs)
router.get(
  '/members',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  getMemberBlogs,
)
router.post(
  '/',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  createBlog,
)
router.patch('/:id/moderation', protect, authorize(USER_ROLES.ADMIN), moderateBlog)
router.patch(
  '/:id',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  updateBlog,
)
router.delete(
  '/:id',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  deleteBlog,
)
router.post(
  '/:id/like',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  toggleBlogLike,
)
router.post(
  '/:id/comments',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  addBlogComment,
)
router.delete(
  '/:id/comments/:commentId',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  deleteBlogComment,
)

module.exports = router
