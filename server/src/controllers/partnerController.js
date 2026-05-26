const Partner = require('../models/Partner')
const createSimpleCrudController = require('./simpleCrudControllerFactory')

module.exports = createSimpleCrudController({
  auditName: 'Partner',
  fields: [
    { name: 'active', type: 'boolean', default: true },
    { name: 'logo' },
    { name: 'name' },
    { name: 'order', type: 'number', default: 0 },
    { name: 'websiteUrl' },
  ],
  model: Partner,
})
