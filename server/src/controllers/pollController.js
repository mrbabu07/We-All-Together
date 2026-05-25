const Meeting = require('../models/Meeting')
const Poll = require('../models/Poll')
const { recordAuditLog } = require('../services/auditService')
const AppError = require('../utils/appError')
const asyncHandler = require('../utils/asyncHandler')
const { validatePoll, validatePollVote } = require('../validators/pollValidators')

const populatePoll = (query) =>
  query.populate('meetingId', 'title meetingDate location').populate('createdBy', 'name phone')

const serializePoll = (poll, viewerId = '') => {
  const raw = typeof poll.toObject === 'function' ? poll.toObject() : poll
  const viewer = String(viewerId || '')
  let selectedOptionId = ''
  const options = raw.options.map((option) => {
    const votes = option.votes || []
    const hasMyVote = votes.some((vote) => String(vote?._id || vote) === viewer)

    if (hasMyVote) {
      selectedOptionId = String(option._id)
    }

    return {
      _id: option._id,
      hasMyVote,
      text: option.text,
      voteCount: votes.length,
    }
  })

  return {
    ...raw,
    hasVoted: Boolean(selectedOptionId),
    isClosed: new Date(raw.deadline) <= new Date(),
    options,
    selectedOptionId,
    totalVotes: options.reduce((sum, option) => sum + option.voteCount, 0),
  }
}

const getPolls = asyncHandler(async (req, res) => {
  const filter = {}

  if (req.query.meetingId) {
    filter.meetingId = req.query.meetingId
  }

  const polls = await populatePoll(Poll.find(filter).sort({ deadline: 1, createdAt: -1 }))

  res.status(200).json({
    success: true,
    message: 'Polls loaded successfully.',
    data: {
      polls: polls.map((poll) => serializePoll(poll, req.user?._id)),
    },
  })
})

const getPoll = asyncHandler(async (req, res) => {
  const poll = await populatePoll(Poll.findById(req.params.id))

  if (!poll) {
    throw new AppError('Poll not found.', 404)
  }

  res.status(200).json({
    success: true,
    message: 'Poll loaded successfully.',
    data: {
      poll: serializePoll(poll, req.user?._id),
    },
  })
})

const createPoll = asyncHandler(async (req, res) => {
  const payload = validatePoll(req.body)
  const meeting = await Meeting.findById(payload.meetingId)

  if (!meeting) {
    throw new AppError('Meeting not found.', 404)
  }

  const poll = await Poll.create({
    ...payload,
    createdBy: req.user._id,
  })
  await recordAuditLog({
    action: 'poll.create',
    actor: req.user,
    entityId: poll._id,
    entityType: 'Poll',
    metadata: {
      meeting: meeting.title,
      options: poll.options.length,
      question: poll.question,
    },
  })

  const populatedPoll = await populatePoll(Poll.findById(poll._id))

  res.status(201).json({
    success: true,
    message: 'Poll created successfully.',
    data: {
      poll: serializePoll(populatedPoll, req.user?._id),
    },
  })
})

const votePoll = asyncHandler(async (req, res) => {
  const payload = validatePollVote(req.body)
  const poll = await Poll.findById(req.params.id)

  if (!poll) {
    throw new AppError('Poll not found.', 404)
  }

  if (new Date(poll.deadline) <= new Date()) {
    throw new AppError('This poll is closed.', 400)
  }

  const alreadyVoted = poll.options.some((option) =>
    option.votes.some((vote) => String(vote) === String(req.user._id)),
  )

  if (alreadyVoted) {
    throw new AppError('You have already voted in this poll.', 400)
  }

  const selectedOption = poll.options.id(payload.optionId)

  if (!selectedOption) {
    throw new AppError('Poll option not found.', 404)
  }

  selectedOption.votes.push(req.user._id)
  await poll.save()
  await recordAuditLog({
    action: 'poll.vote',
    actor: req.user,
    entityId: poll._id,
    entityType: 'Poll',
    metadata: {
      option: selectedOption.text,
      question: poll.question,
    },
  })

  const populatedPoll = await populatePoll(Poll.findById(poll._id))

  res.status(200).json({
    success: true,
    message: 'Vote submitted successfully.',
    data: {
      poll: serializePoll(populatedPoll, req.user?._id),
    },
  })
})

module.exports = {
  createPoll,
  getPoll,
  getPolls,
  serializePoll,
  votePoll,
}
