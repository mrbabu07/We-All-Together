const { test } = require('node:test')
const assert = require('node:assert/strict')
const { requireActive, requireOwnership } = require('../src/middlewares/authMiddleware')
const { authorize } = require('../src/middlewares/roleMiddleware')

const runMiddleware = (middleware, req = {}) => {
  let nextError
  let nextCalled = false

  middleware(req, {}, (error) => {
    nextError = error
    nextCalled = true
  })

  return { nextCalled, nextError }
}

test('authorize allows users with an allowed role', () => {
  const result = runMiddleware(authorize('admin'), {
    user: { role: 'admin' },
  })

  assert.equal(result.nextCalled, true)
  assert.equal(result.nextError, undefined)
})

test('authorize rejects users with a disallowed role', () => {
  const result = runMiddleware(authorize('admin'), {
    user: { role: 'member' },
  })

  assert.equal(result.nextCalled, true)
  assert.equal(result.nextError.statusCode, 403)
})

test('authorize rejects missing authenticated users', () => {
  const result = runMiddleware(authorize('admin'))

  assert.equal(result.nextCalled, true)
  assert.equal(result.nextError.statusCode, 401)
})

test('requireActive allows approved non-suspended users', () => {
  const result = runMiddleware(requireActive, {
    user: { status: 'approved' },
  })

  assert.equal(result.nextCalled, true)
  assert.equal(result.nextError, undefined)
})

test('requireActive rejects pending and suspended users', () => {
  const pending = runMiddleware(requireActive, {
    user: { status: 'pending' },
  })
  const suspended = runMiddleware(requireActive, {
    user: { status: 'approved', suspendedAt: new Date(), suspensionReason: 'Policy review' },
  })

  assert.equal(pending.nextError.statusCode, 403)
  assert.equal(suspended.nextError.statusCode, 403)
  assert.match(suspended.nextError.message, /Policy review/)
})

test('requireOwnership enforces resource ownership', () => {
  const allowed = runMiddleware(requireOwnership, {
    params: { id: 'member-1' },
    user: { _id: 'member-1' },
  })
  const rejected = runMiddleware(requireOwnership, {
    params: { id: 'member-2' },
    user: { _id: 'member-1' },
  })

  assert.equal(allowed.nextError, undefined)
  assert.equal(rejected.nextError.statusCode, 403)
})
