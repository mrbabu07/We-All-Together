const { test } = require('node:test')
const assert = require('node:assert/strict')
const { validateBroadcastNotification } = require('../src/validators/notificationValidators')

test('validateBroadcastNotification accepts all approved users by default', () => {
  const payload = validateBroadcastNotification({
    message: 'Meeting at 8 PM',
    title: 'Meeting reminder',
  })

  assert.equal(payload.role, '')
  assert.equal(payload.type, 'general')
})

test('validateBroadcastNotification rejects invalid role values', () => {
  assert.throws(
    () =>
      validateBroadcastNotification({
        message: 'Message',
        role: 'owner',
        title: 'Title',
      }),
    /role is invalid/,
  )
})
