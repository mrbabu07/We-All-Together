const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateMeetingAttendance,
  validateMeeting,
  validateNotice,
  validateRsvp,
  validateTour,
  validateTourParticipants,
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

test('validateMeetingAttendance accepts member status rows', () => {
  const payload = validateMeetingAttendance({
    attendance: [{ member: '665f88f930d34b816c9d0001', status: 'present' }],
    minutes: 'Decision recorded.',
  })

  assert.equal(payload.attendance.length, 1)
  assert.equal(payload.attendance[0].status, 'present')
  assert.equal(payload.minutes, 'Decision recorded.')
})

test('validateTourParticipants accepts cost tracking rows', () => {
  const payload = validateTourParticipants({
    participants: [
      {
        amountDue: 500,
        member: '665f88f930d34b816c9d0001',
        paidAmount: 200,
        status: 'confirmed',
      },
    ],
  })

  assert.equal(payload.participants.length, 1)
  assert.equal(payload.participants[0].amountDue, 500)
  assert.equal(payload.participants[0].status, 'confirmed')
})

test('validateRsvp accepts going maybe and not going statuses', () => {
  assert.equal(validateRsvp({ status: 'going' }).status, 'going')
  assert.equal(validateRsvp({ status: 'maybe' }).status, 'maybe')
  assert.equal(validateRsvp({ status: 'not_going' }).status, 'not_going')
})
