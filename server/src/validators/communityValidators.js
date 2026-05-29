const { AUDIENCES } = require('../constants/contentConstants')
const AppError = require('../utils/appError')

const requireString = (body, fieldName, label = fieldName) => {
  const value = body[fieldName]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${label} is required.`, 400)
  }

  return value.trim()
}

const optionalString = (body, fieldName) =>
  typeof body[fieldName] === 'string' ? body[fieldName].trim() : ''

const readAudience = (body) => {
  if (!body.audience) {
    return AUDIENCES.PUBLIC
  }

  if (!Object.values(AUDIENCES).includes(body.audience)) {
    throw new AppError('Audience must be public or members.', 400)
  }

  return body.audience
}

const readBlogStatus = (body, fallback = 'pending') => {
  if (!body.moderationStatus) {
    return fallback
  }

  if (!['draft', 'pending', 'approved', 'rejected'].includes(body.moderationStatus)) {
    throw new AppError('Blog status is invalid.', 400)
  }

  return body.moderationStatus
}

const validateBlog = (body) => ({
  audience: readAudience(body),
  body: requireString(body, 'body', 'Blog body'),
  imageUrl: optionalString(body, 'imageUrl'),
  moderationStatus: readBlogStatus(body),
  title: requireString(body, 'title', 'Blog title'),
})

const validateBlogComment = (body) => ({
  body: requireString(body, 'body', 'Comment'),
})

const validateBlogModeration = (body) => {
  const status = typeof body.status === 'string' ? body.status : ''
  const note = optionalString(body, 'note')

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new AppError('Moderation status is invalid.', 400)
  }

  if (status === 'rejected' && !note) {
    throw new AppError('Rejection reason is required.', 400)
  }

  return {
    note,
    status,
  }
}

const validateBulkBlogModeration = (body) => {
  const ids = Array.isArray(body.blogIds)
    ? body.blogIds.map((id) => String(id || '').trim()).filter(Boolean)
    : []

  if (!ids.length) {
    throw new AppError('At least one blog is required.', 400)
  }

  return {
    blogIds: ids,
    ...validateBlogModeration(body),
  }
}

const validateGalleryItem = (body) => ({
  album: optionalString(body, 'album') || 'General',
  audience: readAudience(body),
  description: optionalString(body, 'description'),
  imageUrl: requireString(body, 'imageUrl', 'Image URL'),
  title: requireString(body, 'title', 'Gallery title'),
})

module.exports = {
  validateBlog,
  validateBlogComment,
  validateBlogModeration,
  validateBulkBlogModeration,
  validateGalleryItem,
}
