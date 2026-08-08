import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { ROLE_PERMISSIONS } from '~/config/rolePermissions'

export const authorizePermission = (resource, requiredPermission) => {
  return (req, res, next) => {
    const roleId = Number(req.jwtDecoded?.RoleId)
    if (!roleId) {
      return next( new ApiError( StatusCodes.FORBIDDEN, 'Không xác định được chức vụ của người dùng!' ))
    }
    const userPermissions = ROLE_PERMISSIONS[roleId]?.[resource] || []

    const hasPermission = userPermissions.includes(requiredPermission)

    if (!hasPermission) {
      return next( new ApiError( StatusCodes.FORBIDDEN, 'Bạn không có quyền thực hiện chức năng này!' ))
    }
    next()
  }
}