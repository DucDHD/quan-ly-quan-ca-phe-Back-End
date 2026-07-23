/* eslint-disable no-console */
import express from 'express'
import { APIs_V1 } from '~/routes/v1/'
import { env } from '~/config/environment'
import { CONNECT_DB } from '~/config/mssql'
import cors from 'cors'
import { corsOptions } from '~/config/cors'
import path from 'path'
import cookieParser from 'cookie-parser'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'

const START_SERVER = () => {

  const app = express()

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Cấu hình cookieParser
  app.use(cookieParser())

  // use cors
  app.use(cors(corsOptions))


  // Enable req.body json data
  app.use(express.json())

  app.use(
    '/uploads',
    express.static(path.resolve('src/assets/uploads'))
  )


  // Use APIs V1
  app.use('/v1', APIs_V1)
  app.use(errorHandlingMiddleware)

  app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
    console.log(`3. Local Dev: Back-end Server is running success at http://${ env.LOCAL_DEV_APP_HOST }:${ env.LOCAL_DEV_APP_PORT }/`)
  })

}


( async () => {
  try {
    console.log('1. Connecting to SQL server...')
    CONNECT_DB()
    console.log('2. Connected to SQL server')
    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()