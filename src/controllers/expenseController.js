import { expenseService } from '~/services/expenseService'
import { StatusCodes } from 'http-status-codes'

const createExpense = async (req, res, next) => {
  try {

    const EmployeeId = req.jwtDecoded.EmployeeId
    const result = await expenseService.createExpense(req.body, EmployeeId)
    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}

export const expenseController = {
  createExpense
}