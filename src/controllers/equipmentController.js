import { StatusCodes } from 'http-status-codes'
import { equipmentService } from '~/services/equipmentService'

const getAllEquipment = async (req, res, next) => {
  try {
    const getEquipment = await equipmentService.getAllEquipment({
      sortBy: req.query.sortBy,
      order: req.query.order,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    })
    //const getEquipment= await equipmentService.getAllEquipment()
    res.status(StatusCodes.OK).json(getEquipment)
  } catch (error) { next(error) }
}

const deleteEquipment = async (req, res, next) => {
  try {
    const equipmentId = req.params.id
    const result = await equipmentService.deleteEquipment(equipmentId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const createNew = async (req, res, next) => {
  try {
    const EmployeeId = req.jwtDecoded.EmployeeId
    const createNew = await equipmentService.createNew(req.body, EmployeeId)
    res.status(StatusCodes.CREATED).json(createNew)
  } catch (error) { next(error) }
}

const updateEquipment = async (req, res, next) => {
  try {
    const equipmentId = req.params.id
    const result = await equipmentService.updateEquipment(equipmentId, req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}
const getEquipmentDetail = async (req, res, next) => {
  try {
    const equipmentId = req.params.id
    const result = await equipmentService.getEquipmentDetail(equipmentId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

export const equipmentController = {
  getAllEquipment,
  deleteEquipment,
  createNew,
  updateEquipment,
  getEquipmentDetail
}