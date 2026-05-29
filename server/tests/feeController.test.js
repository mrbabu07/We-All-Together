const { test } = require('node:test')
const assert = require('node:assert/strict')
const { validateFeePaymentDetails } = require('../src/controllers/feeController')

test('validateFeePaymentDetails accepts required fee payment details', () => {
  assert.deepEqual(
    validateFeePaymentDetails({
      method: 'bKash',
      proofImageUrl: 'https://example.com/proof.jpg',
      senderPhone: '+8801711111111',
      transactionId: 'TX12345',
    }),
    {
      method: 'bKash',
      proofImageUrl: 'https://example.com/proof.jpg',
      senderPhone: '01711111111',
      transactionId: 'TX12345',
    },
  )
})

test('validateFeePaymentDetails requires proof image', () => {
  assert.throws(
    () =>
      validateFeePaymentDetails({
        method: 'bKash',
        senderPhone: '01711111111',
        transactionId: 'TX12345',
      }),
    /proof image are required/,
  )
})

test('validateFeePaymentDetails rejects invalid sender phone', () => {
  assert.throws(
    () =>
      validateFeePaymentDetails({
        method: 'bKash',
        proofImageUrl: 'https://example.com/proof.jpg',
        senderPhone: '12345',
        transactionId: 'TX12345',
      }),
    /Sender phone must use Bangladeshi format/,
  )
})
