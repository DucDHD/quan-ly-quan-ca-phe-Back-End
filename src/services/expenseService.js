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

export const expenseService = {
  createExpense
}