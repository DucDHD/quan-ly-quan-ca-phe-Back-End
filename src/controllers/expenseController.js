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

const getAllExpenses = async (req, res, next) => {
  try {
    const result = await expenseService.getAllExpenses(
      req.query.sortBy,
      req.query.order,
      req.query.search,
      req.query.page,
      req.query.limit
    )

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const updateExpense = async (req, res, next) => {
  try {
    const ExpenseId = req.params.id

    const result = await expenseService.updateExpense(ExpenseId, req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const deleteExpense = async (req, res, next) => {
  try {
    const ExpenseId = req.params.id

    const result = await expenseService.deleteExpense(ExpenseId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const getRevenueExpense = async (req, res, next) => {
  try {
    const { fromDate, toDate, page, limit } = req.query
    const result = await expenseService.getRevenueExpense(fromDate, toDate, page, limit)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const expenseController = {
  createExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
  getRevenueExpense
}