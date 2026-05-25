const { AUDIENCES } = require('../constants/contentConstants')
const { USER_ROLES } = require('../constants/userConstants')
const Blog = require('../models/Blog')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { validateBlog, validateBlogComment } = require('../validators/communityValidators')

const populateBlog = (query) =>
  query
    .populate('createdBy', 'name phone role profilePhotoUrl')
    .populate('likes.user', 'name phone role profilePhotoUrl')
    .populate('comments.user', 'name phone role profilePhotoUrl')

const canManageBlog = (user, blog) =>
  user.role === USER_ROLES.ADMIN || blog.createdBy.toString() === user._id.toString()

const getPublicBlogs = asyncHandler(async (req, res) => {
  const blogs = await populateBlog(Blog.find({ audience: AUDIENCES.PUBLIC }).sort({ createdAt: -1 }))

  res.status(200).json({
    success: true,
    message: 'Blogs loaded successfully.',
    data: {
      blogs,
    },
  })
})

const getMemberBlogs = asyncHandler(async (req, res) => {
  const blogs = await populateBlog(Blog.find().sort({ createdAt: -1 }))

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
  const blog = await Blog.create({
    ...payload,
    createdBy: req.user._id,
  })
  await recordAuditLog({
    action: 'blog.create',
    actor: req.user,
    entityId: blog._id,
    entityType: 'Blog',
    metadata: {
      audience: blog.audience,
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

  Object.assign(blog, payload)
  await blog.save()
  await recordAuditLog({
    action: 'blog.update',
    actor: req.user,
    entityId: blog._id,
    entityType: 'Blog',
    metadata: {
      audience: blog.audience,
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

module.exports = {
  addBlogComment,
  createBlog,
  deleteBlog,
  deleteBlogComment,
  getMemberBlogs,
  getPublicBlogs,
  toggleBlogLike,
  updateBlog,
}
