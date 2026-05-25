const Activity = require('../models/Activity')
const AuditLog = require('../models/AuditLog')
const Blog = require('../models/Blog')
const Donation = require('../models/Donation')
const Expense = require('../models/Expense')
const GalleryItem = require('../models/GalleryItem')
const Meeting = require('../models/Meeting')
const Notice = require('../models/Notice')
const Notification = require('../models/Notification')
const Payment = require('../models/Payment')
const Rule = require('../models/Rule')
const Tour = require('../models/Tour')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const { getSettings } = require('../services/settingsService')
const { recordAuditLog } = require('../services/auditService')

const exportBackup = asyncHandler(async (req, res) => {
  const [
    activities,
    auditLogs,
    blogs,
    donations,
    expenses,
    galleryItems,
    meetings,
    notices,
    notifications,
    payments,
    rules,
    settings,
    tours,
    users,
  ] = await Promise.all([
    Activity.find().lean(),
    AuditLog.find().lean(),
    Blog.find().lean(),
    Donation.find().lean(),
    Expense.find().lean(),
    GalleryItem.find().lean(),
    Meeting.find().lean(),
    Notice.find().lean(),
    Notification.find().lean(),
    Payment.find().lean(),
    Rule.find().lean(),
    getSettings(),
    Tour.find().lean(),
    User.find().lean(),
  ])

  await recordAuditLog({
    action: 'backup.export',
    actor: req.user,
    entityType: 'Backup',
    metadata: {
      collections: 14,
    },
  })

  res.setHeader('Content-Disposition', 'attachment; filename="dargah-para-backup.json"')

  res.status(200).json({
    success: true,
    message: 'Backup exported successfully.',
    data: {
      generatedAt: new Date(),
      organization: 'Dargah Para OIkko Porishod',
      collections: {
        activities,
        auditLogs,
        blogs,
        donations,
        expenses,
        galleryItems,
        meetings,
        notices,
        notifications,
        payments,
        rules,
        settings,
        tours,
        users,
      },
    },
  })
})

module.exports = {
  exportBackup,
}
