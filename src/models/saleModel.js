import sql from 'mssql'
import { GET_DB } from '~/config/mssql'


const getAllTable = async () => {
  try {
    const db = await GET_DB()
    const request = db.request()
    const result = await request.query('SELECT TableId, TableNumber, TableStatus FROM CafeTables')

    return result.recordset
  } catch (error) { throw new Error(error) }
}

const findOneByCustomer = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()
    request
      .input('PhoneNumber', sql.VarChar(15), updateData.PhoneNumber)

    const result = await request.query(`
      SELECT 
        CustomerId, CustomerName, PhoneNumber 
      FROM Customers
      WHERE PhoneNumber = @PhoneNumber
      `)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const createdNewCustomer = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()
    request
      .input('CustomerName', sql.NVarChar(100), updateData.CustomerName)
      .input('PhoneNumber', sql.VarChar(15), updateData.PhoneNumber)

    const result = await request.query(`
       INSERT INTO Customers (CustomerName, PhoneNumber) OUTPUT INSERTED.*
       VALUES (@CustomerName, @PhoneNumber)
      `)

    return result.recordset[0]
  } catch (error) { throw new Error(error) }
}

const createNewBooking = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('CustomerId', sql.Int, updateData.CustomerId)
      .input('TableId', sql.Int, updateData.TableId)
      .input('BookingTime', sql.DateTime, updateData.BookingTime)
      .input('PeopleCount', sql.Int, updateData.PeopleCount)

    const result = await request.query(`
      INSERT INTO Bookings (CustomerId, TableId, BookingTime, PeopleCount) OUTPUT INSERTED.*
      VALUES (@CustomerId, @TableId, @BookingTime, @PeopleCount)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updateTableStatus = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, updateData.TableId)
      .input('TableStatus', sql.Int, updateData.TableStatus)

    const result = await request.query(`
      UPDATE CafeTables
      SET TableStatus = @TableStatus
      OUTPUT INSERTED.*
      WHERE TableId = @TableId
    `)
    return result.recordset[0]
  } catch (error) { throw error }
}

const getAllProduct = async () => {
  try {
    const db = await GET_DB()
    const request = db.request()
    const result = await request.query('SELECT ProductId, ProductName, Price FROM Products')

    return result.recordset
  } catch (error) { throw new Error(error) }
}

const findCustomerByTableId = async (tableId) => {
  try {

    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', tableId)

    const result = await request.query(`
      SELECT
        Customers.CustomerId, Customers.CustomerName, Customers.PhoneNumber
      FROM CafeTables
      INNER JOIN Bookings ON CafeTables.TableId = Bookings.TableId
      INNER JOIN Customers ON Bookings.CustomerId = Customers.CustomerId
      WHERE CafeTables.TableId = @TableId
    `)
    return result.recordset[0]
  } catch (error) { throw error }
}

const findOneByInvoice = async (tableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()
    request.input('TableId', tableId)
    const result = await request.query('SELECT InvoiceId, TotalPrice FROM Invoices WHERE TableId = @TableId  AND InvoiceStatus = 1')

    return result.recordset[0]
  } catch (error) { throw error }
}

const findOrderProduct = async (tableId, productId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, tableId)
      .input('ProductId', sql.Int, productId)

    const result = await request.query(`
      SELECT ProductId, Quantity
      FROM OrderProducts
      WHERE TableId = @TableId AND ProductId = @ProductId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const createOrder = async (reqBody) => {
  try {

    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, reqBody.TableId)
      .input('ProductId', sql.Int, reqBody.ProductId)
      .input('Quantity', sql.Int, reqBody.Quantity)

    const result = await request.query(`
      INSERT INTO OrderProducts (TableId, ProductId, Quantity)
      OUTPUT INSERTED.*
      VALUES ( @TableId, @ProductId, @Quantity)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}


const updateOrderProduct = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', updateData.TableId)
    request.input('ProductId', updateData.ProductId)
    request.input('Quantity', updateData.Quantity)

    const result = await request.query(`
      UPDATE OrderProducts
      SET Quantity = @Quantity
      OUTPUT INSERTED.*
      WHERE TableId = @TableId AND ProductId = @ProductId
    `)

    return result.recordset[0]
  } catch (error) {
    throw error
  }
}


const createInvoice = async (updateData) => {
  try {
    const db = await GET_DB()

    const request = db.request()
    request
      .input('EmployeeId', sql.Int, updateData.EmployeeId)
      .input('TableId', sql.Int, updateData.TableId)
      .input('CustomerId', sql.Int, updateData.CustomerId)
      .input('PromotionId', sql.Int, updateData.PromotionId)
      .input('TotalPrice', sql.Decimal(18, 2), updateData.TotalPrice)
      .input('InvoiceStatus', sql.Int, updateData.InvoiceStatus)

    const result = await request.query(`
      INSERT INTO Invoices ( EmployeeId, TableId, CustomerId, PromotionId,InvoiceDate, TotalPrice, InvoiceStatus)
      OUTPUT INSERTED.*
      VALUES ( @EmployeeId, @TableId, @CustomerId, @PromotionId, GETDATE(), @TotalPrice, @InvoiceStatus )
    `)

    return result.recordset[0]
  } catch (error) {throw error }
}

const updateInvoice = async ({ InvoiceId, TotalPrice }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InvoiceId', InvoiceId)
    request.input('TotalPrice', TotalPrice)

    const result = await request.query(`
      UPDATE Invoices
      SET TotalPrice = @TotalPrice
      OUTPUT INSERTED.*
      WHERE InvoiceId = @InvoiceId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findProductsByIds = async (productIds) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    const parameters = productIds.map((productId, index) => {
      request.input(`ProductId${index}`, productId)
      return `@ProductId${index}`
    })

    const result = await request.query(`
      SELECT ProductId, ProductName, Price, InventoryId
      FROM Products
      WHERE ProductId IN (${parameters.join(', ')})
    `)

    return result.recordset
  } catch (error) {throw error }
}

const findInvoiceDetail = async (invoiceId, productId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InvoiceId', invoiceId)
    request.input('ProductId', productId)

    const result = await request.query(`
      SELECT InvoiceId, ProductId, Quantity, Price
      FROM InvoiceDetails
      WHERE InvoiceId = @InvoiceId AND ProductId = @ProductId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const createInvoiceDetail = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InvoiceId', updateData.InvoiceId)
    request.input('ProductId', updateData.ProductId)
    request.input('Quantity', updateData.Quantity)
    request.input('Price', updateData.Price)

    const result = await request.query(`
      INSERT INTO InvoiceDetails (InvoiceId, ProductId, Quantity, Price )
      OUTPUT INSERTED.*
      VALUES (@InvoiceId, @ProductId,@Quantity, @Price )
    `)

    return result.recordset[0]
  } catch (error) { throw error}
}

const updateInvoiceDetail = async updateData => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InvoiceId', updateData.InvoiceId)
    request.input('ProductId', updateData.ProductId)
    request.input('Quantity', updateData.Quantity)
    request.input('Price', updateData.Price)

    const result = await request.query(`
      UPDATE InvoiceDetails
      SET Quantity = @Quantity, Price = @Price
      OUTPUT INSERTED.*
      WHERE InvoiceId = @InvoiceId AND ProductId = @ProductId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}


const updateInventory = async updateData => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('InventoryId', sql.Int, updateData.InventoryId)
      .input('StockQuantity', sql.Int, updateData.StockQuantity)

    const result = await request.query(`
      UPDATE Inventory
      SET StockQuantity = @StockQuantity
      OUTPUT INSERTED.*
      WHERE InventoryId = @InventoryId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findInventoryById = async (InventoryId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InventoryId', sql.Int, InventoryId)

    const result = await request.query(`
      SELECT InventoryId, StockQuantity
      FROM Inventory
      WHERE InventoryId = @InventoryId
    `)

    return result.recordset[0]
  } catch (error) {throw error }
}

export const saleModel = {
  getAllTable,
  findOneByCustomer,
  createdNewCustomer,
  createNewBooking,
  updateTableStatus,
  getAllProduct,
  findCustomerByTableId,
  findOrderProduct,
  createOrder,
  createInvoice,
  updateOrderProduct,
  findOneByInvoice,
  updateInvoice,
  findProductsByIds,
  findInvoiceDetail,
  createInvoiceDetail,
  updateInvoiceDetail,
  updateInventory,
  findInventoryById
}