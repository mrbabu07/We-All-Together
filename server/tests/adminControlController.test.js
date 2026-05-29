const { test } = require('node:test')
const assert = require('node:assert/strict')
const { validateSuspensionPayload } = require('../src/controllers/adminControlController')

test('validateSuspensionPayload requires reason when suspending', () => {
  assert.throws(
    () => validateSuspensionPayload({ reason: ' ', suspended: true }),
    /Suspension reason is required/,
  )
})

test('validateSuspensionPayload trims suspension reason', () => {
  assert.deepEqual(validateSuspensionPayload({ reason: '  Policy violation  ', suspended: true }), {
    reason: 'Policy violation',
    suspended: true,
  })
})

test('validateSuspensionPayload allows unsuspend without reason', () => {
  assert.deepEqual(validateSuspensionPayload({ suspended: false }), {
    reason: '',
    suspended: false,
  })
})
