const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createReceiptPdf } = require('../src/services/receiptPdfService')

test('createReceiptPdf generates a PDF buffer', async () => {
  const buffer = await createReceiptPdf({
    amount: 150,
    date: new Date('2026-05-26'),
    method: 'bKash',
    organization: {
      name: 'Dargah Para OIkko Porishod',
    },
    payerName: 'Member User',
    payerPhone: '01710000001',
    receiptNo: 'PAY-test',
    status: 'pending',
    transactionId: 'TX123',
    type: 'Monthly member fee',
  })

  assert.equal(Buffer.isBuffer(buffer), true)
  assert.equal(buffer.subarray(0, 4).toString(), '%PDF')
})
