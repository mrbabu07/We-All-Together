const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  addBlogComment,
  bulkModerateBlogs,
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
const {
  requireAnyPermission,
  requirePermissionOrRoles,
} = require('../middlewares/permissionMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/public', getPublicBlogs)
router.get(
  '/members',
  protect,
  requirePermissionOrRoles(
    'blog.view',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  getMemberBlogs,
)
router.post(
  '/',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  createBlog,
)
router.post(
  '/moderation/bulk',
  protect,
  requireAnyPermission('blog.approve', 'blog.reject'),
  bulkModerateBlogs,
)
router.patch(
  '/:id/moderation',
  protect,
  requireAnyPermission('blog.approve', 'blog.reject'),
  moderateBlog,
)
router.patch(
  '/:id',
  protect,
  requirePermissionOrRoles(
    'blog.edit_any',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  updateBlog,
)
router.delete(
  '/:id',
  protect,
  requirePermissionOrRoles(
    'blog.delete',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  deleteBlog,
)
router.post(
  '/:id/like',
  protect,
  requirePermissionOrRoles(
    'blog.view',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  toggleBlogLike,
)
router.post(
  '/:id/comments',
  protect,
  requirePermissionOrRoles(
    'blog.view',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  addBlogComment,
)
router.delete(
  '/:id/comments/:commentId',
  protect,
  requirePermissionOrRoles(
    'blog.view',
    USER_ROLES.ADMIN,
    USER_ROLES.MEMBER,
    USER_ROLES.MODERATOR,
  ),
  deleteBlogComment,
)

module.exports = router
