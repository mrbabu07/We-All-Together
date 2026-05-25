const Meeting = require('../models/Meeting')
const createContentController = require('./contentControllerFactory')
const { validateMeeting } = require('../validators/contentValidators')

module.exports = createContentController({
  model: Meeting,
  validate: validateMeeting,
  sort: { meetingDate: 1 },
  name: 'Meeting',
})
