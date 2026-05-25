const { test } = require('node:test')
const assert = require('node:assert/strict')
const { buildPaymentVerificationUrl } = require('../src/services/paymentQrService')

test('buildPaymentVerificationUrl creates a client verify URL', () => {
  assert.match(buildPaymentVerificationUrl('payment123'), /\/verify\/payment123$/)
})
