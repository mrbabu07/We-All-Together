const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateRegistration,
  validateRegistrationFee,
} = require('../src/validators/registrationValidators')

test('validateRegistration accepts complete registration payload', () => {
  const payload = validateRegistration({
    name: 'Rahim Uddin',
    phone: '01700000000',
    address: 'Dargah Para',
    password: 'secret123',
    paymentMethod: 'bKash',
    transactionId: 'TX12345',
    senderPhone: '01711111111',
  })

  assert.equal(payload.name, 'Rahim Uddin')
  assert.equal(payload.payment.method, 'bKash')
})

test('validateRegistration rejects short passwords', () => {
  assert.throws(
    () =>
      validateRegistration({
        name: 'Rahim Uddin',
        phone: '01700000000',
        address: 'Dargah Para',
        password: '123',
        paymentMethod: 'bKash',
        transactionId: 'TX12345',
        senderPhone: '01711111111',
      }),
    /Password must be at least 6 characters/,
  )
})

test('validateRegistrationFee accepts zero or positive amounts', () => {
  assert.deepEqual(validateRegistrationFee({ registrationFee: 500 }), {
    registrationFee: 500,
  })
})
