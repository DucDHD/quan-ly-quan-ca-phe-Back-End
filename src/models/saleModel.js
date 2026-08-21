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

const findOneByCustomer = async updateData => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('PhoneNumber', sql.VarChar(15), updateData.PhoneNumber.trim())

    const result = await request.query(`
      SELECT CustomerId, CustomerName, PhoneNumber
      FROM Customers
      WHERE PhoneNumber = @PhoneNumber
    `)

    return result.recordset[0]
  } catch (error) { throw error }
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
       VALUES ( @CustomerName, @PhoneNumber )
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
      .input('Status', sql.Int, updateData.Status)

    const result = await request.query(`
      INSERT INTO Bookings (CustomerId, TableId, BookingTime, PeopleCount, Status) OUTPUT INSERTED.*
      VALUES (@CustomerId, @TableId, @BookingTime, @PeopleCount, @Status)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findBookingByTime = async (tableId, bookingTime) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', tableId)
      .input('BookingTime', bookingTime)

    const result = await request.query(`
      SELECT BookingId, TableId, CustomerId, BookingTime, PeopleCount, Status
      FROM Bookings
      WHERE TableId = @TableId
        AND BookingTime = @BookingTime
        AND Status = 1
    `)

    return result.recordset[0]
  } catch (error) {
    throw error
  }
}

const findBookingConflict = async (tableId, bookingTime) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, tableId)
      .input('BookingTime', sql.DateTime, bookingTime)

    const result = await request.query(`
      SELECT BookingId, TableId, BookingTime, Status
      FROM Bookings
      WHERE TableId = @TableId
        AND Status IN (1, 2)
        AND ABS(DATEDIFF(MINUTE, BookingTime, @BookingTime)) < 120
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

const findCurrentBookingByTableId = async tableId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, tableId)

    const result = await request.query(`
      SELECT TOP 1
        BookingId,
        CustomerId,
        TableId,
        BookingTime,
        PeopleCount,
        Status
      FROM Bookings
      WHERE TableId = @TableId
        AND Status IN (1, 2)
      ORDER BY
        CASE WHEN Status = 2 THEN 0 ELSE 1 END,
        BookingTime ASC
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findOneByInvoice = async (TableId, CustomerId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, TableId)
      .input('CustomerId', sql.Int, CustomerId)

    const result = await request.query(`
      SELECT InvoiceId, EmployeeId, TableId, CustomerId, TotalPrice, InvoiceStatus
      FROM Invoices
      WHERE TableId = @TableId
        AND CustomerId = @CustomerId
        AND InvoiceStatus = 1
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findOrderProductIdAndProductId = async (tableId, productId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, tableId)
      .input('ProductId', sql.Int, productId)

    const result = await request.query(`
      SELECT OrderProductId, TableId, ProductId, Quantity, Status
      FROM OrderProducts
      WHERE TableId = @TableId AND ProductId = @ProductId  AND Status = 1
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findOrderProduct = async (tableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, tableId)
    const result = await request.query(`
      SELECT OrderProductId, TableId, ProductId, Quantity, Status
      FROM OrderProducts
      WHERE TableId = @TableId AND Status = 1
    `)

    return result.recordset
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
      .input('Status', sql.Int, reqBody.Status)

    const result = await request.query(`
      INSERT INTO OrderProducts (TableId, ProductId, Quantity, Status)
      OUTPUT INSERTED.*
      VALUES ( @TableId, @ProductId, @Quantity, @Status)
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
      WHERE TableId = @TableId AND ProductId = @ProductId AND Status = 1
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
      WHERE InvoiceId = @InvoiceId AND InvoiceStatus = 1
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

    request
      .input('InvoiceId', sql.Int, invoiceId)
      .input('ProductId', sql.Int, productId)

    const result = await request.query(`
      SELECT InvoiceId, ProductId, Quantity, Price
      FROM InvoiceDetails
      WHERE InvoiceId = @InvoiceId
        AND ProductId = @ProductId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findInvoiceAndProductId = async (InvoiceId, ProductId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('InvoiceId', sql.Int, InvoiceId)
      .input('ProductId', sql.Int, ProductId)

    const result = await request.query(`
      SELECT InvoiceId, ProductId, Quantity, Price
      FROM InvoiceDetails
      WHERE InvoiceId = @InvoiceId
        AND ProductId = @ProductId
    `)

    return result.recordset[0]
  } catch (error) {throw error}
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

const updateInvoiceDetail = async (updateData) => {
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

// const getTableDetail = async (TableId) => {
//   try {
//     const db = await GET_DB()

//     const request = db.request()
//     request.input('TableId', sql.Int, TableId)

//     const result = await request.query(`
//       SELECT
//           Customers.CustomerName, Customers.PhoneNumber,
//           Bookings.BookingTime,Bookings.PeopleCount, 
//           Products.ProductName, OrderProducts.Quantity, Products.Price
//       FROM OrderProducts
//       JOIN Products ON OrderProducts.ProductId = Products.ProductId
//       JOIN Bookings ON OrderProducts.TableId = Bookings.TableId
//       JOIN Customers ON Bookings.CustomerId = Customers.CustomerId
//       WHERE Bookings.TableId = @TableId 
//         AND Bookings.Status = 1
//         AND OrderProducts.Status = 1
//       ORDER BY Products.ProductName
//     `)

//     return result.recordset
//   } catch (error) { throw error }
// }

const getCustomerBookingsByTableId = async (TableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT
        Bookings.BookingId,
        Bookings.BookingTime,
        Bookings.PeopleCount,
        Bookings.Status,
        Customers.CustomerName,
        Customers.PhoneNumber,
        Bookings.CustomerId
      FROM Bookings
      JOIN Customers ON Bookings.CustomerId = Customers.CustomerId
      WHERE Bookings.TableId = @TableId
        AND Bookings.Status IN (1, 2)
      ORDER BY Bookings.BookingTime ASC
    `)

    return result.recordset
  } catch (error) { throw error }
}

const countBookingsByStatus = async (tableId, status) => {
  try {
    const db = await GET_DB()

    const result = await db.request()
      .input('TableId', sql.Int, tableId)
      .input('Status', sql.Int, status)
      .query(`
        SELECT COUNT(*) AS Total
        FROM Bookings
        WHERE TableId = @TableId
        AND Status = @Status
      `)

    return result.recordset[0].Total
  } catch (error) { throw error }
}

const findProductsByTableId = async TableId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT
        Products.ProductId,
        Products.ProductName,
        OrderProducts.Quantity,
        Products.Price
      FROM OrderProducts
      JOIN Products ON OrderProducts.ProductId = Products.ProductId
      WHERE OrderProducts.TableId = @TableId
        AND OrderProducts.Status = 1
      ORDER BY Products.ProductName
    `)

    return result.recordset
  } catch (error) { throw error }
}
const findCurrentCustomerByTableId = async TableId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT
        Bookings.BookingId,
        Bookings.CustomerId,
        Bookings.BookingTime,
        Bookings.PeopleCount,
        Customers.CustomerName,
        Customers.PhoneNumber
      FROM Bookings
      JOIN Customers ON Bookings.CustomerId = Customers.CustomerId
      WHERE Bookings.TableId = @TableId
        AND Bookings.Status = 2
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}


const getPaymentInfo = async (TableId) => {
  try {
    const db = await GET_DB()

    const request = db.request()
    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT
        Products.ProductId,
        Products.ProductName,
        Products.Price,
        OrderProducts.Quantity
      FROM OrderProducts
      JOIN Products ON OrderProducts.ProductId = Products.ProductId
      WHERE OrderProducts.TableId = @TableId
        AND OrderProducts.Status = 1
      ORDER BY Products.ProductName
    `)

    return result.recordset
  } catch (error) { throw error }
}

const findOneByInvoiceIdAndBookingId = async (TableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT TOP 1
        Invoices.InvoiceId,
        Invoices.TotalPrice,
        Bookings.BookingId,
        Bookings.CustomerId
      FROM Bookings
      INNER JOIN Invoices
        ON Bookings.TableId = Invoices.TableId
        AND Bookings.CustomerId = Invoices.CustomerId
      WHERE Bookings.TableId = @TableId
        AND Bookings.Status = 2
        AND Invoices.InvoiceStatus = 1
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updatedStatusInvoice = async ({ InvoiceId, InvoiceStatus }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('InvoiceId', sql.Int, InvoiceId)
      .input('InvoiceStatus', sql.Int, InvoiceStatus)

    const result = await request.query(`
      UPDATE Invoices
      SET InvoiceStatus = @InvoiceStatus
      OUTPUT INSERTED.*
      WHERE InvoiceId = @InvoiceId AND InvoiceStatus = 1
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updatedStatusOrderProducts = async (TableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, TableId)
    const result = await request.query(`
      UPDATE OrderProducts
      SET Status = 2
      OUTPUT INSERTED.*
      WHERE TableId = @TableId AND Status = 1
    `)
    return result.recordset
  } catch (error) { throw error }
}

const updatedStatusBooking = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('BookingId', sql.Int, updateData.BookingId)
      .input('Status', sql.Int, updateData.Status)

    const result = await request.query(`
      UPDATE Bookings
      SET Status = @Status
      OUTPUT INSERTED.*
      WHERE BookingId = @BookingId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findStatusTableById = async (tableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', tableId)
    const result = await request.query(`
      SELECT TableId, TableNumber, TableStatus
      FROM CafeTables
      WHERE TableId = @TableId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findCurrentBooking = async tableId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', tableId)

    const result = await request.query(`
      SELECT TOP 1 BookingId, TableId, BookingTime, Status
      FROM Bookings
      WHERE TableId = @TableId
        AND Status = 1
        AND BookingTime <= GETDATE()
      ORDER BY BookingTime DESC
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}


const transferOrderProducts = async (oldTableId, newTableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('OldTableId', sql.Int, oldTableId)
      .input('NewTableId', sql.Int, newTableId)

    const result = await request.query(`
      UPDATE OrderProducts
      SET TableId = @NewTableId
      OUTPUT INSERTED.*
      WHERE TableId = @OldTableId
    `)

    return result.recordset
  } catch (error) { throw error }
}

const transferInvoice = async (oldTableId, newTableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('OldTableId', sql.Int, oldTableId)
      .input('NewTableId', sql.Int, newTableId)
    const result = await request.query(`
      UPDATE Invoices
      SET TableId = @NewTableId
      OUTPUT INSERTED.*
      WHERE TableId = @OldTableId
        AND InvoiceStatus = 1
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

// const transferBooking = async (oldTableId, newTableId, customerId, status) => {
//   try {
//     const db = await GET_DB()
//     const request = db.request()

//     request
//       .input('OldTableId', sql.Int, oldTableId)
//       .input('NewTableId', sql.Int, newTableId)
//       .input('CustomerId', sql.Int, customerId)
//       .input('Status', sql.Int, status)

//     const result = await request.query(`
//       UPDATE Bookings
//       SET TableId = @NewTableId
//       OUTPUT INSERTED.*
//       WHERE TableId = @OldTableId
//       AND CustomerId = @CustomerId
//       AND Status = @Status
//     `)

//     return result.recordset[0]
//   } catch (error) { throw error }
// }

const transferBooking = async (bookingId, newTableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('BookingId', sql.Int, bookingId)
      .input('NewTableId', sql.Int, newTableId)

    const result = await request.query(`
      UPDATE Bookings
      SET TableId = @NewTableId
      OUTPUT INSERTED.*
      WHERE BookingId = @BookingId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const getInfoSplitTable = async (TableId) => {
  try {
    const db = await GET_DB()

    const request = db.request()
    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT
          Products.ProductId,
          Products.ProductName,
          Products.Price,
          OrderProducts.Quantity,
          Bookings.PeopleCount
      FROM OrderProducts
      JOIN Products ON OrderProducts.ProductId = Products.ProductId
      JOIN Bookings ON OrderProducts.TableId = Bookings.TableId
      WHERE OrderProducts.TableId = @TableId 
      AND OrderProducts.Status = 1 
      AND Bookings.Status = 2
      ORDER BY Products.ProductName
    `)

    return result.recordset
  } catch (error) { throw error }
}

const createSplitOrderProduct = async (createData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, createData.TableId)
      .input('ProductId', sql.Int, createData.ProductId)
      .input('Quantity', sql.Int, createData.Quantity)
      .input('Status', sql.Int, createData.Status)

    const result = await request.query(`
      INSERT INTO OrderProducts ( TableId, ProductId, Quantity, Status )
      OUTPUT INSERTED.*
      VALUES ( @TableId, @ProductId, @Quantity, @Status )
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updateSplitOrderProduct = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, updateData.TableId)
      .input('ProductId', sql.Int, updateData.ProductId)
      .input('Quantity', sql.Int, updateData.Quantity)

    const result = await request.query(`
      UPDATE OrderProducts
      SET
        Quantity = Quantity - @Quantity,
        Status = CASE
          WHEN Quantity - @Quantity = 0 THEN 0
          ELSE Status
        END
      OUTPUT INSERTED.*
      WHERE TableId = @TableId
        AND ProductId = @ProductId
        AND Status = 1
        AND Quantity >= @Quantity
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}


const findOneByBookingId = async (TableId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT
        BookingId, CustomerId, TableId, BookingTime, PeopleCount, Status
      FROM Bookings
      WHERE TableId = @TableId AND Status = 2
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const createSplitBooking = async (createData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('CustomerId', sql.Int, createData.CustomerId)
      .input('TableId', sql.Int, createData.TableId)
      .input('BookingTime', sql.DateTime, createData.BookingTime)
      .input('PeopleCount', sql.Int, createData.PeopleCount)
      .input('Status', sql.Int, createData.Status)

    const result = await request.query(`
      INSERT INTO Bookings (CustomerId, TableId, BookingTime, PeopleCount, Status)
      OUTPUT INSERTED.*
      VALUES ( @CustomerId, @TableId, @BookingTime, @PeopleCount, @Status )
    `)

    return result.recordset[0]
  } catch (error) {
    throw error
  }
}

const updateSplitBookingPeopleCount = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, updateData.TableId)
      .input('PeopleCount', sql.Int, updateData.PeopleCount)

    const result = await request.query(`
      UPDATE Bookings
      SET PeopleCount = PeopleCount - @PeopleCount
      OUTPUT INSERTED.*
      WHERE TableId = @TableId
        AND Status = 1
        AND PeopleCount > @PeopleCount
    `)

    return result.recordset[0]
  } catch (error) {
    throw error
  }
}

const updateSplitInvoiceTotalPrice = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('TableId', sql.Int, updateData.TableId)
      .input('TotalPrice', sql.Decimal(18, 2), updateData.TotalPrice)

    const result = await request.query(`
      UPDATE Invoices
      SET TotalPrice = TotalPrice - @TotalPrice
      OUTPUT INSERTED.*
      WHERE TableId = @TableId
        AND InvoiceStatus = 1
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updateSplitInvoiceDetail = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('InvoiceId', sql.Int, updateData.InvoiceId)
      .input('ProductId', sql.Int, updateData.ProductId)
      .input('Quantity', sql.Int, updateData.Quantity)

    const result = await request.query(`
      UPDATE InvoiceDetails
      SET Quantity = Quantity - @Quantity
      OUTPUT INSERTED.*
      WHERE InvoiceId = @InvoiceId
        AND ProductId = @ProductId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const deleteInvoiceDetail = async (deleteData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('InvoiceId', sql.Int, deleteData.InvoiceId)
      .input('ProductId', sql.Int, deleteData.ProductId)

    const result = await request.query(`
      DELETE FROM InvoiceDetails
      OUTPUT DELETED.*
      WHERE InvoiceId = @InvoiceId
        AND ProductId = @ProductId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updateMergeBookingPeopleCount = async updateData => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('BookingId', sql.Int, updateData.BookingId)
      .input('PeopleCount', sql.Int, updateData.PeopleCount)

    const result = await request.query(`
      UPDATE Bookings
      SET PeopleCount = @PeopleCount
      OUTPUT INSERTED.*
      WHERE BookingId = @BookingId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}


const updateOrderProductTableId = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('OrderProductId', sql.Int, updateData.OrderProductId)
      .input('TableId', sql.Int, updateData.TableId)

    const result = await request.query(`
      UPDATE OrderProducts
      SET TableId = @TableId
      OUTPUT INSERTED.*
      WHERE OrderProductId = @OrderProductId AND Status = 1
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updateOrderProductQuantity = async (updateData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('OrderProductId', sql.Int, updateData.OrderProductId)
      .input('Quantity', sql.Int, updateData.Quantity)

    const result = await request.query(`
      UPDATE OrderProducts
      SET Quantity = @Quantity
      OUTPUT INSERTED.*
      WHERE OrderProductId = @OrderProductId
        AND Status = 1
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}


const deleteInvoiceDetailsByInvoiceId = async (InvoiceId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('InvoiceId', sql.Int, InvoiceId)

    await request.query(`
      DELETE FROM InvoiceDetails
      WHERE InvoiceId = @InvoiceId
    `)
  } catch (error) { throw error }
}

const deleteOrderProduct = async (OrderProductId) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input(
      'OrderProductId',
      sql.Int,
      OrderProductId
    )

    await request.query(`
      DELETE FROM OrderProducts
      WHERE OrderProductId = @OrderProductId
    `)
  } catch (error) {
    throw error
  }
}

const createIncome = async (incomeData) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('EmployeeId', sql.Int, incomeData.EmployeeId)
      .input('InvoiceId', sql.Int, incomeData.InvoiceId)
      .input('IncomeDate', sql.DateTime, incomeData.IncomeDate)
      .input('TotalPrice', sql.Decimal(18, 2), incomeData.TotalPrice)
      .input('Description', sql.NVarChar, incomeData.Description)

    const result = await request.query(`
      INSERT INTO Income (EmployeeId, InvoiceId, IncomeDate, TotalPrice, Description)
      OUTPUT INSERTED.*
      VALUES (@EmployeeId, @InvoiceId, @IncomeDate, @TotalPrice, @Description)
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const updateBookingStatus = async ({ BookingId, Status }) => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request
      .input('BookingId', sql.Int, BookingId)
      .input('Status', sql.Int, Status)

    const result = await request.query(`
      UPDATE Bookings
      SET Status = @Status
      OUTPUT INSERTED.*
      WHERE BookingId = @BookingId
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findNextBookingByTableId = async TableId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT TOP 1 BookingId, CustomerId, TableId, BookingTime, PeopleCount, Status
      FROM Bookings
      WHERE TableId = @TableId
        AND Status = 1
      ORDER BY BookingTime ASC
    `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findBookingById = async bookingId => {
  try {
    const db = await GET_DB()

    const result = await db.request()
      .input('BookingId', sql.Int, bookingId)
      .query(`
        SELECT
          BookingId,
          CustomerId,
          TableId,
          BookingTime,
          PeopleCount,
          Status
        FROM Bookings
        WHERE BookingId = @BookingId
      `)

    return result.recordset[0]
  } catch (error) { throw error }
}

const findOrderedBookingsByTableId = async TableId => {
  try {
    const db = await GET_DB()
    const request = db.request()

    request.input('TableId', sql.Int, TableId)

    const result = await request.query(`
      SELECT
        BookingId,
        CustomerId,
        TableId,
        BookingTime,
        PeopleCount,
        Status
      FROM Bookings
      WHERE TableId = @TableId
      AND Status = 2
    `)

    return result.recordset
  } catch (error) { throw error }
}

const findActiveInvoicesByTableId = async TableId => {
  try {
    const db = await GET_DB()

    const result = await db.request()
      .input('TableId', sql.Int, TableId)
      .query(`
        SELECT InvoiceId, EmployeeId, TableId, CustomerId, PromotionId, InvoiceDate, TotalPrice, InvoiceStatus
        FROM Invoices
        WHERE TableId = @TableId
        AND InvoiceStatus = 1
      `)

    return result.recordset
  } catch (error) { throw error }
}

const updateInvoiceTableId = async (InvoiceId, TableId) => {
  try {
    const db = await GET_DB()

    const result = await db.request()
      .input('InvoiceId', sql.Int, InvoiceId)
      .input('TableId', sql.Int, TableId)
      .query(`
        UPDATE Invoices
        SET TableId = @TableId
        OUTPUT INSERTED.*
        WHERE InvoiceId = @InvoiceId
      `)

    return result.recordset[0]
  } catch (error) { throw error }
}

export const saleModel = {
  getAllTable,
  findOneByCustomer,
  createdNewCustomer,
  createNewBooking,
  findBookingByTime,
  findBookingConflict,
  findCurrentBooking,
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
  findInventoryById,
  // getTableDetail,
  getCustomerBookingsByTableId,
  findProductsByTableId,
  getPaymentInfo,
  findOneByInvoiceIdAndBookingId,
  updatedStatusInvoice,
  updatedStatusOrderProducts,
  updatedStatusBooking,
  findStatusTableById,
  transferOrderProducts,
  transferInvoice,
  transferBooking,
  getInfoSplitTable,
  createSplitOrderProduct,
  updateSplitOrderProduct,
  findOneByBookingId,
  createSplitBooking,
  updateSplitBookingPeopleCount,
  updateSplitInvoiceTotalPrice,
  updateSplitInvoiceDetail,
  deleteInvoiceDetail,
  updateMergeBookingPeopleCount,
  deleteInvoiceDetailsByInvoiceId,
  findInvoiceAndProductId,
  deleteOrderProduct,
  findOrderProductIdAndProductId,
  updateOrderProductTableId,
  updateOrderProductQuantity,
  createIncome,
  findCurrentBookingByTableId,
  updateBookingStatus,
  findCurrentCustomerByTableId,
  findNextBookingByTableId,
  countBookingsByStatus,
  findBookingById,
  findOrderedBookingsByTableId,
  findActiveInvoicesByTableId,
  updateInvoiceTableId
}