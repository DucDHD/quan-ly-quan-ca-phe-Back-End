
import sql from 'mssql'
import { GET_DB } from '~/config/mssql'

const getAllEquipment = async ({ sortBy, order, search, offset, limit }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    const columnMap = {
      EquipmentId: 'EquipmentId',
      EquipmentName: 'EquipmentName',
      EquipmentDate: 'EquipmentDate',
      Quantity: 'Quantity',
      Price: 'Price'
    }

    const orderByColumn = columnMap[sortBy] || 'EquipmentId'

    let where = ''

    if (search) {
      where += ' WHERE EquipmentName LIKE @search '
      request.input('search', `%${search}%`)
    }

    request
      .input('offset', offset)
      .input('limit', limit)

    const query = `
      SELECT EquipmentId, EquipmentName, EquipmentDate, Quantity, Price
      FROM Equipments
      ${where}
      ORDER BY ${orderByColumn} ${order}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `

    const result = await request.query(query)

    return result.recordset
  } catch (error) { throw new Error(error)}
}

const countAllEquipment = async ({ search }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    let where = ''

    if (search) {
      where = ' WHERE EquipmentName LIKE @search '
      request.input('search', `%${search}%`)
    }

    const result = await request.query(`
      SELECT COUNT(EquipmentId) AS totalRows
      FROM Equipments
      ${where}
    `)

    return result.recordset[0].totalRows
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (equipmentId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('EquipmentId', sql.Int, equipmentId)

    const result = await request.query(`
      SELECT EquipmentId, EquipmentName, EquipmentDate, Quantity, Price
      FROM Equipments
      WHERE EquipmentId = @EquipmentId
    `)

    return result.recordset[0]
  } catch (error) {
    throw error
  }
}

const deleteEquipment = async (equipmentId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('EquipmentId', sql.Int, equipmentId)

    const result = await request.query(`
      DELETE FROM Equipments
      OUTPUT DELETED.*
      WHERE EquipmentId = @EquipmentId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}
const createNew= async (equipmentData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('EquipmentName', sql.NVarChar, equipmentData.EquipmentName)
      .input('EquipmentDate', sql.Date, equipmentData.EquipmentDate)
      .input('Quantity', sql.Int, equipmentData.Quantity)
      .input('Price', sql.Decimal(18, 2), equipmentData.Price)

    const result = await request.query(`
      INSERT INTO Equipments (EquipmentName, EquipmentDate, Quantity, Price)
      OUTPUT INSERTED.*
      VALUES (@EquipmentName, @EquipmentDate, @Quantity, @Price)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const createExpense = async (expenseData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('EmployeeId', sql.Int, expenseData.EmployeeId)
      .input('ImportId', sql.Int, expenseData.ImportId)
      .input('EquipmentId', sql.Int, expenseData.EquipmentId)
      .input('ExpenseDate', sql.Date, expenseData.ExpenseDate)
      .input('TotalPrice', sql.Decimal(18, 2), expenseData.TotalPrice)
      .input('Description', sql.NVarChar, expenseData.Description)

    const result = await request.query(`
      INSERT INTO Expenses ( EmployeeId, ImportId, EquipmentId, ExpenseDate,  TotalPrice, Description )
      OUTPUT INSERTED.*
      VALUES ( @EmployeeId, @ImportId, @EquipmentId, @ExpenseDate,  @TotalPrice,  @Description )
    `)

    return result.recordset[0]
  } catch (error) {
    throw error
  }
}
const updateEquipment = async (equipmentId, updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('EquipmentId', sql.Int, equipmentId)
      .input('EquipmentName', sql.NVarChar, updateData.EquipmentName)
      .input('EquipmentDate', sql.Date, updateData.EquipmentDate)
      .input('Quantity', sql.Int, updateData.Quantity)
      .input('Price', sql.Decimal(18, 2), updateData.Price)

    const result = await request.query(`
      UPDATE Equipments
      SET
        EquipmentName = @EquipmentName,
        EquipmentDate = @EquipmentDate,
        Quantity = @Quantity,
        Price = @Price
      OUTPUT INSERTED.*
      WHERE EquipmentId = @EquipmentId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}
const updateExpenseByEquipmentId = async (equipmentId, updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('EquipmentId', sql.Int, equipmentId)
      .input('TotalPrice', sql.Decimal(18, 2), updateData.TotalPrice)

    const result = await request.query(`
      UPDATE Expenses
      SET
        TotalPrice = @TotalPrice
      OUTPUT INSERTED.*
      WHERE EquipmentId = @EquipmentId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

export const equipmentModel = {
  getAllEquipment,
  countAllEquipment,
  findOneById,
  deleteEquipment,
  createNew,
  createExpense,
  updateEquipment,
  updateExpenseByEquipmentId
}