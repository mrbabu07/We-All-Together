const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateAdminPasswordReset,
  validateChangePassword,
  validateProfileUpdate,
} = require('../src/validators/authValidators')

test('validateProfileUpdate accepts name phone and optional address', () => {
  const payload = validateProfileUpdate({
    birthCertificateUrl: ' https://example.com/birth.jpg ',
    address: 'Dargah Para',
    name: 'Admin User',
    nidImageUrl: ' https://example.com/nid.jpg ',
    phone: '01700000000',
    profilePhotoUrl: ' https://example.com/profile.jpg ',
  })

  assert.equal(payload.name, 'Admin User')
  assert.equal(payload.phone, '01700000000')
  assert.equal(payload.address, 'Dargah Para')
  assert.equal(payload.birthCertificateUrl, 'https://example.com/birth.jpg')
  assert.equal(payload.nidImageUrl, 'https://example.com/nid.jpg')
  assert.equal(payload.profilePhotoUrl, 'https://example.com/profile.jpg')
})

test('validateChangePassword rejects same password', () => {
  assert.throws(
    () =>
      validateChangePassword({
        currentPassword: 'secret123',
        newPassword: 'secret123',
      }),
    /different from current password/,
  )
})

test('validateAdminPasswordReset accepts a new password', () => {
  const payload = validateAdminPasswordReset({
    newPassword: 'Member@123',
  })

  assert.equal(payload.newPassword, 'Member@123')
})
