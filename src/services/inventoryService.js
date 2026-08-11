import { inventoryModel } from '~/models/inventoryModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const getAllInventory = async (sortBy = 'InventoryId', order = 'asc', search = '', page = 1, limit = 5) => {
  try {

    const status = 1

    const allowedSortFields = ['InventoryId', 'CategoryName', 'StockQuantity', 'Price', 'ImportDate', 'ExportDate']

    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'InventoryId'

    const validOrder = order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

    const validSearch = typeof search === 'string' ? search.trim() : ''

    const parsedPage = Number.parseInt(page, 10)
    const parsedLimit = Number.parseInt(limit, 10)

    const validPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

    const validLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 5

    const offset = (validPage - 1) * validLimit

    const getInventories = await inventoryModel.getAllInventory({
      sortBy: validSortBy,
      order: validOrder,
      search: validSearch,
      offset,
      limit: validLimit,
      status
    })

    const totalRows = await inventoryModel.countAllInventory({ search: validSearch, status })

    const totalPages = Math.ceil(totalRows / validLimit)

    return {
      getInventories,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalRows,
        totalPages
      }
    }
  } catch (error) { throw error }
}

const getAllInventoryCategories = async () => {
  try {
    const status = 1
    return await inventoryModel.getAllInventoryCategories(status)
  } catch (error) {
    throw error
  }
}

const createInventory = async (data, EmployeeId) => {
  try {
    const status = 1
    const { CategoryId, StockQuantity } = data

    const findInventory = await inventoryModel.findInventory(CategoryId, status)

    if (!findInventory) {
      throw new Error('Không tìm thấy hàng hóa trong kho')
    }

    const updatedInventory = await inventoryModel.updatedInventory(findInventory.InventoryId, findInventory.StockQuantity + StockQuantity)

    const createImport = await inventoryModel.createImport(EmployeeId)

    await inventoryModel.createImportDetail(
      createImport.ImportId,
      findInventory.InventoryId,
      StockQuantity,
      findInventory.Price
    )

    const totalPrice = StockQuantity * findInventory.Price
    const ExpenseDate = new Date()
    const EquipmentId = null

    await inventoryModel.createExpense(
      EmployeeId,
      ExpenseDate,
      `Nhập hàng hóa: ${findInventory.CategoryName}`,
      totalPrice,
      createImport.ImportId,
      EquipmentId
    )

    return updatedInventory

  } catch (error) { throw error }
}

const createNew = async (data) => {
  try {
    const { CategoryName, Unit, Price, ConversionQuantity } = data

    const createNewCategory = await inventoryModel.createNewCategory(CategoryName)


    const CategoryId = Number(createNewCategory.CategoryId)
    const StockQuantity = 0
    const newInventory = await inventoryModel.createNewInventory(
      CategoryId,
      Unit,
      Price,
      StockQuantity,
      ConversionQuantity
    )

    return { createNewCategory, newInventory }
  } catch (error) { throw error }
}

const getInventoryDetail = async (InventoryId) => {
  try {
    const status = 1
    const result = await inventoryModel.getInventoryDetail(InventoryId, status)

    if (!result) {
      throw new Error('Không tìm thấy hàng hóa')
    }

    return result
  } catch (error) { throw error }
}

const updateInventoryAndCategory = async (InventoryId, data) => {
  try {
    const { CategoryName, Unit, Price, StockQuantity, ConversionQuantity } = data
    const status = 1

    const findInventory = await inventoryModel.getInventoryDetail(InventoryId, status)

    const updateCategory = await inventoryModel.updateInventoryCategory(
      findInventory.CategoryId,
      CategoryName
    )
    const updateInventory = await inventoryModel.updateInventory( InventoryId, { Unit, Price, StockQuantity, ConversionQuantity } )

    return {
      updateCategory,
      updateInventory
    }
  } catch (error) { throw error }
}

const deleteInventory = async (InventoryId) => {
  try {
    const activeStatus = 1
    const deletedStatus = 0

    const findInventory = await inventoryModel.getInventoryDetail(InventoryId, activeStatus)

    const deleteInventory = await inventoryModel.deleteInventory(InventoryId, deletedStatus)

    const deleteInventoryCategory = await inventoryModel.deleteInventoryCategory(findInventory.CategoryId, deletedStatus)

    return { deleteInventory, deleteInventoryCategory }
  } catch (error) { throw error}
}

const exports = async (data, EmployeeId) => {
  try {
    const status = 1
    const { CategoryId, StockQuantity } = data

    const findInventory = await inventoryModel.findInventory(CategoryId, status)


    if (!findInventory) throw new Error('Không tìm thấy hàng hóa trong kho')

    if (findInventory.StockQuantity < StockQuantity) {
      throw new ApiError(StatusCodes.CONFLICT, 'Số lượng tồn kho không đủ!')
    }

    const newStockQuantity = findInventory.StockQuantity - StockQuantity

    const updatedInventory = await inventoryModel.updatedInventory(
      findInventory.InventoryId,
      newStockQuantity
    )

    const createExport = await inventoryModel.createExport(EmployeeId)

    const createExportDetail = await inventoryModel.createExportDetail(
      createExport.ExportId,
      findInventory.InventoryId,
      StockQuantity,
      findInventory.Price
    )

    return { updatedInventory, createExport, createExportDetail }
  } catch (error) { throw error }
}

export const inventoryService = {
  getAllInventory,
  getAllInventoryCategories,
  createInventory,
  createNew,
  getInventoryDetail,
  updateInventoryAndCategory,
  deleteInventory,
  exports
}