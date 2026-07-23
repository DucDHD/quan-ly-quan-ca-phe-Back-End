import sql from 'mssql'
import { env } from '~/config/environment'


const configDB = {
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  server: env.DATABASE_SERVER,
  database: env.DATABASE_NAME,
  port: env.DATABASE_PORT,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}

let mssqlInstance = null

export const CONNECT_DB = async () => {
  mssqlInstance = await sql.connect(configDB)
}

export const GET_DB = () => {
  if (!mssqlInstance) throw new Error('Must connect to Database first')
  return mssqlInstance
}

export const CLOSE_DB = async () => {
  await sql.close()
}