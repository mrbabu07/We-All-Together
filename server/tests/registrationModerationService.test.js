const { test } = require('node:test')
const assert = require('node:assert/strict')
const { buildApprovalMessages } = require('../src/services/registrationModerationService')

test('buildApprovalMessages uses configured welcome message', () => {
  const messages = buildApprovalMessages({
    siteSettings: {
      orgName: 'Dargah Para',
      welcomeMessage: '<p>Welcome member. Stay connected.</p>',
    },
  })

  assert.equal(messages.smsBody, 'Dargah Para: Welcome member. Stay connected.')
  assert.equal(
    messages.notificationMessage,
    'Welcome member. Stay connected. You can now access member features.',
  )
})

test('buildApprovalMessages falls back to default approval copy', () => {
  assert.deepEqual(buildApprovalMessages({ siteSettings: { orgName: 'Dargah Para' } }), {
    notificationMessage:
      'Your registration has been approved. You can now access member features.',
    smsBody: 'Welcome to Dargah Para. Your registration has been approved.',
  })
})
