const AppError = require('./appError')

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

const toUtcMonthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))

const toUtcDayStart = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const toUtcDayEnd = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))

const addUtcMonths = (date, amount) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))

const toMonthKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

const parseDate = (value, label) => {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    throw new AppError(`${label} must be a valid date.`, 400)
  }

  return date
}

const getMonthKeysBetween = (startDate, endDate) => {
  const months = []
  let cursor = toUtcMonthStart(startDate)
  const endMonth = toUtcMonthStart(endDate)

  while (cursor <= endMonth) {
    months.push(toMonthKey(cursor))
    cursor = addUtcMonths(cursor, 1)
  }

  return months
}

const resolveFinanceDateRange = (query = {}, now = new Date()) => {
  const preset = query.range || query.preset || 'last_6_months'
  const currentMonthStart = toUtcMonthStart(now)
  let startDate
  let endDate = toUtcDayEnd(now)

  if (preset === 'this_month') {
    startDate = currentMonthStart
  } else if (preset === 'last_3_months') {
    startDate = addUtcMonths(currentMonthStart, -2)
  } else if (preset === 'this_year') {
    startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  } else if (preset === 'custom') {
    startDate = toUtcDayStart(parseDate(query.from || query.startDate, 'Start date'))
    endDate = toUtcDayEnd(parseDate(query.to || query.endDate, 'End date'))
  } else {
    startDate = addUtcMonths(currentMonthStart, -5)
  }

  if (startDate > endDate) {
    throw new AppError('Start date cannot be after end date.', 400)
  }

  const months = getMonthKeysBetween(startDate, endDate)
  if (months.length > 36) {
    throw new AppError('Finance report range cannot exceed 36 months.', 400)
  }

  return {
    currentMonth: toMonthKey(currentMonthStart),
    endDate,
    from: startDate.toISOString().slice(0, 10),
    months,
    preset: ['this_month', 'last_3_months', 'this_year', 'custom'].includes(preset)
      ? preset
      : 'last_6_months',
    startDate,
    to: endDate.toISOString().slice(0, 10),
  }
}

module.exports = {
  MONTH_PATTERN,
  getMonthKeysBetween,
  resolveFinanceDateRange,
  toMonthKey,
}
