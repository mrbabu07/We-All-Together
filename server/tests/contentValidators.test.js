const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateMeetingAttendance,
  validateMeetingAdvanced,
  validateMeetingCheckIn,
  validateMeeting,
  validateMeetingRecap,
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

test('validateNotice accepts moderation and scheduling fields', () => {
  const payload = validateNotice({
    audience: 'members',
    body: 'Members only update.',
    category: 'Meeting',
    expiresAt: '2026-06-30T18:00:00.000Z',
    pinned: true,
    richBody: '<p>Members only update.</p>',
    scheduledFor: '2026-06-01T12:00:00.000Z',
    title: 'Scheduled notice',
  })

  assert.equal(payload.audience, 'members')
  assert.equal(payload.category, 'Meeting')
  assert.equal(payload.pinned, true)
  assert.equal(payload.scheduledFor instanceof Date, true)
  assert.equal(payload.expiresAt instanceof Date, true)
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

test('validateMeetingAdvanced accepts agenda action items and attendance mode', () => {
  const payload = validateMeetingAdvanced({
    actionItems: [
      {
        assignedTo: '665f88f930d34b816c9d0001',
        dueDate: '2026-06-05',
        title: 'Call venue manager',
      },
    ],
    agendaItems: [
      {
        details: 'Review all pending items.',
        durationMinutes: 20,
        order: 2,
        title: 'Finance update',
      },
    ],
    attendanceMode: 'otp',
    attendanceOtp: '884422',
    minutes: 'Draft minutes.',
    minutesRichText: '<p>Draft minutes.</p>',
    minutesStatus: 'published',
  })

  assert.equal(payload.agendaItems.length, 1)
  assert.equal(payload.agendaItems[0].durationMinutes, 20)
  assert.equal(payload.actionItems[0].assignedTo, '665f88f930d34b816c9d0001')
  assert.equal(payload.actionItems[0].dueDate instanceof Date, true)
  assert.equal(payload.attendanceMode.active, true)
  assert.equal(payload.attendanceMode.method, 'otp')
  assert.equal(payload.attendanceMode.otp, '884422')
  assert.equal(payload.minutesStatus, 'published')
})

test('validateMeetingCheckIn and recap sanitize text payloads', () => {
  assert.equal(validateMeetingCheckIn({ code: ' 884422 ' }).code, '884422')
  assert.equal(validateMeetingRecap({ message: ' Recap ready ' }).message, 'Recap ready')
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
