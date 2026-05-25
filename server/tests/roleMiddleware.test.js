const { test } = require('node:test')
const assert = require('node:assert/strict')
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
