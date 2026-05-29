const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateBlog,
  validateBlogComment,
  validateBlogModeration,
  validateBulkBlogModeration,
  validateGalleryItem,
} = require('../src/validators/communityValidators')

test('validateBlog accepts member blog payloads', () => {
  const payload = validateBlog({
    audience: 'members',
    body: 'Community update body',
    imageUrl: 'https://example.com/blog.jpg',
    title: 'Community update',
  })

  assert.equal(payload.audience, 'members')
  assert.equal(payload.moderationStatus, 'pending')
  assert.equal(payload.title, 'Community update')
})

test('validateBlog accepts draft status for member saving', () => {
  const payload = validateBlog({
    body: 'Draft body',
    moderationStatus: 'draft',
    title: 'Draft blog',
  })

  assert.equal(payload.moderationStatus, 'draft')
})

test('validateBlogComment requires comment body', () => {
  assert.throws(() => validateBlogComment({ body: '' }), /Comment is required/)
})

test('validateBlogModeration requires rejection reason', () => {
  assert.throws(
    () => validateBlogModeration({ status: 'rejected', note: '' }),
    /Rejection reason is required/,
  )
  assert.equal(validateBlogModeration({ status: 'approved' }).status, 'approved')
})

test('validateBulkBlogModeration requires selected blogs', () => {
  assert.throws(
    () => validateBulkBlogModeration({ blogIds: [], status: 'approved' }),
    /At least one blog is required/,
  )
  assert.equal(
    validateBulkBlogModeration({ blogIds: ['665f88f930d34b816c9d0001'], status: 'approved' })
      .blogIds.length,
    1,
  )
})

test('validateGalleryItem requires image URL', () => {
  assert.throws(
    () =>
      validateGalleryItem({
        title: 'Gallery title',
      }),
    /Image URL is required/,
  )
})
