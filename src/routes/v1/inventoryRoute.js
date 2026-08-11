import express from 'express'

import { inventoryController } from '~/controllers/inventoryController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { inventoryValidation } from '~/validations/inventoryValidation'
import { authorizePermission } from '~/middlewares/permissionMiddleware'
import { PERMISSIONS } from '~/utils/permissions'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, authorizePermission('inventorys', PERMISSIONS.VIEW), inventoryController.getAllInventory)
  .post(authMiddleware.isAuthorized, inventoryValidation.createInventory, authorizePermission('inventorys', PERMISSIONS.CREATE), inventoryController.createInventory)

Router.route('/categories')
  .get(authMiddleware.isAuthorized, authorizePermission('inventorys', PERMISSIONS.VIEW), inventoryController.getAllInventoryCategories)
  .post(authMiddleware.isAuthorized, inventoryValidation.createNew, authorizePermission('inventorys', PERMISSIONS.CREATE), inventoryController.createNew)

Router.route('/categories/:id')
  .get(authMiddleware.isAuthorized, authorizePermission('inventorys', PERMISSIONS.VIEW), inventoryController.getInventoryDetail)
  .put(authMiddleware.isAuthorized, inventoryValidation.updateInventoryAndCategory, authorizePermission('inventorys', PERMISSIONS.UPDATE), inventoryController.updateInventoryAndCategory)
  .delete(authMiddleware.isAuthorized, authorizePermission('inventorys', PERMISSIONS.DELETE), inventoryController.deleteInventory)

Router.route('/exports')
  .post(authMiddleware.isAuthorized, inventoryValidation.exports, authorizePermission('inventorys', PERMISSIONS.CREATE), inventoryController.exports)

export const inventoryRoute = Router