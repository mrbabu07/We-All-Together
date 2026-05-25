const { test } = require('node:test')
const assert = require('node:assert/strict')
const { getRecentMonthKeys, monthKeyFromDate } = require('../src/utils/monthUtils')

test('monthKeyFromDate formats dates as YYYY-MM', () => {
  assert.equal(monthKeyFromDate(new Date(2026, 4, 26)), '2026-05')
})

test('getRecentMonthKeys returns oldest to newest month keys', () => {
  assert.deepEqual(getRecentMonthKeys(3, new Date(2026, 4, 26)), [
    '2026-03',
    '2026-04',
    '2026-05',
  ])
})
