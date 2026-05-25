const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  addBlogComment,
  createBlog,
  deleteBlog,
  deleteBlogComment,
  getMemberBlogs,
  getPublicBlogs,
  toggleBlogLike,
  updateBlog,
} = require('../controllers/blogController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/public', getPublicBlogs)
router.get('/members', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), getMemberBlogs)
router.post('/', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), createBlog)
router.patch('/:id', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), updateBlog)
router.delete('/:id', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), deleteBlog)
router.post('/:id/like', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), toggleBlogLike)
router.post(
  '/:id/comments',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER),
  addBlogComment,
)
router.delete(
  '/:id/comments/:commentId',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER),
  deleteBlogComment,
)

module.exports = router
