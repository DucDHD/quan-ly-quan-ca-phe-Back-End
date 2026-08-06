import express from 'express'
import { saleController } from '~/controllers/saleController'
import { saleValidation } from '~/validations/saleValidation'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthorized, saleController.getAllTable)

Router.route('/split_table/:id')
  .get(authMiddleware.isAuthorized, saleController.getInfoSplitTable)

Router.route('/split_table')
  .put(authMiddleware.isAuthorized, saleValidation.splitTable, saleController.splitTable)

Router.route('/tranfer_table')
  .put(authMiddleware.isAuthorized, saleValidation.tranferTable, saleController.tranferTables)

Router.route('/view/:id')
  .get(authMiddleware.isAuthorized, saleController.getTableDetail)

Router.route('/payment/:id')
  .get(authMiddleware.isAuthorized, saleController.getPaymentInfo)
  .put(authMiddleware.isAuthorized, saleValidation.tableProduct, saleController.payment)

Router.route('/booking_table')
  .post(authMiddleware.isAuthorized, saleValidation.bookingTable, saleController.bookingTable)


Router.route('/products')
  .get(authMiddleware.isAuthorized, saleController.getAllProduct)

Router.route('/orders')
  .post(authMiddleware.isAuthorized, saleValidation.tableProduct, saleController.createOrder)

Router.route('/cancel_table/:id')
  .put(authMiddleware.isAuthorized, saleController.cancelTable)

Router.route('/merge_table')
  .put(authMiddleware.isAuthorized, saleController.mergeTable)

export const saleRoute = Router