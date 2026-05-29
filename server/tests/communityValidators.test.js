const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateBlog,
  validateBlogComment,
  validateBlogModeration,
  validateBulkBlogModeration,
  validateBulkGalleryModeration,
  validateGalleryAlbumVisibility,
  validateGalleryItem,
  validateGalleryModeration,
  validateGalleryReorder,
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

test('validateGalleryItem accepts album metadata and pending status', () => {
  const payload = validateGalleryItem({
    album: 'Tour 2026',
    albumCoverUrl: 'https://example.com/cover.jpg',
    albumDescription: 'Tour photos',
    caption: 'Arrival',
    displayOrder: 3,
    imageUrl: 'https://example.com/photo.jpg',
    moderationStatus: 'pending',
    title: 'Arrival photo',
  })

  assert.equal(payload.album, 'Tour 2026')
  assert.equal(payload.albumVisible, true)
  assert.equal(payload.displayOrder, 3)
  assert.equal(payload.moderationStatus, 'pending')
})

test('validateGalleryModeration requires rejection reason', () => {
  assert.throws(
    () => validateGalleryModeration({ status: 'rejected' }),
    /Gallery rejection reason is required/,
  )
  assert.equal(validateGalleryModeration({ status: 'approved' }).status, 'approved')
})

test('validateBulkGalleryModeration and reorder require selected ids', () => {
  assert.throws(
    () => validateBulkGalleryModeration({ itemIds: [], status: 'approved' }),
    /At least one gallery item is required/,
  )
  assert.throws(
    () => validateGalleryReorder({ orderedIds: [] }),
    /At least one gallery item is required/,
  )
})

test('validateGalleryAlbumVisibility defaults album visible', () => {
  const payload = validateGalleryAlbumVisibility({ album: 'General' })

  assert.equal(payload.album, 'General')
  assert.equal(payload.albumVisible, true)
})
