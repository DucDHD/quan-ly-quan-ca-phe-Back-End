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
    const EmployeeId = req.jwtDecoded.EmployeeId
    const payment = await saleService.payment(TableId, EmployeeId)
    res.status(StatusCodes.OK).json(payment)
  } catch (error) { next(error) }
}

const getCustomerBooking = async (req, res, next) => {
  try {
    const tableId = req.params.id

    const result = await saleService.getCustomerBooking(tableId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const tranferTables = async (req, res, next) => {
  try {
    const tranferTable = await saleService.tranferTables(req.body)
    res.status(StatusCodes.OK).json(tranferTable)
  } catch (error) { next(error) }
}

const getInfoSplitTable = async (req, res, next) => {
  try {
    const TableId = Number(req.params.id)
    const getInfo = await saleService.getInfoSplitTable(TableId)
    res.status(StatusCodes.OK).json(getInfo)
  } catch (error) { next(error) }
}


const splitTable = async (req, res, next) => {
  try {
    const splitTable = await saleService.splitTable(req.body)

    res.status(StatusCodes.OK).json(splitTable)
  } catch (error) {
    next(error)
  }
}

const cancelTable = async (req, res, next) => {
  try {
    const result = await saleService.cancelTable(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const mergeTable = async (req, res, next) => {
  try {
    const mergeTable = await saleService.mergeTable(req.body)
    res.status(StatusCodes.OK).json(mergeTable)
  } catch (error) {
    next(error)
  }
}


export const saleController = {
  getAllTable,
  bookingTable,
  getAllProduct,
  createOrder,
  getTableDetail,
  getPaymentInfo,
  payment,
  tranferTables,
  getInfoSplitTable,
  splitTable,
  cancelTable,
  mergeTable,
  getCustomerBooking
}