const AuditLog = require('../models/AuditLog')
const asyncHandler = require('../utils/asyncHandler')

const toPositiveInt = (value, fallback, max) => {
  const number = Number(value)

  if (!Number.isInteger(number) || number < 1) {
    return fallback
  }

  return Math.min(number, max)
}

const escapeCsv = (value = '') => {
  const normalized = String(value ?? '')
  if (!/[",\n\r]/.test(normalized)) {
    return normalized
  }

  return `"${normalized.replaceAll('"', '""')}"`
}

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const sendAuditCsv = (res, logs) => {
  const rows = logs.map((log) => [
    log.createdAt?.toISOString?.() || '',
    log.action,
    log.entityType,
    log.actor?.name || 'System',
    log.actor?.phone || '',
    log.ip || '',
    JSON.stringify(log.metadata || {}),
  ])
  const csv = [
    ['timestamp', 'action', 'entityType', 'actor', 'actorPhone', 'ip', 'metadata'],
    ...rows,
  ]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"')
  res.status(200).send(csv)
}

const getAuditLogs = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1, 10000)
  const limit = toPositiveInt(req.query.limit, 50, 200)
  const filter = {}

  if (typeof req.query.action === 'string' && req.query.action.trim()) {
    filter.action = new RegExp(escapeRegex(req.query.action.trim()), 'i')
  }

  if (typeof req.query.entityType === 'string' && req.query.entityType.trim()) {
    filter.entityType = req.query.entityType.trim()
  }

  if (typeof req.query.actor === 'string' && req.query.actor.trim()) {
    filter.actor = req.query.actor.trim()
  }

  if (req.query.from || req.query.to) {
    filter.createdAt = {}
    if (req.query.from) {
      filter.createdAt.$gte = new Date(req.query.from)
    }
    if (req.query.to) {
      filter.createdAt.$lte = new Date(req.query.to)
    }
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actor', 'name phone role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ])

  if (req.query.format === 'csv') {
    sendAuditCsv(res, logs)
    return
  }

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
