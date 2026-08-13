import { expenseModel } from '~/models/expenseModel'

const createExpense = async (data, EmployeeId) => {
  try {
    const { ExpenseDate, Description, TotalPrice } = data

    const ImportId = null
    const EquipmentId = null

    const createExpense = await expenseModel.createExpense(
      EmployeeId,
      ExpenseDate,
      Description.trim(),
      Number(TotalPrice),
      ImportId,
      EquipmentId
    )

    return createExpense
  } catch (error) { throw error }
}

const getAllExpenses = async (sortBy = 'ExpenseId', order = 'asc', search = '', page = 1, limit = 5) => {
  try {
    const allowedSortFields = ['ExpenseId', 'ExpenseDate', 'Description', 'TotalPrice']

    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'ExpenseId'

    const validOrder = order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

    const validSearch = typeof search === 'string' ? search.trim() : ''

    const parsedPage = Number.parseInt(page, 10)
    const parsedLimit = Number.parseInt(limit, 10)

    const validPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const validLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 5

    const offset = (validPage - 1) * validLimit

    const getExpenses = await expenseModel.getAllExpenses({
      sortBy: validSortBy,
      order: validOrder,
      search: validSearch,
      offset,
      limit: validLimit
    })

    const totalRows = await expenseModel.countAllExpenses({
      search: validSearch
    })

    const totalPages = Math.ceil(totalRows / validLimit)

    return {
      getExpenses,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalRows,
        totalPages
      }
    }
  } catch (error) { throw error }
}

const updateExpense = async (ExpenseId, data) => {
  try {
    const { ExpenseDate, Description, TotalPrice } = data

    const updateExpense = await expenseModel.updateExpense(
      ExpenseId,
      ExpenseDate,
      Description.trim(),
      Number(TotalPrice)
    )

    return updateExpense
  } catch (error) { throw error }
}

const deleteExpense = async ExpenseId => {
  try {
    const deleteExpense = await expenseModel.deleteExpense(ExpenseId)

    if (!deleteExpense) {
      throw new Error('Không tìm thấy khoản chi')
    }

    return deleteExpense
  } catch (error) { throw error }
}

const getRevenueExpense = async (fromDate, toDate, page = 1, limit = 5) => {
  try {

    const revenues = await expenseModel.getRevenue(fromDate, toDate)
    const expenses = await expenseModel.getExpense(fromDate, toDate)
    const data = []

    revenues.forEach(revenue => {
      data.push({
        Date: revenue.Date,
        Revenue: Number(revenue.Revenue),
        Expense: 0
      })
    })

    expenses.forEach(expense => {
      const findDate = data.find(item =>
        new Date(item.Date).toISOString().slice(0, 10) === new Date(expense.Date).toISOString().slice(0, 10)
      )

      if (findDate) {
        findDate.Expense = Number(expense.Expense)
      } else {
        data.push({
          Date: expense.Date,
          Revenue: 0,
          Expense: Number(expense.Expense)
        })
      }
    })


    const parsedPage = Number.parseInt(page, 10)
    const parsedLimit = Number.parseInt(limit, 10)

    const validPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const validLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5

    const offset = (validPage - 1) * validLimit

    const totalRows = data.length
    const totalPages = Math.ceil(totalRows / validLimit)

    const getRevenueExpense = data.slice(offset, offset + validLimit)

    return {
      getRevenueExpense,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalRows,
        totalPages
      }
    }
  } catch (error) { throw error }
}

export const expenseService = {
  createExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
  getRevenueExpense
}