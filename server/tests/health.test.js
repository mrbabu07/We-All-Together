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

test('public namespace aliases existing public routes', async () => {
  const response = await request(app).get('/api/v1/public/health').expect(200)

  assert.equal(response.body.success, true)
  assert.equal(response.body.data.database, 'disconnected')
})

test('admin and member namespace aliases keep auth protection', async () => {
  await request(app).get('/api/v1/admin/controls').expect(401)
  await request(app).get('/api/v1/member/fees/my-status').expect(401)
  await request(app).get('/api/v1/member/donations/my').expect(401)
})
