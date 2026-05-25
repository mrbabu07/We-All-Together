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

const validateBlog = (body) => ({
  audience: readAudience(body),
  body: requireString(body, 'body', 'Blog body'),
  imageUrl: optionalString(body, 'imageUrl'),
  title: requireString(body, 'title', 'Blog title'),
})

const validateBlogComment = (body) => ({
  body: requireString(body, 'body', 'Comment'),
})

const validateGalleryItem = (body) => ({
  audience: readAudience(body),
  description: optionalString(body, 'description'),
  imageUrl: requireString(body, 'imageUrl', 'Image URL'),
  title: requireString(body, 'title', 'Gallery title'),
})

module.exports = {
  validateBlog,
  validateBlogComment,
  validateGalleryItem,
}
