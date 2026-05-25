const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  isBangladeshiPhone,
  normalizeBangladeshiPhone,
  toE164BangladeshiPhone,
} = require('../src/utils/phoneUtils')

test('phone utils normalize Bangladeshi numbers', () => {
  assert.equal(normalizeBangladeshiPhone('+8801711111111'), '01711111111')
  assert.equal(isBangladeshiPhone('01711111111'), true)
  assert.equal(toE164BangladeshiPhone('01711111111'), '+8801711111111')
})

test('phone utils reject invalid numbers', () => {
  assert.equal(isBangladeshiPhone('12345'), false)
})
