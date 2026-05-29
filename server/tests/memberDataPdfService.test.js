const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createMemberDataPdf } = require('../src/services/memberDataPdfService')

test('createMemberDataPdf generates a PDF buffer', async () => {
  const buffer = await createMemberDataPdf({
    data: {
      blogs: [{ body: '<p>Community update</p>', moderationStatus: 'approved', title: 'Update' }],
      donations: [{ amount: 500, createdAt: new Date('2026-05-25'), method: 'Cash', status: 'verified' }],
      meetings: [{ location: 'Community hall', meetingDate: new Date('2026-05-20'), title: 'Monthly meeting' }],
      payments: [{ amount: 100, method: 'bKash', month: '2026-05', status: 'verified' }],
      profile: {
        _id: 'member-1',
        address: 'Dargah Para',
        approvedAt: new Date('2026-01-01'),
        email: 'member@example.com',
        name: 'Member User',
        phone: '01710000001',
        role: 'member',
        status: 'approved',
      },
      tours: [{ destination: 'Sylhet', startDate: new Date('2026-06-01'), title: 'Annual tour' }],
    },
  })

  assert.equal(Buffer.isBuffer(buffer), true)
  assert.equal(buffer.subarray(0, 4).toString(), '%PDF')
})
