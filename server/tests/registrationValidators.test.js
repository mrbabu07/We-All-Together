const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  validateRegistration,
  validateRegistrationFee,
  validateRejectRegistration,
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
    proofImageUrl: 'https://example.com/registration-proof.jpg',
    profilePhotoUrl: 'https://example.com/profile.jpg',
    nidImageUrl: 'https://example.com/nid.jpg',
  })

  assert.equal(payload.name, 'Rahim Uddin')
  assert.equal(payload.nidImageUrl, 'https://example.com/nid.jpg')
  assert.equal(payload.profilePhotoUrl, 'https://example.com/profile.jpg')
  assert.equal(payload.payment.method, 'bKash')
  assert.equal(payload.payment.proofImageUrl, 'https://example.com/registration-proof.jpg')
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

test('validateRegistration requires at least one identity document', () => {
  assert.throws(
    () =>
      validateRegistration({
        name: 'Rahim Uddin',
        phone: '01700000000',
        address: 'Dargah Para',
        password: 'secret123',
        paymentMethod: 'bKash',
        transactionId: 'TX12345',
        senderPhone: '01711111111',
        proofImageUrl: 'https://example.com/registration-proof.jpg',
      }),
    /At least one identity document is required/,
  )
})

test('validateRegistrationFee accepts zero or positive amounts', () => {
  assert.deepEqual(validateRegistrationFee({ registrationFee: 500 }), {
    registrationFee: 500,
  })
})

test('validateRejectRegistration requires a rejection reason', () => {
  assert.throws(() => validateRejectRegistration({ reason: '' }), /Reject reason is required/)

  assert.deepEqual(validateRejectRegistration({ reason: 'Missing document' }), {
    reason: 'Missing document',
  })
})
