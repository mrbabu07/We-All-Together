const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')

const toBoolean = (value, fallback = false) =>
  value === undefined ? fallback : value === true || value === 'true'

const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const sanitizePayload = (body, fields) =>
  fields.reduce((payload, field) => {
    const value = body[field.name]

    if (value === undefined) {
      return payload
    }

    if (field.type === 'boolean') {
      payload[field.name] = toBoolean(value, field.default)
      return payload
    }

    if (field.type === 'number') {
      payload[field.name] = toNumber(value, field.default)
      return payload
    }

    payload[field.name] = typeof value === 'string' ? value.trim() : value
    return payload
  }, {})

const getOrderedIds = (body) => {
  if (Array.isArray(body.orderedIds)) {
    return body.orderedIds
  }

  if (Array.isArray(body.ids)) {
    return body.ids
  }

  return []
}

const createSimpleCrudController = ({ auditName, fields, model, publicFilter = { active: true } }) => {
  const getPublicItems = asyncHandler(async (req, res) => {
    const items = await model.find(publicFilter).sort({ order: 1, createdAt: -1 })

    res.status(200).json({
      success: true,
      message: `${auditName} loaded successfully.`,
      data: { items },
    })
  })

  const getAdminItems = asyncHandler(async (req, res) => {
    const items = await model.find().sort({ order: 1, createdAt: -1 })

    res.status(200).json({
      success: true,
      message: `${auditName} loaded successfully.`,
      data: { items },
    })
  })

  const createItem = asyncHandler(async (req, res) => {
    const item = await model.create(sanitizePayload(req.body, fields))

    await recordAuditLog({
      action: `${auditName.toLowerCase()}.create`,
      actor: req.user,
      entityId: item._id,
      entityType: auditName,
      metadata: { name: item.name || item.title },
    })

    res.status(201).json({
      success: true,
      message: `${auditName} created successfully.`,
      data: { item },
    })
  })

  const updateItem = asyncHandler(async (req, res) => {
    const item = await model.findById(req.params.id)

    if (!item) {
      throw new AppError(`${auditName} not found.`, 404)
    }

    Object.assign(item, sanitizePayload(req.body, fields))
    await item.save()
    await recordAuditLog({
      action: `${auditName.toLowerCase()}.update`,
      actor: req.user,
      entityId: item._id,
      entityType: auditName,
      metadata: { name: item.name || item.title },
    })

    res.status(200).json({
      success: true,
      message: `${auditName} updated successfully.`,
      data: { item },
    })
  })

  const deleteItem = asyncHandler(async (req, res) => {
    const item = await model.findById(req.params.id)

    if (!item) {
      throw new AppError(`${auditName} not found.`, 404)
    }

    await item.deleteOne()
    await recordAuditLog({
      action: `${auditName.toLowerCase()}.delete`,
      actor: req.user,
      entityId: req.params.id,
      entityType: auditName,
      metadata: { name: item.name || item.title },
    })

    res.status(200).json({
      success: true,
      message: `${auditName} deleted successfully.`,
      data: { id: req.params.id },
    })
  })

  const reorderItems = asyncHandler(async (req, res) => {
    const orderedIds = [
      ...new Set(
        getOrderedIds(req.body)
          .map((id) => String(id || '').trim())
          .filter(Boolean),
      ),
    ]

    if (!orderedIds.length) {
      throw new AppError('Ordered item IDs are required.', 400)
    }

    const existingCount = await model.countDocuments({ _id: { $in: orderedIds } })
    if (existingCount !== orderedIds.length) {
      throw new AppError(`Some ${auditName} items were not found.`, 404)
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        model.findByIdAndUpdate(id, {
          order: index,
        }),
      ),
    )

    await recordAuditLog({
      action: `${auditName.toLowerCase()}.reorder`,
      actor: req.user,
      entityType: auditName,
      metadata: { orderedIds },
    })

    const items = await model.find().sort({ order: 1, createdAt: -1 })

    res.status(200).json({
      success: true,
      message: `${auditName} reordered successfully.`,
      data: { items },
    })
  })

  return {
    createItem,
    deleteItem,
    getAdminItems,
    getPublicItems,
    reorderItems,
    updateItem,
  }
}

module.exports = createSimpleCrudController
