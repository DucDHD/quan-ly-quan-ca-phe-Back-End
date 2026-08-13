import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { expenseController } from '~/controllers/expenseController'
import { authorizePermission } from '~/middlewares/permissionMiddleware'
import { PERMISSIONS } from '~/utils/permissions'
import { expenseValidation } from '~/validations/expenseValidation'


const Router = express.Router()


// expenseRoute.js
Router.route('/')
  .get(authMiddleware.isAuthorized, authorizePermission('expenses', PERMISSIONS.VIEW), expenseController.getAllExpenses)
  .post(authMiddleware.isAuthorized, expenseValidation.createExpense, authorizePermission('expenses', PERMISSIONS.CREATE), expenseController.createExpense)


Router.route('/:id')
  .put(authMiddleware.isAuthorized, expenseValidation.updateExpense, authorizePermission('expenses', PERMISSIONS.UPDATE), expenseController.updateExpense)
  .delete(authMiddleware.isAuthorized, authorizePermission('expenses', PERMISSIONS.DELETE), expenseController.deleteExpense)


Router.route('/revenue-expense')
  .get( authMiddleware.isAuthorized, expenseController.getRevenueExpense)

export const expenseRoute = Router