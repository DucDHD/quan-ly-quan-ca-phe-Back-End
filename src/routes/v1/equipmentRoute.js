import express from 'express'

import { authMiddleware } from '~/middlewares/authMiddleware'
import { equipmentController } from '~/controllers/equipmentController'
import { equipmentValidation } from '~/validations/equimentValidation'
import { authorizePermission } from '~/middlewares/permissionMiddleware'
import { PERMISSIONS } from '~/utils/permissions'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, authorizePermission('equipments', PERMISSIONS.VIEW), equipmentController.getAllEquipment)
  .post(authMiddleware.isAuthorized, authorizePermission('equipments', PERMISSIONS.CREATE), equipmentValidation.createNew, equipmentController.createNew)

Router.route('/:id')
  .delete(authMiddleware.isAuthorized, authorizePermission('equipments', PERMISSIONS.DELETE), equipmentController.deleteEquipment)
  .get(authMiddleware.isAuthorized, equipmentController.getEquipmentDetail)
  .put(authMiddleware.isAuthorized, authorizePermission('equipments', PERMISSIONS.UPDATE), equipmentValidation.updateEquipment, equipmentController.updateEquipment)

export const equitmentRoute = Router