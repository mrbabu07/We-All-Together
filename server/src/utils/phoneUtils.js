const BANGLADESHI_PHONE_PATTERN = /^01[3-9]\d{8}$/
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/
const INTERNATIONAL_DIAL_PREFIX_PATTERN = /^00[1-9]\d{7,14}$/

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

const toE164Phone = (value = '') => {
  const phone = String(value).trim().replace(/[\s()-]/g, '')

  if (E164_PHONE_PATTERN.test(phone)) {
    return phone
  }

  if (INTERNATIONAL_DIAL_PREFIX_PATTERN.test(phone)) {
    return `+${phone.slice(2)}`
  }

  return toE164BangladeshiPhone(phone)
}

module.exports = {
  isBangladeshiPhone,
  normalizeBangladeshiPhone,
  toE164BangladeshiPhone,
  toE164Phone,
}
