const OrganizationSetting = require('../models/OrganizationSetting')

const DEFAULT_SETTINGS_KEY = 'default'

const getSettings = async () => {
  const settings = await OrganizationSetting.findOneAndUpdate(
    { key: DEFAULT_SETTINGS_KEY },
    { $setOnInsert: { key: DEFAULT_SETTINGS_KEY } },
    { returnDocument: 'after', upsert: true },
  )

  return settings
}

const updateSettings = async (updates) => {
  const settings = await OrganizationSetting.findOneAndUpdate(
    { key: DEFAULT_SETTINGS_KEY },
    { $set: updates, $setOnInsert: { key: DEFAULT_SETTINGS_KEY } },
    {
      returnDocument: 'after',
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true,
    },
  )

  return settings
}

module.exports = {
  getSettings,
  updateSettings,
}
