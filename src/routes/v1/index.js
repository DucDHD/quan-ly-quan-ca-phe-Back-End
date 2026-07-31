import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoute } from './userRoute'
import { saleRoute } from './saleRoute'

const Router = express.Router()

/** check APIs v1/boards */
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use' })
})


/** User API */
Router.use('/users', userRoute)

/** User API */
Router.use('/sales', saleRoute)


export const APIs_V1 = Router