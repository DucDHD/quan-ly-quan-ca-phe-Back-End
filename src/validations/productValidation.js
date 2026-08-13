import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createProduct = async (req, res, next) => {
  const correctCondition = Joi.object({
    InventoryId: Joi.number().integer().min(1).required().messages({
      'any.required': 'Vui lòng chọn sản phẩm.',
      'number.base': 'Sản phẩm không hợp lệ.',
      'number.integer': 'Sản phẩm không hợp lệ.',
      'number.min': 'Sản phẩm không hợp lệ.'
    }),

    Price: Joi.number().min(1).required().messages({
      'any.required': 'Vui lòng nhập giá bán.',
      'number.base': 'Giá bán phải là số.',
      'number.min': 'Giá bán phải lớn hơn 0.'
    })
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const productValidation = {
  createProduct
}