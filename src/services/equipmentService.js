import { equipmentModel } from '~/models/equipmentModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const getAllEquipment = async ({ sortBy = 'EquipmentId', order = 'asc', search = '', page = 1, limit = 5 }) => {
  try {

    const allowedSortFields = ['EquipmentId', 'EquipmentName', 'EquipmentDate', 'Quantity', 'Price']

    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'EquipmentId'
    const validOrder = order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    const validSearch = typeof search === 'string' ? search.trim() : ''

    const parsedPage = Number.parseInt(page, 10)
    const parsedLimit = Number.parseInt(limit, 10)

    const validPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const validLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 5
    const offset = (validPage - 1) * validLimit

    const getEquipment = await equipmentModel.getAllEquipment({
      sortBy: validSortBy,
      order: validOrder,
      search: validSearch,
      offset,
      limit: validLimit
    })

    const totalRows = await equipmentModel.countAllEquipment({ search: validSearch })
    const totalPages = Math.ceil(totalRows / validLimit)

    return {
      getEquipment,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalRows,
        totalPages
      }
    }
  } catch (error) { throw error }
}

const deleteEquipment = async (equipmentId) => {
  try {
    const equipment = await equipmentModel.findOneById(equipmentId)

    if (!equipment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Thiết bị không tồn tại.')
    }

    return await equipmentModel.deleteEquipment(equipmentId)
  } catch (error) {throw error }
}

const createNew = async (reqBody, EmployeeId) => {
  try {
    const equipmentData = {
      EquipmentName: reqBody.EquipmentName.trim(),
      EquipmentDate: reqBody.EquipmentDate,
      Quantity: Number(reqBody.Quantity),
      Price: Number(reqBody.Price)
    }
    const result = await equipmentModel.createNew(equipmentData)

    const createExpense = await equipmentModel.createExpense({
      EmployeeId,
      ImportId: null,
      EquipmentId: result.EquipmentId,
      ExpenseDate: new Date(),
      TotalPrice: result.Quantity * result.Price,
      Description: `Mua thiết bị: ${result.EquipmentName}`
    })

    return { result, createExpense }
  } catch (error) { throw error }
}

const updateEquipment = async (equipmentId, reqBody) => {
  try {
    const equipment = await equipmentModel.findOneById(equipmentId)

    if (!equipment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Thiết bị không tồn tại.')
    }
    const updated = await equipmentModel.updateEquipment(equipmentId, {
      EquipmentName: reqBody.EquipmentName.trim(),
      EquipmentDate: reqBody.EquipmentDate,
      Quantity: Number(reqBody.Quantity),
      Price: Number(reqBody.Price)
    })
    const updatedExpense = await equipmentModel.updateExpenseByEquipmentId(equipmentId, {
      TotalPrice: Number(updated.Quantity) * Number(updated.Price)
    })

    return { updated, updatedExpense }
  } catch (error) { throw error }
}

const getEquipmentDetail = async (equipmentId) => {
  try {
    const equipment = await equipmentModel.findOneById(equipmentId)

    if (!equipment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Thiết bị không tồn tại.')
    }

    return equipment
  } catch (error) { throw error }
}

export const equipmentService = {
  getAllEquipment,
  deleteEquipment,
  createNew,
  updateEquipment,
  getEquipmentDetail
}