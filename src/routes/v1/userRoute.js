import express from 'express'
import { userController } from '~/controllers/userController'
import { userValidation } from '~/validations/userValidation'
import { uploadAvatar } from '~/middlewares/uploadAvatar'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .post(authMiddleware.isAuthorized, userValidation.createNew, userController.createNew)
  .get(authMiddleware.isAuthorized, userController.getAllUser)


Router.route('/login')
  .post(userValidation.login, userController.login)

Router.route('/logout')
  .delete(userController.logout)

Router.route('/refresh_token')
  .get(userController.refreshToken)

Router.route('/:id')
  .get(authMiddleware.isAuthorized, userController.getUserDetailById)
  .delete(authMiddleware.isAuthorized, userValidation.deleteUser, userController.deleteUser)
  .put(authMiddleware.isAuthorized, userValidation.updateUser, userController.updateUser)

Router.route('/profile/:id')
  .put(authMiddleware.isAuthorized, userValidation.update, userController.update)

Router.route('/avatar/:id')
  .put(authMiddleware.isAuthorized, uploadAvatar.single('avatar'), userController.updatedAvatar)


export const userRoute = Router