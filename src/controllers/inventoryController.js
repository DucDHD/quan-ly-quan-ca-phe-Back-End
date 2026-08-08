import { StatusCodes } from 'http-status-codes'
import { inventoryService } from '~/services/inventoryService'

const getAllInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.getAllInventory()

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const inventoryController = {
  getAllInventory
}