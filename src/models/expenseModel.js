import { GET_DB } from '~/config/mssql'
//import sql from 'mssql'


const createExpense = async (EmployeeId, ExpenseDate, Description, TotalPrice, ImportId, EquipmentId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('EmployeeId', EmployeeId)
      .input('ExpenseDate', ExpenseDate)
      .input('Description', Description)
      .input('TotalPrice', TotalPrice)
      .input('ImportId', ImportId)
      .input('EquipmentId', EquipmentId)

    const query = `
      INSERT INTO Expenses ( EmployeeId, ExpenseDate, Description, TotalPrice, ImportId, EquipmentId)
      OUTPUT INSERTED.*
      VALUES ( @EmployeeId, @ExpenseDate, @Description, @TotalPrice, @ImportId, @EquipmentId)
    `
    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const getAllExpenses = async ({ sortBy, order, search, offset, limit }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    const columnMap = {
      ExpenseId: 'Expenses.ExpenseId',
      ExpenseDate: 'Expenses.ExpenseDate',
      Description: 'Expenses.Description',
      TotalPrice: 'Expenses.TotalPrice'
    }

    const orderByColumn = columnMap[sortBy] || 'Expenses.ExpenseId'

    let where = `
      WHERE Expenses.ImportId IS NULL
        AND Expenses.EquipmentId IS NULL
    `

    if (search) {
      where += ' AND Expenses.Description LIKE @search '
      request.input('search', `%${search}%`)
    }

    request
      .input('offset', offset)
      .input('limit', limit)

    const query = `
      SELECT
        Expenses.ExpenseId,
        Expenses.EmployeeId,
        Expenses.ExpenseDate,
        Expenses.Description,
        Expenses.TotalPrice
      FROM Expenses
      ${where}
      ORDER BY ${orderByColumn} ${order}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `

    const result = await request.query(query)

    return result.recordset
  } catch (error) { throw new Error(error) }
}

const countAllExpenses = async ({ search }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    let where = `
      WHERE Expenses.ImportId IS NULL
        AND Expenses.EquipmentId IS NULL
    `

    if (search) {
      where += ' AND Expenses.Description LIKE @search '
      request.input('search', `%${search}%`)
    }

    const query = `
      SELECT COUNT(*) AS total
      FROM Expenses
      ${where}
    `

    const result = await request.query(query)

    return result.recordset[0].total
  } catch (error) { throw new Error(error) }
}

const updateExpense = async (ExpenseId, ExpenseDate, Description, TotalPrice) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('ExpenseId', ExpenseId)
      .input('ExpenseDate', ExpenseDate)
      .input('Description', Description)
      .input('TotalPrice', TotalPrice)

    const query = `
      UPDATE Expenses
      SET
        ExpenseDate = @ExpenseDate,
        Description = @Description,
        TotalPrice = @TotalPrice
      OUTPUT INSERTED.*
      WHERE ExpenseId = @ExpenseId
        AND ImportId IS NULL
        AND EquipmentId IS NULL
    `

    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const deleteExpense = async (ExpenseId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('ExpenseId', ExpenseId)

    const query = `
      DELETE FROM Expenses
      OUTPUT DELETED.*
      WHERE ExpenseId = @ExpenseId
        AND ImportId IS NULL
        AND EquipmentId IS NULL
    `

    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}


const getRevenue = async (fromDate, toDate) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('fromDate', fromDate)
      .input('toDate', toDate)

    const query = `
      SELECT
        CONVERT(date, Invoices.InvoiceDate) AS Date,
        SUM(Invoices.TotalPrice) AS Revenue
      FROM Invoices
      WHERE Invoices.InvoiceStatus = 2
        AND CONVERT(date, Invoices.InvoiceDate) BETWEEN @fromDate AND @toDate
      GROUP BY CONVERT(date, Invoices.InvoiceDate)
      ORDER BY Date ASC
    `

    const result = await request.query(query)

    return result.recordset
  } catch (error) { throw new Error(error) }
}

const getExpense = async (fromDate, toDate) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('fromDate', fromDate)
      .input('toDate', toDate)

    const query = `
      SELECT
        CONVERT(date, Expenses.ExpenseDate) AS Date,
        SUM(Expenses.TotalPrice) AS Expense
      FROM Expenses
      WHERE CONVERT(date, Expenses.ExpenseDate) BETWEEN @fromDate AND @toDate
      GROUP BY CONVERT(date, Expenses.ExpenseDate)
      ORDER BY Date ASC
    `

    const result = await request.query(query)

    return result.recordset
  } catch (error) { throw new Error(error) }
}

export const expenseModel = {
  createExpense,
  getAllExpenses,
  countAllExpenses,
  updateExpense,
  deleteExpense,
  getRevenue,
  getExpense
}