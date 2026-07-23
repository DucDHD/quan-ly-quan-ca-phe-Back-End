import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

const isAuthorized = async (req, res, next) => {

  const clientAccessToken = req.cookies?.accessToken


  if (!clientAccessToken) {
    next( new ApiError(StatusCodes.UNAUTHORIZED, 'unauthorized! (token not found)'))
  }

  try {
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)
    req.jwtDecoded = accessTokenDecoded
    next()
  } catch (error) {

    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'need to fresh token.'))
      return
    }
    next( new ApiError(StatusCodes.UNAUTHORIZED, 'unauthorized!'))
  }
}

export const authMiddleware = {
  isAuthorized
}