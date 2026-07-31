import express from 'express'
import { saleController } from '~/controllers/saleController'
import { saleValidation } from '~/validations/saleValidation'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, saleController.getAllTable)

Router.route('/view/:id')
  .get(authMiddleware.isAuthorized, saleController.getTableDetail)


Router.route('/booking_table')
  .post(authMiddleware.isAuthorized, saleValidation.bookingTable, saleController.bookingTable)


Router.route('/products')
  .get(authMiddleware.isAuthorized, saleController.getAllProduct)

Router.route('/orders')
  .post(authMiddleware.isAuthorized, saleValidation.order, saleController.createOrder)


export const saleRoute = Router