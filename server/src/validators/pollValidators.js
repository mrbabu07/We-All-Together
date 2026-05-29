const mongoose = require('mongoose')
const AppError = require('../utils/appError')

const requireString = (body, fieldName, label = fieldName) => {
  const value = body[fieldName]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${label} is required.`, 400)
  }

  return value.trim()
}

const readObjectId = (body, fieldName, label = fieldName) => {
  const value = requireString(body, fieldName, label)

  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`${label} is invalid.`, 400)
  }

  return value
}

const readOptionalObjectId = (body, fieldName, label = fieldName) => {
  const value = typeof body[fieldName] === 'string' ? body[fieldName].trim() : ''

  if (!value) {
    return null
  }

  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`${label} is invalid.`, 400)
  }

  return value
}

const readDeadline = (body) => {
  const deadline = new Date(requireString(body, 'deadline', 'Deadline'))

  if (Number.isNaN(deadline.getTime())) {
    throw new AppError('Deadline must be valid.', 400)
  }

  if (deadline <= new Date()) {
    throw new AppError('Deadline must be in the future.', 400)
  }

  return deadline
}

const validatePoll = (body) => {
  const options = Array.isArray(body.options)
    ? body.options.map((option) =>
        typeof option === 'string' ? option.trim() : String(option?.text || '').trim(),
      )
    : []
  const uniqueOptions = [...new Set(options.filter(Boolean))]

  if (uniqueOptions.length < 2) {
    throw new AppError('At least two poll options are required.', 400)
  }
  if (uniqueOptions.length > 6) {
    throw new AppError('A poll can have up to six options.', 400)
  }

  return {
    deadline: readDeadline(body),
    meetingId: readOptionalObjectId(body, 'meetingId', 'Meeting'),
    options: uniqueOptions.map((text) => ({ text, votes: [] })),
    question: requireString(body, 'question', 'Question'),
  }
}

const validatePollVote = (body) => ({
  optionId: readObjectId(body, 'optionId', 'Option'),
})

module.exports = {
  validatePoll,
  validatePollVote,
}
