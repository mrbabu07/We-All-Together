const AuditLog = require('../models/AuditLog')
const asyncHandler = require('../utils/asyncHandler')

const toPositiveInt = (value, fallback, max) => {
  const number = Number(value)

  if (!Number.isInteger(number) || number < 1) {
    return fallback
  }

  return Math.min(number, max)
}

const getAuditLogs = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1, 10000)
  const limit = toPositiveInt(req.query.limit, 50, 200)
  const filter = {}

  if (typeof req.query.action === 'string' && req.query.action.trim()) {
    filter.action = req.query.action.trim()
  }

  if (typeof req.query.entityType === 'string' && req.query.entityType.trim()) {
    filter.entityType = req.query.entityType.trim()
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actor', 'name phone role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    message: 'Audit logs loaded successfully.',
    data: {
      limit,
      logs,
      page,
      total,
    },
  })
})

module.exports = {
  getAuditLogs,
}
