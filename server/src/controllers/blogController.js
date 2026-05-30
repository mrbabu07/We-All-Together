const { AUDIENCES } = require('../constants/contentConstants')
const { USER_ROLES } = require('../constants/userConstants')
const Blog = require('../models/Blog')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { createNotification } = require('../services/notificationService')
const { hasAttachedPermission } = require('../services/permissionService')
const {
  validateBlog,
  validateBlogComment,
  validateBlogModeration,
  validateBulkBlogModeration,
} = require('../validators/communityValidators')

const populateBlog = (query) =>
  query
    .populate('createdBy', 'name phone role profilePhotoUrl')
    .populate('moderatedBy', 'name phone role profilePhotoUrl')
    .populate('likes.user', 'name phone role profilePhotoUrl')
    .populate('comments.user', 'name phone role profilePhotoUrl')

const canManageBlog = (user, blog) =>
  user.role === USER_ROLES.ADMIN ||
  hasAttachedPermission(user, 'blog.edit_any') ||
  hasAttachedPermission(user, 'blog.delete') ||
  blog.createdBy.toString() === user._id.toString()

const canModerateBlog = (user) =>
  [USER_ROLES.ADMIN, USER_ROLES.MODERATOR].includes(user.role) ||
  hasAttachedPermission(user, 'blog.approve') ||
  hasAttachedPermission(user, 'blog.reject')

const canApproveBlog = (user) =>
  [USER_ROLES.ADMIN, USER_ROLES.MODERATOR].includes(user.role) ||
  hasAttachedPermission(user, 'blog.approve')

const getWritableStatus = (user, requestedStatus, currentStatus = '') => {
  if (canApproveBlog(user)) {
    return requestedStatus || currentStatus || 'approved'
  }

  return requestedStatus === 'draft' ? 'draft' : 'pending'
}

const notifyBlogAuthor = async ({ actor, blog, message, title }) =>
  createNotification({
    createdBy: actor,
    link: '/member?tab=blogs',
    message,
    title,
    type: 'blog',
    user: blog.createdBy,
  })

const getPublicBlogs = asyncHandler(async (req, res) => {
  const blogs = await populateBlog(
    Blog.find({
      audience: AUDIENCES.PUBLIC,
      moderationStatus: 'approved',
    }).sort({ createdAt: -1 }),
  )

  res.status(200).json({
    success: true,
    message: 'Blogs loaded successfully.',
    data: {
      blogs,
    },
  })
})

const getMemberBlogs = asyncHandler(async (req, res) => {
  const filter = canModerateBlog(req.user)
    ? {}
    : {
        $or: [
          { moderationStatus: 'approved' },
          { createdBy: req.user._id },
        ],
      }
  const blogs = await populateBlog(Blog.find(filter).sort({ createdAt: -1 }))

  res.status(200).json({
    success: true,
    message: 'Blogs loaded successfully.',
    data: {
      blogs,
    },
  })
})

const createBlog = asyncHandler(async (req, res) => {
  const payload = validateBlog(req.body)
  const moderationStatus = getWritableStatus(req.user, payload.moderationStatus)
  const blog = await Blog.create({
    ...payload,
    moderatedAt: moderationStatus === 'approved' ? new Date() : null,
    moderatedBy: moderationStatus === 'approved' ? req.user._id : null,
    moderationNote: '',
    moderationStatus,
    createdBy: req.user._id,
  })
  await recordAuditLog({
    action: 'blog.create',
    actor: req.user,
    entityId: blog._id,
    entityType: 'Blog',
    metadata: {
      audience: blog.audience,
      status: blog.moderationStatus,
      title: blog.title,
    },
  })

  const populatedBlog = await populateBlog(Blog.findById(blog._id))

  res.status(201).json({
    success: true,
    message: 'Blog created successfully.',
    data: {
      blog: populatedBlog,
    },
  })
})

const updateBlog = asyncHandler(async (req, res) => {
  const payload = validateBlog(req.body)
  const blog = await Blog.findById(req.params.id)

  if (!blog) {
    throw new AppError('Blog not found.', 404)
  }

  if (!canManageBlog(req.user, blog)) {
    throw new AppError('You can only update your own blogs.', 403)
  }

  const moderationStatus = getWritableStatus(req.user, payload.moderationStatus, blog.moderationStatus)
  Object.assign(blog, payload)
  blog.moderationStatus = moderationStatus
  if (!canModerateBlog(req.user) && moderationStatus === 'pending') {
    blog.moderationNote = ''
    blog.moderatedAt = null
    blog.moderatedBy = null
  }
  await blog.save()
  await recordAuditLog({
    action: 'blog.update',
    actor: req.user,
    entityId: blog._id,
    entityType: 'Blog',
    metadata: {
      audience: blog.audience,
      status: blog.moderationStatus,
      title: blog.title,
    },
  })

  const populatedBlog = await populateBlog(Blog.findById(blog._id))

  res.status(200).json({
    success: true,
    message: 'Blog updated successfully.',
    data: {
      blog: populatedBlog,
    },
  })
})

const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id)

  if (!blog) {
    throw new AppError('Blog not found.', 404)
  }

  if (!canManageBlog(req.user, blog)) {
    throw new AppError('You can only delete your own blogs.', 403)
  }

  await blog.deleteOne()
  await recordAuditLog({
    action: 'blog.delete',
    actor: req.user,
    entityId: req.params.id,
    entityType: 'Blog',
    metadata: {
      audience: blog.audience,
      title: blog.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Blog deleted successfully.',
    data: {
      id: req.params.id,
    },
  })
})

const toggleBlogLike = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id)

  if (!blog) {
    throw new AppError('Blog not found.', 404)
  }
  if (blog.moderationStatus !== 'approved') {
    throw new AppError('Only approved blogs can be liked.', 400)
  }

  const existingLike = blog.likes.find(
    (like) => like.user.toString() === req.user._id.toString(),
  )

  if (existingLike) {
    blog.likes = blog.likes.filter((like) => like.user.toString() !== req.user._id.toString())
  } else {
    blog.likes.push({
      user: req.user._id,
    })
  }

  await blog.save()
  const populatedBlog = await populateBlog(Blog.findById(blog._id))

  res.status(200).json({
    success: true,
    message: existingLike ? 'Blog like removed.' : 'Blog liked successfully.',
    data: {
      blog: populatedBlog,
    },
  })
})

const addBlogComment = asyncHandler(async (req, res) => {
  const payload = validateBlogComment(req.body)
  const blog = await Blog.findById(req.params.id)

  if (!blog) {
    throw new AppError('Blog not found.', 404)
  }
  if (blog.moderationStatus !== 'approved') {
    throw new AppError('Only approved blogs can receive comments.', 400)
  }

  blog.comments.push({
    body: payload.body,
    user: req.user._id,
  })
  await blog.save()

  const populatedBlog = await populateBlog(Blog.findById(blog._id))

  res.status(201).json({
    success: true,
    message: 'Comment added successfully.',
    data: {
      blog: populatedBlog,
    },
  })
})

const deleteBlogComment = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id)

  if (!blog) {
    throw new AppError('Blog not found.', 404)
  }

  const comment = blog.comments.id(req.params.commentId)

  if (!comment) {
    throw new AppError('Comment not found.', 404)
  }

  const canDeleteComment =
    req.user.role === USER_ROLES.ADMIN ||
    blog.createdBy.toString() === req.user._id.toString() ||
    comment.user.toString() === req.user._id.toString()

  if (!canDeleteComment) {
    throw new AppError('You can only delete comments you manage.', 403)
  }

  comment.deleteOne()
  await blog.save()

  const populatedBlog = await populateBlog(Blog.findById(blog._id))

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully.',
    data: {
      blog: populatedBlog,
    },
  })
})

const moderateBlog = asyncHandler(async (req, res) => {
  const payload = validateBlogModeration(req.body)
  const blog = await Blog.findById(req.params.id)

  if (!blog) {
    throw new AppError('Blog not found.', 404)
  }

  if (payload.status === 'approved' && !hasAttachedPermission(req.user, 'blog.approve')) {
    throw new AppError('You do not have permission to approve blogs.', 403)
  }

  if (payload.status === 'rejected' && !hasAttachedPermission(req.user, 'blog.reject')) {
    throw new AppError('You do not have permission to reject blogs.', 403)
  }

  blog.moderationStatus = payload.status
  blog.moderationNote = payload.note
  blog.moderatedAt = new Date()
  blog.moderatedBy = req.user._id
  await blog.save()

  await recordAuditLog({
    action: 'blog.moderate',
    actor: req.user,
    entityId: blog._id,
    entityType: 'Blog',
    metadata: {
      status: payload.status,
      title: blog.title,
    },
  })
  if (payload.status === 'approved') {
    await notifyBlogAuthor({
      actor: req.user,
      blog,
      message: `Your blog "${blog.title}" has been approved and published.`,
      title: 'Blog approved',
    })
  }
  if (payload.status === 'rejected') {
    await notifyBlogAuthor({
      actor: req.user,
      blog,
      message: `Your blog "${blog.title}" was rejected. Reason: ${payload.note}`,
      title: 'Blog rejected',
    })
  }

  const populatedBlog = await populateBlog(Blog.findById(blog._id))

  res.status(200).json({
    success: true,
    message: 'Blog moderation updated successfully.',
    data: {
      blog: populatedBlog,
    },
  })
})

const bulkModerateBlogs = asyncHandler(async (req, res) => {
  const payload = validateBulkBlogModeration(req.body)

  if (payload.status === 'approved' && !hasAttachedPermission(req.user, 'blog.approve')) {
    throw new AppError('You do not have permission to approve blogs.', 403)
  }

  if (payload.status === 'rejected' && !hasAttachedPermission(req.user, 'blog.reject')) {
    throw new AppError('You do not have permission to reject blogs.', 403)
  }

  const blogs = await Blog.find({ _id: { $in: payload.blogIds } })

  if (!blogs.length) {
    throw new AppError('No matching blogs found.', 404)
  }

  await Promise.all(
    blogs.map(async (blog) => {
      blog.moderationStatus = payload.status
      blog.moderationNote = payload.note
      blog.moderatedAt = new Date()
      blog.moderatedBy = req.user._id
      await blog.save()

      if (payload.status === 'approved') {
        await notifyBlogAuthor({
          actor: req.user,
          blog,
          message: `Your blog "${blog.title}" has been approved and published.`,
          title: 'Blog approved',
        })
      }
      if (payload.status === 'rejected') {
        await notifyBlogAuthor({
          actor: req.user,
          blog,
          message: `Your blog "${blog.title}" was rejected. Reason: ${payload.note}`,
          title: 'Blog rejected',
        })
      }
    }),
  )
  await recordAuditLog({
    action: 'blog.moderate.bulk',
    actor: req.user,
    entityType: 'Blog',
    metadata: {
      count: blogs.length,
      status: payload.status,
    },
  })

  const moderatedBlogs = await populateBlog(
    Blog.find({ _id: { $in: blogs.map((blog) => blog._id) } }).sort({ createdAt: -1 }),
  )

  res.status(200).json({
    success: true,
    message: 'Blog moderation updated successfully.',
    data: {
      blogs: moderatedBlogs,
      count: blogs.length,
    },
  })
})

module.exports = {
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
}
