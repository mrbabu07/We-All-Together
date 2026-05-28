const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  getMonthKeysBetween,
  resolveFinanceDateRange,
} = require('../src/utils/financeRange')

test('resolveFinanceDateRange defaults to the last six months', () => {
  const range = resolveFinanceDateRange({}, new Date('2026-05-28T12:00:00Z'))

  assert.deepEqual(range.months, ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05'])
  assert.equal(range.preset, 'last_6_months')
})

test('resolveFinanceDateRange accepts custom dates', () => {
  const range = resolveFinanceDateRange(
    { from: '2026-02-15', range: 'custom', to: '2026-04-02' },
    new Date('2026-05-28T12:00:00Z'),
  )

  assert.deepEqual(range.months, ['2026-02', '2026-03', '2026-04'])
  assert.equal(range.from, '2026-02-15')
  assert.equal(range.to, '2026-04-02')
})

test('getMonthKeysBetween includes start and end months', () => {
  assert.deepEqual(
    getMonthKeysBetween(new Date('2025-12-20T00:00:00Z'), new Date('2026-02-01T00:00:00Z')),
    ['2025-12', '2026-01', '2026-02'],
  )
})
