const Notice = require('../models/Notice')
const createContentController = require('./contentControllerFactory')
const { validateNotice } = require('../validators/contentValidators')

module.exports = createContentController({
  model: Notice,
  validate: validateNotice,
  sort: { pinned: -1, createdAt: -1 },
  name: 'Notice',
})
