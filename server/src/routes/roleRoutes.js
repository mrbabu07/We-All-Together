const express = require('express')
const {
  createRole,
  deleteRole,
  getRoleMembers,
  getRoles,
  updateRole,
} = require('../controllers/roleController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.use(protect, requirePermission('settings.roles'))

router.get('/', getRoles)
router.post('/', createRole)
router.put('/:id', updateRole)
router.patch('/:id', updateRole)
router.delete('/:id', deleteRole)
router.get('/:id/members', getRoleMembers)

module.exports = router
