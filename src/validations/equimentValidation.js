import Joi from 'joi'
// import { StatusCodes } from 'http-status-codes'
// import ApiError from '~/utils/ApiError'
// import {
//   ID_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE,
//   USERNAME_RULE, USERNAME_RULE_MESSAGE,
//   PASSWORD_RULE, PASSWORD_RULE_MESSAGE
// } from '~/utils/validators'

const createNew = async (req, res, next) => {
  const schema = Joi.object({
    EquipmentName: Joi.string().trim().min(2).max(100).required().messages({
      'string.empty': 'Vui lòng nhập tên thiết bị.',
      'string.min': 'Tên thiết bị phải có ít nhất 2 ký tự.',
      'string.max': 'Tên thiết bị không được vượt quá 100 ký tự.',
      'any.required': 'Vui lòng nhập tên thiết bị.'
    }),

    EquipmentDate: Joi.date().max('now').required().messages({
      'date.base': 'Ngày mua không hợp lệ.',
      'date.max': 'Ngày mua không được lớn hơn ngày hiện tại.',
      'any.required': 'Vui lòng chọn ngày mua.'
    }),

    Quantity: Joi.number().integer().min(1).required().messages({
      'number.base': 'Số lượng phải là số.',
      'number.integer': 'Số lượng phải là số nguyên.',
      'number.min': 'Số lượng phải lớn hơn 0.',
      'any.required': 'Vui lòng nhập số lượng.'
    }),

    Price: Joi.number().min(1).required().messages({
      'number.base': 'Đơn giá phải là số.',
      'number.min': 'Đơn giá phải lớn hơn 0.',
      'any.required': 'Vui lòng nhập đơn giá.'
    })
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) { next(error)}
}

const updateEquipment = async (req, res, next) => {
  const schema = Joi.object({
    EquipmentName: Joi.string().trim().min(2).max(100).required(),
    EquipmentDate: Joi.date().max('now').required(),
    Quantity: Joi.number().integer().min(1).required(),
    Price: Joi.number().min(1).required()
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) { next(error) }
}

export const equipmentValidation = {
  createNew,
  updateEquipment
}
