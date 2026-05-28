const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateBulkPaymentAction,
  validateDonation,
  validateExpense,
  validateMonth,
  validateMonthlyPayment,
  validatePaymentRejection,
} = require('../src/validators/financeValidators')

test('validateMonth accepts YYYY-MM values', () => {
  assert.equal(validateMonth('2026-05'), '2026-05')
})

test('validateMonth rejects invalid month values', () => {
  assert.throws(() => validateMonth('2026-13'), /YYYY-MM/)
})

test('validateMonthlyPayment accepts required payment fields', () => {
  const payload = validateMonthlyPayment({
    month: '2026-05',
    method: 'bKash',
    transactionId: 'TX123',
    senderPhone: '01711111111',
  })

  assert.equal(payload.month, '2026-05')
  assert.equal(payload.method, 'bKash')
  assert.equal(payload.senderPhone, '01711111111')
})

test('validatePaymentRejection requires a reason', () => {
  assert.throws(() => validatePaymentRejection({}), /Rejection reason/)
  assert.equal(validatePaymentRejection({ reason: 'Receipt image is unreadable.' }).reason, 'Receipt image is unreadable.')
})

test('validateBulkPaymentAction accepts selected payment IDs', () => {
  const payload = validateBulkPaymentAction({
    paymentIds: [
      '665000000000000000000001',
      '665000000000000000000001',
      '665000000000000000000002',
    ],
  })

  assert.deepEqual(payload.paymentIds, [
    '665000000000000000000001',
    '665000000000000000000002',
  ])
})

test('validateBulkPaymentAction requires reason for bulk rejection', () => {
  assert.throws(
    () =>
      validateBulkPaymentAction(
        { paymentIds: ['665000000000000000000001'] },
        { requireReason: true },
      ),
    /Rejection reason/,
  )
})

test('validateExpense parses expense date and amount', () => {
  const payload = validateExpense({
    title: 'Community hall rent',
    amount: 1200,
    category: 'Meeting',
    date: '2026-05-25',
  })

  assert.equal(payload.amount, 1200)
  assert.equal(payload.date instanceof Date, true)
})

test('validateDonation rejects zero donation amount', () => {
  assert.throws(
    () =>
      validateDonation({
        donorName: 'Public Donor',
        phone: '01700000000',
        amount: 0,
        method: 'Nagad',
        transactionId: 'DN123',
      }),
    /greater than zero/,
  )
})
