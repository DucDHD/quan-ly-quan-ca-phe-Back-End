import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const expenseSchema = Joi.object({
  ExpenseDate: Joi.date().required().messages({
    'any.required': 'Vui lòng chọn ngày chi.',
    'date.base': 'Ngày chi không hợp lệ.'
  }),

  Description: Joi.string().trim().min(1).max(255).required().messages({
    'any.required': 'Vui lòng nhập khoản chi.',
    'string.empty': 'Vui lòng nhập khoản chi.',
    'string.max': 'Khoản chi không được vượt quá 255 ký tự.'
  }),

  TotalPrice: Joi.number().positive().required().messages({
    'any.required': 'Vui lòng nhập số tiền.',
    'number.base': 'Số tiền phải là số.',
    'number.positive': 'Số tiền phải lớn hơn 0.'
  })
})

const createExpense = async (req, res, next) => {
  try {
    await expenseSchema.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const updateExpense = async (req, res, next) => {
  try {
    await expenseSchema.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const expenseValidation = {
  createExpense,
  updateExpense
}