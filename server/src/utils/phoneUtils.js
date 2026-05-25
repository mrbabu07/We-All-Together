const BANGLADESHI_PHONE_PATTERN = /^01[3-9]\d{8}$/

const normalizeBangladeshiPhone = (value = '') => {
  const phone = String(value).trim().replace(/[\s-]/g, '')

  if (phone.startsWith('+88')) {
    return phone.slice(3)
  }

  if (phone.startsWith('88') && phone.length === 13) {
    return phone.slice(2)
  }

  return phone
}

const isBangladeshiPhone = (value) => BANGLADESHI_PHONE_PATTERN.test(normalizeBangladeshiPhone(value))

const toE164BangladeshiPhone = (value) => `+88${normalizeBangladeshiPhone(value)}`

module.exports = {
  isBangladeshiPhone,
  normalizeBangladeshiPhone,
  toE164BangladeshiPhone,
}
