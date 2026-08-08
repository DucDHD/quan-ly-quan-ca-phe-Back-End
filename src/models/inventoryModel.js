import { GET_DB } from '~/config/mssql'

const getAllInventory = async () => {
  try {
    const db = await GET_DB()

    const result = await db.request().query(`
     SELECT 
     InventoryCategories.CategoryName, Exports.ExportDate, Imports.ImportDate, Inventory.Price, Inventory,StockQuantity
      FROM Inventory
      LEFT JOIN InventoryCategories
        ON Inventory.CategoryId = InventoryCategories.CategoryId
      LEFT JOIN Imports
        ON Inventory.InventoryId = Imports.InventoryId
      LEFT JOIN Exports
        ON Inventory.InventoryId = Exports.InventoryId
      ORDER BY Inventory.InventoryId DESC
    `)

    return result.recordset
  } catch (error) {
    throw error
  }
}

export const inventoryModel = {
  getAllInventory
}