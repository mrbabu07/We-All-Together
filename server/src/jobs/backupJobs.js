const cron = require('node-cron')
const { getSettings } = require('../services/settingsService')

let backupJob

const startAutoBackupJob = () => {
  if (backupJob) {
    return backupJob
  }

  backupJob = cron.schedule('0 3 * * *', async () => {
    const settings = await getSettings()

    if (settings.securityControls?.autoBackupSchedule === 'off') {
      return
    }

    console.log(
      `Auto backup reminder: ${settings.securityControls.autoBackupSchedule} schedule is enabled.`,
    )
  })

  return backupJob
}

module.exports = {
  startAutoBackupJob,
}
