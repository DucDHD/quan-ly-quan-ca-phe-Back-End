import { StatusCodes } from 'http-status-codes'
import { inventoryService } from '~/services/inventoryService'

const getAllInventory = async (req, res, next) => {
  try {
    const { sortBy, order, search, page, limit } = req.query
    const result = await inventoryService.getAllInventory(sortBy, order, search, page, limit)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const getAllInventoryCategories = async (req, res, next) => {
  try {
    const result = await inventoryService.getAllInventoryCategories()
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const createInventory = async (req, res, next) => {
  try {
    const EmployeeId = req.jwtDecoded.EmployeeId
    const result = await inventoryService.createInventory(req.body, EmployeeId )

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) { next(error)}
}

const createNew = async (req, res, next) => {
  try {
    const result = await inventoryService.createNew(req.body)

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}

const getInventoryDetail = async (req, res, next) => {
  try {
    const InventoryId = Number(req.params.id)

    const result = await inventoryService.getInventoryDetail(InventoryId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const updateInventoryAndCategory = async (req, res, next) => {
  try {
    const InventoryId = Number(req.params.id)

    const result = await inventoryService.updateInventoryAndCategory(InventoryId, req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const deleteInventory = async (req, res, next) => {
  try {
    const InventoryId = Number(req.params.id)

    const result = await inventoryService.deleteInventory(InventoryId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const exports = async (req, res, next) => {
  try {
    const EmployeeId = req.jwtDecoded.EmployeeId
    const result = await inventoryService.exports(req.body, EmployeeId)

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) { next(error) }
}

export const inventoryController = {
  getAllInventory,
  getAllInventoryCategories,
  createInventory,
  createNew,
  getInventoryDetail,
  updateInventoryAndCategory,
  deleteInventory,
  exports
}