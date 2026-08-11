import { GET_DB } from '~/config/mssql'
import sql from 'mssql'


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

export const expenseModel = {
  createExpense
}