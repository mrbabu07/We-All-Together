const { test } = require('node:test')
const assert = require('node:assert/strict')

process.env.IMGBB_API_KEY = ''

const { uploadToImgBB } = require('../src/services/imgbbService')

test('uploadToImgBB requires image data', async () => {
  await assert.rejects(() => uploadToImgBB({ image: '' }), /Image data is required/)
})
