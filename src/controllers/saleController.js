import { StatusCodes } from 'http-status-codes'
import { saleService } from '~/services/saleService'


const getAllTable = async (req, res, next) => {
  try {
    const getTable = await saleService.getAllTable()
    res.status(StatusCodes.OK).json(getTable)
  } catch (error) { next(error) }
}


const bookingTable = async (req, res, next) => {
  try {
    const bookingTable = await saleService.bookingTable(req.body)
    res.status(StatusCodes.OK).json(bookingTable)
  } catch (error) { next(error) }
}

const getAllProduct = async (req, res, next) => {
  try {
    const getProduct = await saleService.getAllProduct()
    res.status(StatusCodes.OK).json(getProduct)
  } catch (error) { next(error) }
}


const createOrder = async (req, res, next) => {
  try {
    const EmployeeId = req.jwtDecoded.EmployeeId
    const order = await saleService.createOrder(req.body, EmployeeId)
    res.status(StatusCodes.OK).json(order)
  } catch (error) { next(error) }
}

const getTableDetail = async (req, res, next) => {
  try {
    const TableId = Number(req.params.id)
    const getTableDetail = await saleService.getTableDetail(TableId)
    res.status(StatusCodes.OK).json(getTableDetail)
  } catch (error) { next(error) }
}

const getPaymentInfo = async (req, res, next) => {
  try {
    const TableId = Number(req.params.id)
    const paymentInfo = await saleService.getPaymentInfo(TableId)
    res.status(StatusCodes.OK).json(paymentInfo)
  } catch (error) { next(error) }
}

const payment = async (req, res, next) => {
  try {
    const TableId = Number(req.params.id)
    const payment = await saleService.payment(TableId)
    res.status(StatusCodes.OK).json(payment)
  } catch (error) { next(error) }
}

export const saleController = {
  getAllTable,
  bookingTable,
  getAllProduct,
  createOrder,
  getTableDetail,
  getPaymentInfo,
  payment
}