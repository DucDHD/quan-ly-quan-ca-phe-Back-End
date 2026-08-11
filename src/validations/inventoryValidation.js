import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createInventory = async (req, res, next) => {
  const correctCondition = Joi.object({
    CategoryId: Joi.number().integer().min(1).required(),
    StockQuantity: Joi.number().integer().min(1).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    CategoryName: Joi.string().trim().min(1).max(100).required(),
    Unit: Joi.string().trim().min(1).max(50).required(),
    Price: Joi.number().min(1).required(),
    ConversionQuantity: Joi.number().integer().min(1).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const updateInventoryAndCategory = async (req, res, next) => {
  const correctCondition = Joi.object({
    CategoryName: Joi.string().trim().min(1).max(100).required(),
    Unit: Joi.string().trim().min(1).max(50).required(),
    Price: Joi.number().min(1).required(),
    StockQuantity: Joi.number().integer().min(0).required(),
    ConversionQuantity: Joi.number().integer().min(1).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const exports = async (req, res, next) => {
  const correctCondition = Joi.object({
    CategoryId: Joi.number().integer().min(1).required(),
    StockQuantity: Joi.number().integer().min(1).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const inventoryValidation = {
  createInventory,
  createNew,
  updateInventoryAndCategory,
  exports
}