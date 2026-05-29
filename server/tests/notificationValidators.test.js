const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateBroadcastNotification,
  validateSendNotification,
} = require('../src/validators/notificationValidators')

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

test('validateSendNotification accepts sms whatsapp channels', () => {
  const payload = validateSendNotification({
    channel: 'both',
    message: 'Please join meeting',
    recipientMode: 'member',
    title: 'Meeting reminder',
  })

  assert.equal(payload.channel, 'both')
  assert.equal(payload.recipientMode, 'member')
})

test('validateSendNotification accepts scheduled specific in-app announcements', () => {
  const scheduledFor = new Date(Date.now() + 60_000).toISOString()
  const payload = validateSendNotification({
    channel: 'in_app',
    message: 'Notice body',
    recipientMode: 'specific',
    scheduledFor,
    title: 'Notice',
    userIds: ['user-1', 'user-1', 'user-2'],
  })

  assert.equal(payload.channel, 'in_app')
  assert.equal(payload.recipientMode, 'specific')
  assert.deepEqual(payload.userIds, ['user-1', 'user-2'])
  assert.equal(payload.scheduledFor.toISOString(), scheduledFor)
})
