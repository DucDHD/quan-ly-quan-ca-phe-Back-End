import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import { pickUser } from '~/utils/formatters'
import bcryptjs from 'bcryptjs'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'

const getUserDetailById = async (userId) => {
  try {
    const user = await userModel.getUserDetailById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'user not found')
    }

    return user
  } catch (error) { throw error }
}

const update = async (userId, reqBody) => {
  try {
    const updatedUser = await userModel.update(userId, reqBody)
    return updatedUser
  } catch (error) { throw error }
}

const updatedAvatar = async (userId, reqFile) => {
  try {
    if (!reqFile) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'image is required')
    }

    const avatarPath = `/uploads/${reqFile.filename}`
    const uploadAvatar = await userModel.updatedAvatar(userId, avatarPath)

    return uploadAvatar
  } catch (error) { throw error }
}

const createNew = async (reqBody) => {
  try {
    const existsUser = await userModel.findOneByUsername(reqBody.Username)
    if (existsUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'username already exists!')
    }
    const newUser = {
      ...reqBody,
      Password: bcryptjs.hashSync(reqBody.Password, 8)
    }

    const createdUser = await userModel.createNew(newUser)

    return pickUser(createdUser)
  } catch (error) { throw error }
}

const getAllUser = async () => {
  try {
    const getUser = await userModel.getAllUser()
    return getUser
  } catch (error) { throw error }
}

const deleteUser = async (userId) => {
  try {
    const deletedUser = await userModel.deleteUser(userId)
    return deletedUser
  } catch (error) { throw error }
}

const updateUser = async (userId, reqBody) => {
  try {
    const updatedUser = await userModel.updateUser(userId, reqBody)
    return updatedUser
  } catch (error) { throw error }
}

const login = async (reqBody) => {
  try {
    const existsUser = await userModel.findOneByUsername(reqBody.Username)

    if (!existsUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not Found!')

    if (!bcryptjs.compareSync(reqBody.Password, existsUser.Password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'your Username or Password is incorrect!')
    }

    const userInfo = {
      EmployeeId: existsUser.EmployeeId,
      Username: existsUser.Username
    }

    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
      //5
    )

    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
      //30
    )

    return { accessToken, refreshToken, ...pickUser(existsUser) }

  } catch (error) { throw error }
}

const refreshToken = async(clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_TOKEN_SECRET_SIGNATURE)

    const userInfo = {
      EmployeeId: refreshTokenDecoded.EmployeeId,
      Username: refreshTokenDecoded.Username
    }
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
      //5
    )
    return { accessToken }
  } catch (error) { throw error }
}


export const userService = {
  getUserDetailById,
  update,
  updatedAvatar,
  createNew,
  getAllUser,
  deleteUser,
  updateUser,
  login,
  refreshToken
}