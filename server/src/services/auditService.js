const AuditLog = require('../models/AuditLog')

const getActorId = (actor) => {
  if (!actor) {
    return null
  }

  return actor._id || actor
}

const resolveAuditIp = ({ actor = null, ip = '' } = {}) =>
  ip || actor?.$locals?.auditIp || actor?.auditIp || actor?.lastLoginIp || ''

const recordAuditLog = async ({
  action,
  actor = null,
  entityId = null,
  entityType,
  ip = '',
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      action,
      actor: getActorId(actor),
      entityId,
      entityType,
      ip: resolveAuditIp({ actor, ip }),
      metadata,
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Audit log failed:', error.message)
    }
  }
}

module.exports = {
  recordAuditLog,
  resolveAuditIp,
}
