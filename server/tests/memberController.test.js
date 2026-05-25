const { test } = require('node:test')
const assert = require('node:assert/strict')
const { USER_ROLES, USER_STATUSES } = require('../src/constants/userConstants')

test('user role and status constants support admin member management', () => {
  assert.deepEqual(Object.values(USER_ROLES).sort(), ['admin', 'member', 'moderator'])
  assert.deepEqual(Object.values(USER_STATUSES).sort(), ['approved', 'pending', 'rejected'])
})
