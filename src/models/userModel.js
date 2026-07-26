import sql from 'mssql'
import { GET_DB } from '~/config/mssql'


const getUserDetailById = async (userId) => {
  try {
    const db = await GET_DB()
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .query(`
            SELECT 
                 EmployeeId, RoleId, Username, FullName, Address, PhoneNumber, Salary, Avatar
            FROM Employees
            WHERE EmployeeId = @userId
        `)

    return result.recordset[0]

  } catch (error) { throw new Error(error) }
}

const findOneByUsername = async (username) => {
  try {
    const db = await GET_DB()
    const result = await db
      .request()
      .input('Username', sql.NVarChar, username)
      .query(`
            SELECT
            EmployeeId, Username, Password, RoleId
            FROM Employees
            WHERE Username = @Username
        `)

    return result.recordset[0]

  } catch (error) { throw new Error(error) }
}


const update = async (userId, updateData) => {
  try {
    const db = await GET_DB()
    const result = await db
      .request()
      .input('EmployeeId', sql.Int, userId)
      .input('FullName', sql.NVarChar(256), updateData.FullName)
      .input('Address', sql.NVarChar(256), updateData.Address)
      .input('PhoneNumber', sql.VarChar(10), updateData.PhoneNumber)
      .query(`
        UPDATE Employees
        SET
          FullName = @FullName,
          Address = @Address,
          PhoneNumber = @PhoneNumber,
          UpdatedAt = GETDATE()
        WHERE EmployeeId = @EmployeeId
      `)
    return result
  } catch (error) { throw new Error(error) }
}

const updatedAvatar = async (userId, updateData) => {
  try {
    const db = await GET_DB()
    const result = await db
      .request()
      .input('EmployeeId', sql.Int, userId)
      .input('Avatar', sql.NVarChar(256), updateData)
      .query(`
        UPDATE Employees
        SET
          Avatar = @Avatar
        WHERE EmployeeId = @EmployeeId
      `)
    return result
  } catch (error) { throw new Error(error) }
}

const createNew = async (updateData) => {
  const db = await GET_DB()
  const result = await db
    .request()
    .input('RoleId', sql.Int, updateData.RoleId)
    .input('Username', sql.NVarChar(50), updateData.Username)
    .input('Password', sql.NVarChar(255), updateData.Password)
    .input('FullName', sql.NVarChar(100), updateData.FullName)
    .input('Address', sql.NVarChar(255), updateData.Address)
    .input('PhoneNumber', sql.VarChar(20), updateData.PhoneNumber)
    .input('Salary', sql.Decimal(18, 2), updateData.Salary)
    .query(`
        INSERT INTO Employees ( RoleId, Username, Password,FullName, Address, PhoneNumber, Salary )
        OUTPUT INSERTED.*
        VALUES ( @RoleId, @Username, @Password, @FullName, @Address, @PhoneNumber, @Salary )
      `)
  return result.recordset[0]

}

const getAllUser = async ({ sortBy, order, search, offset, limit }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    const columnMap = {
      EmployeeId: 'EmployeeId',
      FullName: 'FullName',
      RoleId: 'RoleId',
      Salary: 'Salary'
    }
    const orderByColumn = columnMap[sortBy] || 'EmployeeId'
    let where = ''

    if (search) {
      where += ' WHERE FullName LIKE @search '
      request.input('search', `%${search}%`)
    }

    request
      .input('offset', offset)
      .input('limit', limit)

    const query = `
      SELECT  
      EmployeeId, RoleId, Username,FullName,Address, PhoneNumber, Salary, Avatar
      FROM Employees
      ${where}
      ORDER BY ${orderByColumn} ${order}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `
    const result = await request.query(query)

    return result.recordset
  } catch (error) { throw new Error(error) }
}


const countAllUser = async ({ search }) => {
  try {
    const db = await GET_DB()
    const request = db.request()
    let where = ''
    if (search) {
      where = ' WHERE FullName LIKE @search '
      request.input('search', `%${search}%`)
    }

    const result = await request.query(`
      SELECT COUNT(EmployeeId) AS totalRows
      FROM Employees
      ${where}
    `)

    return result.recordset[0].totalRows

  } catch (error) { throw new Error(error) }
}

const deleteUser = async (userId) => {
  try {
    const db = await GET_DB()
    const result = await db
      .request()
      .input('EmployeeId', sql.Int, userId)
      .query(`
        DELETE FROM Employees
        WHERE EmployeeId = @EmployeeId
      `)

    return result.rowsAffected[0]
  } catch (error) { throw new Error(error) }
}


const updateUser = async (userId, updateData) => {
  try {
    const db = await GET_DB()
    const result = await db
      .request()
      .input('EmployeeId', sql.Int, userId)
      .input('RoleId', sql.Int, updateData.RoleId)
      .input('FullName', sql.NVarChar, updateData.FullName)
      .input('Address', sql.NVarChar, updateData.Address)
      .input('PhoneNumber', sql.NVarChar, updateData.PhoneNumber)
      .input('Salary', sql.Decimal(18, 2), updateData.Salary)
      .query(`
        UPDATE Employees
        SET
          RoleId = @RoleId,
          FullName = @FullName,
          Address = @Address,
          PhoneNumber = @PhoneNumber,
          Salary = @Salary,
          UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE EmployeeId = @EmployeeId
      `)
    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}


export const userModel = {
  getUserDetailById,
  update,
  updatedAvatar,
  findOneByUsername,
  createNew,
  getAllUser,
  deleteUser,
  updateUser,
  countAllUser
}