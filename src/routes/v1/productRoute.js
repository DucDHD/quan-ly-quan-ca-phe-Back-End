import express from 'express'
import { productController } from '~/controllers/productController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { authorizePermission } from '~/middlewares/permissionMiddleware'
import { PERMISSIONS } from '~/utils/permissions'
import { productValidation } from '~/validations/productValidation'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, authorizePermission('products', PERMISSIONS.VIEW), productController.getAllProducts)
  .post(authMiddleware.isAuthorized, productValidation.createProduct, authorizePermission('products', PERMISSIONS.CREATE), productController.createProduct)


Router.route('/available')
  .get(authMiddleware.isAuthorized, authorizePermission('products', PERMISSIONS.VIEW), productController.getAvailableProducts)


Router.route('/:id')
  .delete(authMiddleware.isAuthorized, authorizePermission('products', PERMISSIONS.DELETE), productController.deleteProduct)

export const productRoute = Router