import { StatusCodes } from 'http-status-codes'
import { productService } from '~/services/productService'

const getAllProducts = async (req, res, next) => {
  try {
    const { sortBy, order, search, page, limit } = req.query

    const result = await productService.getAllProducts( sortBy, order, search, page, limit)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const getAvailableProducts = async (req, res, next) => {
  try {
    const result = await productService.getAvailableProducts()

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const createProduct = async (req, res, next) => {
  try {
    const result = await productService.createProduct(req.body)

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}

const deleteProduct = async (req, res, next) => {
  try {

    const ProductId = req.params.id
    const result = await productService.deleteProduct(ProductId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const productController = {
  getAllProducts,
  getAvailableProducts,
  createProduct,
  deleteProduct
}