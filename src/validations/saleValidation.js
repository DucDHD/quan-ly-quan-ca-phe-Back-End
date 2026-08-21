import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import {
  PHONE_RULE, PHONE_RULE_MESSAGE
} from '~/utils/validators'


const bookingTable = async (req, res, next) => {
  const correctCondition = Joi.object({
    TableId: Joi.number().integer().required(),
    PeopleCount: Joi.number().integer().required(),
    CustomerName: Joi.string().trim().min(3).max(100).required().messages({
      'string.empty': 'Customer name is required.',
      'string.min': 'Customer name must be at least 3 characters.',
      'string.max': 'Customer name must not exceed 100 characters.'
    }),
    PhoneNumber: Joi.string().required().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE),
    BookingTime: Joi.date().required()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const tableProduct = async (req, res, next) => {
  const correctCondition = Joi.object({
    TableId: Joi.number().integer().required(),
    BookingId: Joi.number().integer().required(),
    Products: Joi.array().items(Joi.object({
      ProductId: Joi.number().integer().required(),
      Quantity: Joi.number().integer().min(1).required()
    })).min(1).required()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const tranferTable = async (req, res, next) => {
  const correctCondition = Joi.object({
    oldTableId: Joi.number().integer().required(),
    newTableId: Joi.number().integer().required(),
    bookingId: Joi.number().integer().required()
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const splitTable = async (req, res, next) => {
  const correctCondition = Joi.object({
    oldTableId: Joi.number().integer().required(),
    newTableId: Joi.number().integer().required(),
    PeopleCount: Joi.number().integer().min(1).required(),
    products: Joi.array().items(
      Joi.object({
        ProductId: Joi.number().integer().required(),
        Quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const saleValidation = {
  bookingTable,
  tableProduct,
  tranferTable,
  splitTable
}