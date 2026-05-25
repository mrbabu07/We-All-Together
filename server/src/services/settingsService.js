const OrganizationSetting = require('../models/OrganizationSetting')

const DEFAULT_SETTINGS_KEY = 'default'

const getSettings = async () => {
  const settings = await OrganizationSetting.findOneAndUpdate(
    { key: DEFAULT_SETTINGS_KEY },
    { $setOnInsert: { key: DEFAULT_SETTINGS_KEY } },
    { new: true, upsert: true },
  )

  return settings
}

module.exports = {
  getSettings,
}
