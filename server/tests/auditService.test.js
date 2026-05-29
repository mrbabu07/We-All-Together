const { test } = require('node:test')
const assert = require('node:assert/strict')
const { resolveAuditIp } = require('../src/services/auditService')

test('resolveAuditIp prefers explicit IP', () => {
  assert.equal(
    resolveAuditIp({
      actor: { $locals: { auditIp: '10.0.0.2' } },
      ip: '10.0.0.1',
    }),
    '10.0.0.1',
  )
})

test('resolveAuditIp falls back to authenticated request context', () => {
  assert.equal(resolveAuditIp({ actor: { $locals: { auditIp: '10.0.0.2' } } }), '10.0.0.2')
})
