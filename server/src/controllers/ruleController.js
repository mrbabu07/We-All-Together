const Rule = require('../models/Rule')
const createContentController = require('./contentControllerFactory')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { validateRule, validateRuleRestore } = require('../validators/contentValidators')

const baseController = createContentController({
  model: Rule,
  validate: validateRule,
  sort: { order: 1, createdAt: -1 },
  name: 'Rule',
})

const populateRule = (query) =>
  query
    .populate('createdBy', 'name phone role profilePhotoUrl')
    .populate('versionHistory.changedBy', 'name phone role profilePhotoUrl')

const buildHistoryEntry = (rule, changedBy, changeNote) => ({
  audience: rule.audience,
  changeNote,
  changedAt: new Date(),
  changedBy,
  description: rule.description,
  imageUrl: rule.imageUrl,
  order: rule.order,
  richDescription: rule.richDescription || '',
  title: rule.title,
  version: rule.version,
})

const createItem = asyncHandler(async (req, res) => {
  const payload = validateRule(req.body)
  const rule = await Rule.create({
    ...payload,
    createdBy: req.user._id,
    version: 1,
    versionHistory: [],
  })
  await recordAuditLog({
    action: 'rule.create',
    actor: req.user,
    entityId: rule._id,
    entityType: 'Rule',
    metadata: {
      audience: rule.audience,
      title: rule.title,
      version: rule.version,
    },
  })
  const populatedRule = await populateRule(Rule.findById(rule._id))

  res.status(201).json({
    success: true,
    message: 'Rule created successfully.',
    data: { item: populatedRule },
  })
})

const updateItem = asyncHandler(async (req, res) => {
  const payload = validateRule(req.body)
  const rule = await Rule.findById(req.params.id)

  if (!rule) {
    throw new AppError('Rule not found.', 404)
  }

  rule.versionHistory.push(
    buildHistoryEntry(rule, req.user._id, payload.changeNote || 'Updated rule'),
  )
  Object.assign(rule, {
    audience: payload.audience,
    description: payload.description,
    imageUrl: payload.imageUrl,
    order: payload.order,
    richDescription: payload.richDescription,
    title: payload.title,
    version: Number(rule.version || 1) + 1,
  })
  await rule.save()
  await recordAuditLog({
    action: 'rule.update',
    actor: req.user,
    entityId: rule._id,
    entityType: 'Rule',
    metadata: {
      audience: rule.audience,
      title: rule.title,
      version: rule.version,
    },
  })
  const populatedRule = await populateRule(Rule.findById(rule._id))

  res.status(200).json({
    success: true,
    message: 'Rule updated successfully.',
    data: { item: populatedRule },
  })
})

const getVersionHistory = asyncHandler(async (req, res) => {
  const rule = await populateRule(Rule.findById(req.params.id))

  if (!rule) {
    throw new AppError('Rule not found.', 404)
  }

  res.status(200).json({
    success: true,
    message: 'Rule version history loaded successfully.',
    data: {
      history: rule.versionHistory,
      item: rule,
    },
  })
})

const restoreVersion = asyncHandler(async (req, res) => {
  const payload = validateRuleRestore(req.body)
  const version = Number(req.params.version)
  const rule = await Rule.findById(req.params.id)

  if (!rule) {
    throw new AppError('Rule not found.', 404)
  }

  const historyEntry = rule.versionHistory.find((item) => Number(item.version) === version)

  if (!historyEntry) {
    throw new AppError('Rule version not found.', 404)
  }

  rule.versionHistory.push(buildHistoryEntry(rule, req.user._id, payload.changeNote))
  Object.assign(rule, {
    audience: historyEntry.audience,
    description: historyEntry.description,
    imageUrl: historyEntry.imageUrl,
    order: historyEntry.order,
    richDescription: historyEntry.richDescription || '',
    title: historyEntry.title,
    version: Number(rule.version || 1) + 1,
  })
  await rule.save()
  await recordAuditLog({
    action: 'rule.restore',
    actor: req.user,
    entityId: rule._id,
    entityType: 'Rule',
    metadata: {
      restoredVersion: version,
      title: rule.title,
      version: rule.version,
    },
  })
  const populatedRule = await populateRule(Rule.findById(rule._id))

  res.status(200).json({
    success: true,
    message: 'Rule version restored successfully.',
    data: { item: populatedRule },
  })
})

module.exports = {
  ...baseController,
  createItem,
  getVersionHistory,
  restoreVersion,
  updateItem,
}
