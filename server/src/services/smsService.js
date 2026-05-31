const twilio = require('twilio')
const env = require('../config/env')
const { toE164Phone } = require('../utils/phoneUtils')

const isConfiguredValue = (value) => {
  const normalized = String(value || '').trim()

  return Boolean(
    normalized &&
      !/^\[[^\]]+\]$/.test(normalized) &&
      !/^(replace_|your_|example_|xxx)/i.test(normalized),
  )
}

const hasTwilioCredentials = () =>
  Boolean(
    isConfiguredValue(env.twilioAccountSid) &&
      isConfiguredValue(env.twilioAuthToken) &&
      (isConfiguredValue(env.twilioSmsFrom) || isConfiguredValue(env.twilioWhatsappFrom)),
  )

const getTwilioClient = () => twilio(env.twilioAccountSid, env.twilioAuthToken)

const formatFrom = (channel) => {
  if (channel === 'whatsapp') {
    if (!isConfiguredValue(env.twilioWhatsappFrom)) {
      return ''
    }

    return env.twilioWhatsappFrom.startsWith('whatsapp:')
      ? env.twilioWhatsappFrom
      : `whatsapp:${env.twilioWhatsappFrom}`
  }

  return isConfiguredValue(env.twilioSmsFrom) ? env.twilioSmsFrom : ''
}

const formatTo = (phone, channel) => {
  const to = toE164Phone(phone)
  return channel === 'whatsapp' ? `whatsapp:${to}` : to
}

const sendTextMessage = async ({ body, channel = 'sms', phone }) => {
  const from = formatFrom(channel)

  if (!phone) {
    return {
      channel,
      phone,
      provider: 'twilio',
      skipped: true,
      reason: 'Recipient phone is missing.',
    }
  }

  if (!hasTwilioCredentials() || !from) {
    return {
      channel,
      phone,
      provider: 'twilio',
      skipped: true,
      reason: 'Twilio credentials or sender number are not configured.',
    }
  }

  const message = await getTwilioClient().messages.create({
    body,
    from,
    to: formatTo(phone, channel),
  })

  return {
    channel,
    phone,
    provider: 'twilio',
    sid: message.sid,
    status: message.status,
    skipped: false,
  }
}

const sendBulkTextMessages = async ({ body, channel = 'sms', phones }) => {
  const uniquePhones = [...new Set(phones.filter(Boolean))]

  const results = []
  for (const phone of uniquePhones) {
    try {
      results.push(await sendTextMessage({ body, channel, phone }))
    } catch (error) {
      results.push({
        channel,
        error: error.message,
        phone,
        provider: 'twilio',
        skipped: false,
      })
    }
  }

  return results
}

const getSmsGatewayBalance = async () => {
  if (!hasTwilioCredentials()) {
    return {
      balance: null,
      configured: false,
      currency: '',
      provider: 'twilio',
      reason: 'Twilio credentials are not configured.',
    }
  }

  try {
    const balance = await getTwilioClient().api.v2010.accounts(env.twilioAccountSid).balance.fetch()

    return {
      balance: balance.balance,
      configured: true,
      currency: balance.currency,
      provider: 'twilio',
    }
  } catch (error) {
    return {
      balance: null,
      configured: true,
      currency: '',
      error: error.message,
      provider: 'twilio',
    }
  }
}

module.exports = {
  getSmsGatewayBalance,
  sendBulkTextMessages,
  sendTextMessage,
}
