const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateBlog,
  validateBlogComment,
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
  assert.equal(payload.title, 'Community update')
})

test('validateBlogComment requires comment body', () => {
  assert.throws(() => validateBlogComment({ body: '' }), /Comment is required/)
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
