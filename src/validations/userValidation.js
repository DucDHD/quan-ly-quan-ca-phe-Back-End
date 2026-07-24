import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import {
  ID_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE,
  USERNAME_RULE, USERNAME_RULE_MESSAGE,
  PASSWORD_RULE, PASSWORD_RULE_MESSAGE
} from '~/utils/validators'

const getUserDetailById = async (req, res, next) => {
  const correctCondition = Joi.object({
    id: Joi.number().integer().positive().required().messages({ '*': ID_RULE_MESSAGE })
  })
  try {
    await correctCondition.validateAsync(req.params)
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }

}


const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    FullName: Joi.string().required().min(5).max(256).trim().strict(),
    Address: Joi.string().required().min(5).max(256).trim().strict(),
    PhoneNumber: Joi.string().required().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE)
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    RoleId: Joi.number().integer().required(),
    Username: Joi.string().required().pattern(USERNAME_RULE).message(USERNAME_RULE_MESSAGE),
    Password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
    FullName: Joi.string().trim().min(3).max(100).required().messages({
      'string.empty': 'Full name is required.',
      'string.min': 'Full name must be at least 3 characters.',
      'string.max': 'Full name must not exceed 100 characters.'
    }),
    Address: Joi.string().trim().max(255).allow('').messages({
      'string.max': 'Address must not exceed 255 characters.'
    }),
    PhoneNumber: Joi.string().trim().pattern(/^[0-9]{10}$/).required().messages({
      'string.empty': 'Phone number is required.',
      'string.pattern.base': 'Phone number must contain exactly 10 digits.'
    }),
    Salary: Joi.number().min(0).required().messages({
      'number.base': 'Salary must be a number.',
      'number.min': 'Salary must be greater than or equal to 0.',
      'any.required': 'Salary is required.'
    })
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const deleteUser = async (req, res, next) => {
  const correctCondition = Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Id must be a positive integer.',
        'number.integer': 'Id must be a positive integer.',
        'number.positive': 'Id must be a positive integer.',
        'any.required': 'Id is required.'
      })
  })
  try {
    await correctCondition.validateAsync(req.params)
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const updateUser = async (req, res, next) => {
  const correctCondition = Joi.object({
    RoleId: Joi.number().integer().required(),
    FullName: Joi.string().trim().min(3).max(100).required().messages({
      'string.empty': 'Full name is required.',
      'string.min': 'Full name must be at least 3 characters.',
      'string.max': 'Full name must not exceed 100 characters.'
    }),
    Address: Joi.string().trim().max(255).allow('').messages({
      'string.max': 'Address must not exceed 255 characters.'
    }),
    PhoneNumber: Joi.string().trim().pattern(/^[0-9]{10}$/).required().messages({
      'string.empty': 'Phone number is required.',
      'string.pattern.base': 'Phone number must contain exactly 10 digits.'
    }),
    Salary: Joi.number().min(0).required().messages({
      'number.base': 'Salary must be a number.',
      'number.min': 'Salary must be greater than or equal to 0.',
      'any.required': 'Salary is required.'
    })
  })
  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    Username: Joi.string().required().pattern(USERNAME_RULE).message(USERNAME_RULE_MESSAGE),
    Password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly:false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const userValidation = {
  getUserDetailById,
  update,
  createNew,
  deleteUser,
  updateUser,
  login
}