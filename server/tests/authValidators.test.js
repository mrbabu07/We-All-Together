const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateChangePassword,
  validateProfileUpdate,
} = require('../src/validators/authValidators')

test('validateProfileUpdate accepts name phone and optional address', () => {
  const payload = validateProfileUpdate({
    address: 'Dargah Para',
    name: 'Admin User',
    phone: '01700000000',
  })

  assert.equal(payload.name, 'Admin User')
  assert.equal(payload.phone, '01700000000')
  assert.equal(payload.address, 'Dargah Para')
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
