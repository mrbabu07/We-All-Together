const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateMeeting,
  validateNotice,
  validateTour,
} = require('../src/validators/contentValidators')

test('validateNotice defaults notices to public audience', () => {
  const payload = validateNotice({
    title: 'Weekly update',
    body: 'Meeting will be held on Friday.',
  })

  assert.equal(payload.audience, 'public')
  assert.equal(payload.pinned, false)
})

test('validateMeeting defaults meetings to members audience', () => {
  const payload = validateMeeting({
    title: 'Weekly meeting',
    agenda: 'Finance review',
    meetingDate: '2026-05-29',
    location: 'Community room',
  })

  assert.equal(payload.audience, 'members')
  assert.equal(payload.meetingDate instanceof Date, true)
})

test('validateTour rejects an end date before start date', () => {
  assert.throws(
    () =>
      validateTour({
        title: 'Village tour',
        destination: 'Sylhet',
        startDate: '2026-06-10',
        endDate: '2026-06-08',
      }),
    /End date cannot be before start date/,
  )
})
