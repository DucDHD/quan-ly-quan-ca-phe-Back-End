import express from 'express'

import { inventoryController } from '~/controllers/inventoryController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { authorizePermission } from '~/middlewares/permissionMiddleware'
import { PERMISSIONS } from '~/utils/permissions'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, inventoryController.getAllInventory)

export const inventoryRoute = Router