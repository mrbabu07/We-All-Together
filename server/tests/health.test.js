const { test } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

process.env.NODE_ENV = 'test'

const app = require('../src/app')

test('GET / returns API welcome response', async () => {
  const response = await request(app).get('/').expect(200)

  assert.equal(response.body.success, true)
  assert.match(response.body.message, /Dargah Para/)
})

test('GET /api/v1/health returns API health data', async () => {
  const response = await request(app).get('/api/v1/health').expect(200)

  assert.equal(response.body.success, true)
  assert.equal(response.body.data.database, 'disconnected')
  assert.ok(response.body.data.timestamp)
})
