const Activity = require('../models/Activity')
const createContentController = require('./contentControllerFactory')
const { validateActivity } = require('../validators/contentValidators')

module.exports = createContentController({
  model: Activity,
  validate: validateActivity,
  sort: { activityDate: -1 },
  name: 'Activity',
})
