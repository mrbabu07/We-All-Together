const CommitteeMember = require('../models/CommitteeMember')
const createSimpleCrudController = require('./simpleCrudControllerFactory')

module.exports = createSimpleCrudController({
  auditName: 'CommitteeMember',
  fields: [
    { name: 'active', type: 'boolean', default: true },
    { name: 'name' },
    { name: 'order', type: 'number', default: 0 },
    { name: 'phone' },
    { name: 'photo' },
    { name: 'position' },
    { name: 'showPhone', type: 'boolean', default: false },
  ],
  model: CommitteeMember,
})
