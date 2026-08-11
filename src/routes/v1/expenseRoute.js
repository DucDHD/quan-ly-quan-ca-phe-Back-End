import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { expenseController } from '~/controllers/expenseController'
import { authorizePermission } from '~/middlewares/permissionMiddleware'
import { PERMISSIONS } from '~/utils/permissions'


const Router = express.Router()


// expenseRoute.js
Router.route('/')
  .post(authMiddleware.isAuthorized, expenseController.createExpense)


export const expenseRoute = Router