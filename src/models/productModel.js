import { GET_DB } from '~/config/mssql'

const getAllProducts = async ({ sortBy, order, search, offset, limit, status }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    const columnMap = {
      ProductId: 'ProductId',
      ProductName: 'ProductName',
      Price: 'Price'
    }

    const orderByColumn = columnMap[sortBy] || 'ProductId'

    request.input('status', status)
    let where = ' WHERE Status = @status '

    if (search) {
      where += ' AND ProductName LIKE @search '
      request.input('search', `%${search}%`)
    }

    request
      .input('offset', offset)
      .input('limit', limit)

    const query = (`
      SELECT ProductId, ProductName, Price
      FROM Products
      ${where}
      ORDER BY ${orderByColumn} ${order}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `)

    const result = await request.query(query)

    return result.recordset
  } catch (error) { throw new Error(error) }
}

const countAllProducts = async ({ search, status }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('status', status)
    let where = ' WHERE Status = @status '

    if (search) {
      where += ' AND ProductName LIKE @search '
      request.input('search', `%${search}%`)
    }

    const query = `
      SELECT COUNT(*) AS total
      FROM Products
      ${where}
    `

    const result = await request.query(query)

    return result.recordset[0].total
  } catch (error) { throw new Error(error) }
}

const getAvailableProducts = async (status) => {
  try {
    const db = await GET_DB()
    const request = db.request()
    request.input('status', status)

    const query = `
      SELECT
        Inventory.InventoryId,
        Inventory.CategoryId,
        InventoryCategories.CategoryName
      FROM Inventory
      INNER JOIN InventoryCategories
        ON Inventory.CategoryId = InventoryCategories.CategoryId
      WHERE NOT EXISTS (
        SELECT 1
        FROM Products
        WHERE Products.InventoryId = Inventory.InventoryId AND Products.Status = @status
      )
      ORDER BY InventoryCategories.CategoryName ASC
    `

    const result = await request.query(query)

    return result.recordset
  } catch (error) { throw new Error(error) }
}

const findInventoryById = async InventoryId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InventoryId', InventoryId)

    const query = `
      SELECT
        Inventory.InventoryId,
        Inventory.CategoryId,
        InventoryCategories.CategoryName
      FROM Inventory
      INNER JOIN InventoryCategories
        ON Inventory.CategoryId = InventoryCategories.CategoryId
      WHERE Inventory.InventoryId = @InventoryId
    `

    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const findProductByInventoryId = async InventoryId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InventoryId', InventoryId)

    const query = `
      SELECT ProductId, ProductName, InventoryId, Status
      FROM Products
      WHERE InventoryId = @InventoryId
    `

    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const createProduct = async (ProductName, Price, InventoryId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('ProductName', ProductName)
      .input('Price', Price)
      .input('InventoryId', InventoryId)

    const query = `
      INSERT INTO Products (ProductName, Price, InventoryId)
      OUTPUT INSERTED.*
      VALUES (@ProductName, @Price, @InventoryId)
    `

    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const updateProductStatus = async (ProductId, Price) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('ProductId', ProductId)
      .input('Price', Price)

    const query = `
      UPDATE Products
      SET Status = 1,
          Price = @Price
      OUTPUT INSERTED.*
      WHERE ProductId = @ProductId
    `

    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const deleteProduct = async ProductId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('ProductId', ProductId)

    const query = `
      UPDATE Products
      SET Status = 0
      OUTPUT INSERTED.*
      WHERE ProductId = @ProductId
    `

    const result = await request.query(query)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}


export const productModel = {
  getAllProducts,
  countAllProducts,
  getAvailableProducts,
  findInventoryById,
  findProductByInventoryId,
  createProduct,
  updateProductStatus,
  deleteProduct
}