const assert = require('node:assert/strict')
const test = require('node:test')
const { validatePoll, validatePollVote } = require('../src/validators/pollValidators')

test('validatePoll accepts meeting question options and future deadline', () => {
  const payload = validatePoll({
    deadline: new Date(Date.now() + 86400000).toISOString(),
    meetingId: '665f4f5b5f0f7b5f4f5b5f0f',
    options: ['Yes', 'No', 'Yes'],
    question: 'Should we approve the tour budget?',
  })

  assert.equal(payload.options.length, 2)
  assert.equal(payload.options[0].text, 'Yes')
})

test('validatePoll accepts optional meeting attachment', () => {
  const payload = validatePoll({
    deadline: new Date(Date.now() + 86400000).toISOString(),
    options: ['Friday', 'Saturday'],
    question: 'Preferred gathering day?',
  })

  assert.equal(payload.meetingId, null)
  assert.equal(payload.options.length, 2)
})

test('validatePoll rejects fewer than two options', () => {
  assert.throws(
    () =>
      validatePoll({
        deadline: new Date(Date.now() + 86400000).toISOString(),
        meetingId: '665f4f5b5f0f7b5f4f5b5f0f',
        options: ['Only option'],
        question: 'Incomplete poll?',
      }),
    /At least two poll options/,
  )
})

test('validatePoll rejects more than six options', () => {
  assert.throws(
    () =>
      validatePoll({
        deadline: new Date(Date.now() + 86400000).toISOString(),
        options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        question: 'Too many options?',
      }),
    /up to six options/,
  )
})

test('validatePollVote requires a valid option id', () => {
  const payload = validatePollVote({
    optionId: '665f4f5b5f0f7b5f4f5b5f0f',
  })

  assert.equal(payload.optionId, '665f4f5b5f0f7b5f4f5b5f0f')
})
