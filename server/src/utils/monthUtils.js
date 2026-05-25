const monthKeyFromDate = (value) => {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const getRecentMonthKeys = (count = 6, referenceDate = new Date()) => {
  const months = []
  const cursor = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1)
    months.push(monthKeyFromDate(date))
  }

  return months
}

const monthStartFromKey = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

module.exports = {
  getRecentMonthKeys,
  monthKeyFromDate,
  monthStartFromKey,
}
