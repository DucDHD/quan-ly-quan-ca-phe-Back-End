import { inventoryModel } from '~/models/inventoryModel'

const getAllInventory = async () => {
  try {
    const inventories = await inventoryModel.getAllInventory()

    return inventories
  } catch (error) {
    throw error
  }
}

export const inventoryService = {
  getAllInventory
}