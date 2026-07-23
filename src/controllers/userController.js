import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'
import ApiError from '~/utils/ApiError'
import ms from 'ms'

const getUserDetailById = async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const user = await userService.getUserDetailById(userId)
    res.status(StatusCodes.OK).json(user)
  } catch (error) { next(error) }
}

const update = async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const UpdatedUser = await userService.update(userId, req.body)
    res.status(StatusCodes.OK).json(UpdatedUser)
  } catch (error) { next(error) }
}

const updatedAvatar = async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const uploadAvatar = await userService.updatedAvatar(userId, req.file)
    res.status(StatusCodes.OK).json(uploadAvatar)
  } catch (error) { next(error) }
}


const createNew = async (req, res, next) => {
  try {
    const createdUser = await userService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) { next(error) }
}


const getAllUser = async (req, res, next) => {
  try {
    const getUser = await userService.getAllUser()
    res.status(StatusCodes.OK).json(getUser)
  } catch (error) { next(error) }
}

const deleteUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const deletedUser = await userService.deleteUser(userId)
    res.status(StatusCodes.OK).json(deletedUser)
  } catch (error) { next(error) }
}

const updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const UpdatedUser = await userService.updateUser(userId, req.body)
    res.status(StatusCodes.OK).json(UpdatedUser)
  } catch (error) { next(error) }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const logout = async (req, res, next) => {
  try {
    // Xóa cookie - đơn giản là làm ngược lại so với việc gán cookie ở hàm login
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.status(StatusCodes.OK).json({ loggedOut : true })
  } catch (error) { next(error) }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'Please Sign In! (Error from refresh Token)'))
  }
}

export const userController = {
  getUserDetailById,
  update,
  updatedAvatar,
  createNew,
  getAllUser,
  deleteUser,
  updateUser,
  login,
  logout,
  refreshToken
}