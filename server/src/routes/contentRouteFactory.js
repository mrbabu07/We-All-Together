const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const permissionOrAuthorize = (permission, ...roles) =>
  permission ? requirePermission(permission) : authorize(...roles)

const createContentRoutes = (controller, permissions = {}) => {
  const router = express.Router()

  router.get('/public', controller.getPublicItems)
  router.get(
    '/members',
    protect,
    permissionOrAuthorize(permissions.view, USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
    controller.getMemberItems,
  )
  router.post('/', protect, permissionOrAuthorize(permissions.create, USER_ROLES.ADMIN), controller.createItem)
  router.patch('/:id', protect, permissionOrAuthorize(permissions.edit, USER_ROLES.ADMIN), controller.updateItem)
  router.delete('/:id', protect, permissionOrAuthorize(permissions.delete, USER_ROLES.ADMIN), controller.deleteItem)

  return router
}

module.exports = createContentRoutes
