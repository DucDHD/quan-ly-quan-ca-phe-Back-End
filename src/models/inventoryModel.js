import { GET_DB } from '~/config/mssql'
import sql from 'mssql'


const getAllInventory = async ({ sortBy, order, search, offset, limit, status }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    const columnMap = {
      InventoryId: 'Inventory.InventoryId',
      CategoryName: 'InventoryCategories.CategoryName',
      StockQuantity: 'Inventory.StockQuantity',
      Price: 'Inventory.Price',
      ImportDate: 'ImportDate',
      ExportDate: 'ExportDate'
    }

    const orderByColumn = columnMap[sortBy] || 'Inventory.InventoryId'

    request.input('status', status)

    let where = 'WHERE Inventory.Status = @status'

    if (search) {
      where += ' AND InventoryCategories.CategoryName LIKE @search '
      request.input('search', `%${search}%`)
    }

    request
      .input('offset', offset)
      .input('limit', limit)

    const query = `
      SELECT
        Inventory.InventoryId,
        InventoryCategories.CategoryName,
        Inventory.StockQuantity,
        Inventory.Price,
        Inventory.Unit,

        (
          SELECT MAX(Imports.ImportDate)
          FROM ImportDetails
          INNER JOIN Imports
            ON ImportDetails.ImportId = Imports.ImportId
          WHERE ImportDetails.InventoryId = Inventory.InventoryId
        ) AS ImportDate,

        (
          SELECT MAX(Exports.ExportDate)
          FROM ExportDetails
          INNER JOIN Exports
            ON ExportDetails.ExportId = Exports.ExportId
          WHERE ExportDetails.InventoryId = Inventory.InventoryId
        ) AS ExportDate

      FROM Inventory

      LEFT JOIN InventoryCategories
        ON Inventory.CategoryId = InventoryCategories.CategoryId

      ${where}

      ORDER BY ${orderByColumn} ${order}

      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `

    const result = await request.query(query)

    return result.recordset
  } catch (error) {
    throw new Error(error)
  }
}

const countAllInventory = async ({ search, status }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('status', status)
    let where = 'WHERE Inventory.Status = @status'

    if (search) {
      where += ' AND InventoryCategories.CategoryName LIKE @search '
      request.input('search', `%${search}%`)
    }

    const query = `
      SELECT COUNT(*) AS total
      FROM Inventory
      LEFT JOIN InventoryCategories
        ON Inventory.CategoryId = InventoryCategories.CategoryId
      ${where}
    `

    const result = await request.query(query)

    return result.recordset[0].total
  } catch (error) {
    throw new Error(error)
  }
}

const getAllInventoryCategories = async (status) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('status', status)

    const result = await request.query(`
      SELECT 
        CategoryId, CategoryName
      FROM InventoryCategories
      WHERE Status = @status
      ORDER BY CategoryName ASC
    `)

    return result.recordset
  } catch (error) { throw error }
}

// const findInventory = async (CategoryId, status) => {
//   try {
//     const db = await GET_DB()
//     const request = db.request()

//     request
//       .input('CategoryId', CategoryId)
//       .input('status', status)

//     const result = await request.query(`
//       SELECT 
//         InventoryId, StockQuantity, Price
//       FROM Inventory
//       WHERE CategoryId = @CategoryId AND Status = @status
//     `)

//     return result.recordset[0]
//   } catch (error) { throw error }
// }

const findInventory = async (CategoryId, status) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('CategoryId', CategoryId)
      .input('status', status)

    const result = await request.query(`
      SELECT
        Inventory.InventoryId,
        Inventory.StockQuantity,
        Inventory.Price,
        InventoryCategories.CategoryName
      FROM Inventory
      INNER JOIN InventoryCategories
        ON Inventory.CategoryId = InventoryCategories.CategoryId
      WHERE Inventory.CategoryId = @CategoryId
        AND Inventory.Status = @status
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updatedInventory = async (InventoryId, StockQuantity) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('InventoryId', InventoryId)
      .input('StockQuantity', StockQuantity)

    const result = await request.query(`
      UPDATE Inventory
      SET StockQuantity = @StockQuantity
      OUTPUT INSERTED.InventoryId, INSERTED.StockQuantity
      WHERE InventoryId = @InventoryId
    `)

    return result.recordset[0]
  } catch (error) {
    throw error
  }
}

const createImport = async (EmployeeId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('EmployeeId', EmployeeId)

    const result = await request.query(`
      INSERT INTO Imports (ImportDate, EmployeeId)
      OUTPUT INSERTED.ImportId
      VALUES (GETDATE(), @EmployeeId)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const createImportDetail = async (ImportId, InventoryId, Quantity, Price) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('ImportId', ImportId)
      .input('InventoryId', InventoryId)
      .input('Quantity', Quantity)
      .input('Price', Price)

    const result = await request.query(`
      INSERT INTO ImportDetails ( ImportId, InventoryId, Quantity, Price)
      OUTPUT INSERTED.*
      VALUES ( @ImportId, @InventoryId, @Quantity, @Price )
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

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
      INSERT INTO Expenses ( EmployeeId, ExpenseDate, Description,TotalPrice, ImportId, EquipmentId )
      OUTPUT INSERTED.*
      VALUES ( @EmployeeId, @ExpenseDate, @Description, @TotalPrice, @ImportId, @EquipmentId )
    `

    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const createNewCategory = async (CategoryName) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('CategoryName', CategoryName)

    const result = await request.query(`
      INSERT INTO InventoryCategories (CategoryName )
      OUTPUT INSERTED.CategoryId
      VALUES (@CategoryName)
    `)

    return result.recordset[0]
  } catch (error) {
    throw error
  }
}

const createNewInventory = async (CategoryId, Unit, Price, StockQuantity, ConversionQuantity) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('CategoryId', sql.Int, CategoryId)
      .input('Unit', sql.NVarChar, Unit)
      .input('Price', sql.Decimal(18, 2), Price)
      .input('StockQuantity', sql.Int, StockQuantity)
      .input('ConversionQuantity', sql.Int, ConversionQuantity)

    const result = await request.query(`
      INSERT INTO Inventory ( CategoryId, Unit, Price, StockQuantity, ConversionQuantity )
      OUTPUT INSERTED.*
      VALUES ( @CategoryId, @Unit, @Price, @StockQuantity, @ConversionQuantity)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const getInventoryDetail = async (InventoryId, status) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InventoryId', InventoryId)
      .input('status', status)

    const result = await request.query(`
      SELECT
        Inventory.InventoryId,
        Inventory.CategoryId,
        InventoryCategories.CategoryName,
        Inventory.Unit,
        Inventory.Price,
        Inventory.StockQuantity,
        Inventory.ConversionQuantity
      FROM Inventory
      INNER JOIN InventoryCategories
        ON Inventory.CategoryId = InventoryCategories.CategoryId
      WHERE Inventory.InventoryId = @InventoryId AND Inventory.Status = @status
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updateInventoryCategory = async (CategoryId, CategoryName) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('CategoryId', CategoryId)
      .input('CategoryName', CategoryName)

    const result = await request.query(`
      UPDATE InventoryCategories
      SET CategoryName = @CategoryName
      OUTPUT INSERTED.*
      WHERE CategoryId = @CategoryId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updateInventory = async (InventoryId, data) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    const { Unit, Price, StockQuantity, ConversionQuantity } = data

    request
      .input('InventoryId', InventoryId)
      .input('Unit', Unit)
      .input('Price', Price)
      .input('StockQuantity', StockQuantity)
      .input('ConversionQuantity', ConversionQuantity)

    const result = await request.query(`
      UPDATE Inventory
      SET
        Unit = @Unit,
        Price = @Price,
        StockQuantity = @StockQuantity,
        ConversionQuantity = @ConversionQuantity
      OUTPUT INSERTED.*
      WHERE InventoryId = @InventoryId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const deleteInventory = async (InventoryId, status) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InventoryId', InventoryId)
      .input('status', status)

    const result = await request.query(`
      UPDATE Inventory
      SET Status = @status
      OUTPUT INSERTED.*
      WHERE InventoryId = @InventoryId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const deleteInventoryCategory = async (CategoryId, status) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('CategoryId', CategoryId)
      .input('status', status)

    const result = await request.query(`
      UPDATE InventoryCategories
      SET Status = @status
      OUTPUT INSERTED.*
      WHERE CategoryId = @CategoryId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const createExport = async (EmployeeId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('EmployeeId', EmployeeId)

    const result = await request.query(`
      INSERT INTO Exports (ExportDate, EmployeeId)
      OUTPUT INSERTED.ExportId
      VALUES (GETDATE(), @EmployeeId)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const createExportDetail = async (ExportId, InventoryId, Quantity, Price) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('ExportId', ExportId)
      .input('InventoryId', InventoryId)
      .input('Quantity', Quantity)
      .input('Price', Price)

    const result = await request.query(`
      INSERT INTO ExportDetails (ExportId, InventoryId, Quantity, Price)
      OUTPUT INSERTED.*
      VALUES (@ExportId, @InventoryId, @Quantity, @Price)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

export const inventoryModel = {
  getAllInventory,
  countAllInventory,
  getAllInventoryCategories,
  findInventory,
  updatedInventory,
  createImport,
  createImportDetail,
  createNewCategory,
  createNewInventory,
  getInventoryDetail,
  updateInventoryCategory,
  updateInventory,
  deleteInventory,
  deleteInventoryCategory,
  createExport,
  createExportDetail,
  createExpense
}