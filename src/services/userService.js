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

// const getAllUser = async () => {
//   try {
//     const getUser = await userModel.getAllUser()
//     return getUser
//   } catch (error) { throw error }
// }

const getAllUser = async ({ sortBy = 'EmployeeId', order = 'asc', search = '', page = 1, limit = 5 }) => {
  const allowedSortFields = [
    'EmployeeId',
    'FullName',
    'RoleId',
    'Salary'
  ]
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy: 'EmployeeId'
  const validOrder = order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
  const validSearch = typeof search === 'string' ? search.trim(): ''


  const parsedPage = Number.parseInt(page, 10)
  const parsedLimit = Number.parseInt(limit, 10)

  const validPage = Number.isInteger(parsedPage) && parsedPage > 0? parsedPage : 1
  const validLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 5

  const offset = (validPage - 1) * validLimit

  const users = await userModel.getAllUser({
    sortBy: validSortBy,
    order: validOrder,
    search: validSearch,
    offset,
    limit: validLimit
  })

  const totalRows = await userModel.countAllUser({ search })

  const totalPages = Math.ceil(totalRows / validLimit)

  return {
    users,
    pagination: {
      page: validPage,
      limit: validLimit,
      totalRows,
      totalPages
    }
  }
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