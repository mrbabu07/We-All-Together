const { test } = require('node:test')
const assert = require('node:assert/strict')

process.env.JWT_ACCESS_SECRET = 'test_secret_for_auth_utils'
process.env.JWT_ACCESS_EXPIRES_IN = '1h'

const { comparePassword, hashPassword } = require('../src/utils/passwordUtils')
const { generateAccessToken, verifyAccessToken } = require('../src/utils/tokenUtils')

test('password utilities hash and compare passwords', async () => {
  const hashedPassword = await hashPassword('secret123')

  assert.notEqual(hashedPassword, 'secret123')
  assert.equal(await comparePassword('secret123', hashedPassword), true)
  assert.equal(await comparePassword('wrong-password', hashedPassword), false)
})

test('token utilities generate and verify access tokens', () => {
  const token = generateAccessToken({
    _id: '507f1f77bcf86cd799439011',
    role: 'admin',
    status: 'approved',
  })

  const decoded = verifyAccessToken(token)

  assert.equal(decoded.id, '507f1f77bcf86cd799439011')
  assert.equal(decoded.role, 'admin')
  assert.equal(decoded.status, 'approved')
})
