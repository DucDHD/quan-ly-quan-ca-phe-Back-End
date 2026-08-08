import { saleModel } from '~/models/saleModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const getAllTable = async () => {
  try {
    const getTable = await saleModel.getAllTable()
    return getTable
  } catch (error) { throw error }
}

const bookingTable = async (reqBody) => {
  try {

    let createdNewCustomer = null

    const existCustomer = await saleModel.findOneByCustomer(reqBody)
    if (!existCustomer) {
      createdNewCustomer = await saleModel.createdNewCustomer(reqBody)
    }

    const bookingData = {
      ...reqBody,
      CustomerId: existCustomer ? existCustomer.CustomerId : createdNewCustomer.CustomerId,
      Status:1
    }

    const bookingTable = await saleModel.createNewBooking(bookingData)

    const updateStatusTable = await saleModel.updateTableStatus({
      TableId: reqBody.TableId,
      TableStatus: 3
    })

    //return createdNewCustomer

    return { createdNewCustomer, bookingTable, updateStatusTable }
  } catch (error) { throw error }
}

const getAllProduct = async () => {
  try {
    const getProduct = await saleModel.getAllProduct()
    return getProduct
  } catch (error) { throw error }
}


const createOrder = async (reqBody, EmployeeId) => {
  try {
    // 1. Lấy danh sách ProductId
    const productIds = reqBody.Products.map(item => item.ProductId)

    // 2. Lấy thông tin sản phẩm và giá từ database
    const products = await saleModel.findProductsByIds(productIds)

    // 3. Tính tổng tiền của lần gọi món này
    const totalPrice = totalPriceInvoice(products, reqBody.Products)

    // 4. Lấy khách hàng của bàn
    const customerByTableId = await saleModel.findCustomerByTableId(reqBody.TableId)

    // 5. Insert hoặc update OrderProducts

    const orderProducts = await handleOrderProducts(reqBody.TableId, reqBody.Products)

    // 6. Tạo hoặc cập nhật hóa đơn

    const { invoice, updateStatusTable } = await handleInvoice(reqBody.TableId, totalPrice, EmployeeId, customerByTableId)

    // 7. Insert hoặc update InvoiceDetails
    const invoiceDetails = await handleInvoiceDetails(invoice.InvoiceId, products, reqBody.Products)

    // 8. Trừ kho
    const updatedInventories = await handleInventories(products, reqBody.Products)

    return {
      products,
      orderProducts,
      invoice,
      invoiceDetails,
      updatedInventories,
      updateStatusTable
    }

  } catch (error) { throw error }
}

const totalPriceInvoice = ( products, productFromClient ) => {
  let totalPrice = 0
  for ( const item of productFromClient) {
    const product = products.find( product => product.ProductId === item.ProductId )
    totalPrice += Number(product.Price) * Number(item.Quantity)
  }
  return totalPrice
}

const handleOrderProducts = async (TableId, productFromClient ) => {
  const orderProducts = []

  for (const item of productFromClient) {
    const existOrderProduct = await saleModel.findOrderProduct( TableId, item.ProductId)

    let orderProduct

    if (!existOrderProduct) {
      orderProduct = await saleModel.createOrder({ TableId, ProductId: item.ProductId, Quantity: Number(item.Quantity), Status: 1 })
    } else {
      const newQuantity = Number(existOrderProduct.Quantity) + Number(item.Quantity)

      orderProduct = await saleModel.updateOrderProduct({
        TableId,
        ProductId: item.ProductId,
        Quantity: newQuantity
      })
    }

    orderProducts.push(orderProduct)
  }
  return orderProducts
}

const handleInvoice = async (TableId, totalPrice, EmployeeId, customerByTableId ) => {
  const existInvoice = await saleModel.findOneByInvoice(TableId)
  let invoice
  let updateStatusTable = null
  const createData = {
    EmployeeId,
    TableId,
    CustomerId: customerByTableId?.CustomerId ?? null,
    PromotionId: null,
    TotalPrice: totalPrice,
    InvoiceStatus: 1
  }
  if (!existInvoice) {
    invoice = await saleModel.createInvoice(createData)
    // Cập nhật trạng thái bàn
    updateStatusTable = await saleModel.updateTableStatus({ TableId, TableStatus: 2 })
  } else {
    const newTotalPrice = Number(existInvoice.TotalPrice) + Number(totalPrice)
    const updateData = {
      InvoiceId: existInvoice.InvoiceId,
      TotalPrice: newTotalPrice
    }

    invoice = await saleModel.updateInvoice(updateData)
  }
  return { invoice, updateStatusTable }
}

const handleInvoiceDetails = async (InvoiceId, products, productFromClient) => {
  const invoiceDetails = []

  for (const item of productFromClient) {
    const product = products.find(
      product => product.ProductId === item.ProductId
    )

    const existInvoiceDetail = await saleModel.findInvoiceDetail(InvoiceId)

    let invoiceDetail

    if (!existInvoiceDetail) {
      invoiceDetail = await saleModel.createInvoiceDetail({
        InvoiceId,
        ProductId: item.ProductId,
        Quantity: Number(item.Quantity),
        Price: Number(product.Price)
      })
    } else {
      const newQuantity = Number(existInvoiceDetail.Quantity) + Number(item.Quantity)

      invoiceDetail = await saleModel.updateInvoiceDetail({
        InvoiceId,
        ProductId: item.ProductId,
        Quantity: newQuantity,
        Price: Number(product.Price)
      })
    }

    invoiceDetails.push(invoiceDetail)
  }
  return invoiceDetails

}

const handleInventories = async(products, productFromClient) => {
  const updatedInventories = []

  for (const item of productFromClient) {
    const product = products.find(
      product => product.ProductId === item.ProductId
    )

    const inventory = await saleModel.findInventoryById(product.InventoryId)
    const newStockQuantity = Number(inventory.StockQuantity) - Number(item.Quantity)

    const updatedInventory = await saleModel.updateInventory({
      InventoryId: product.InventoryId,
      StockQuantity: newStockQuantity
    })

    updatedInventories.push(updatedInventory)
  }
  return updatedInventories
}

const getTableDetail = async (TableId) => {
  try {
    const getTableDetail = await saleModel.getTableDetail(TableId)
    return getTableDetail
  } catch (error) { throw error }
}

const getPaymentInfo = async (TableId) => {
  try {
    const paymentInfo = await saleModel.getPaymentInfo(TableId)
    return paymentInfo
  } catch (error) { throw error }
}

const payment = async (TableId, EmployeeId) => {
  try {
    // 1. tìm InvoiceId và BookingId
    const findId = await saleModel.findOneByInvoiceIdAndBookingId(TableId)
    // 2. cập nhập lại status của hóa đơn
    const updatedStatusInvoice = await saleModel.updatedStatusInvoice({
      InvoiceId: findId.InvoiceId,
      InvoiceStatus: 2
    })

    // 3. cập nhập lại status của chón món
    const updatedStatusOrderProducts = await saleModel.updatedStatusOrderProducts(TableId)
    // 4. cập nhập lại status của đặt bàn
    const updatedStatusBooking = await saleModel.updatedStatusBooking(findId.BookingId)
    // 5. cập nhập lại status của bàn
    const updateStatusTable = await saleModel.updateTableStatus({ TableId, TableStatus: 1 })
    //return findId
    const createIncome = await saleModel.createIncome({
      EmployeeId,
      InvoiceId: findId.InvoiceId,
      IncomeDate: new Date(),
      TotalPrice: findId.TotalPrice,
      Description: `Thanh toán hóa đơn ${findId.InvoiceId}`
    })
    return {
      updatedStatusInvoice,
      updatedStatusOrderProducts,
      updatedStatusBooking,
      updateStatusTable,
      createIncome
    }
  } catch (error) {throw error }
}

const tranferTables = async (reqBody) => {
  const { oldTableId, newTableId } = reqBody

  if (oldTableId === newTableId ) {
    throw new ApiError(StatusCodes.CONFLICT, 'Cannot transfer to the same table.')
  }


  const findOldTable = await saleModel.findStatusTableById(oldTableId)
  const findNewTable = await saleModel.findStatusTableById(newTableId)

  if (!findOldTable) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Current table not found.')
  }

  if (!findNewTable) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Destination table not found')
  }

  if (![2, 3].includes(findOldTable.TableStatus)) {
    throw new ApiError(StatusCodes.CONFLICT, 'The current table cannot be transferred.')
  }

  if (findNewTable.TableStatus !== 1) {
    throw new ApiError(StatusCodes.CONFLICT, 'The destination table is not available.')
  }


  let updatedOldTabel
  let updatedNewTable
  let updatedBooking
  let updatedOrderProducts
  let updatedInvoice


  if (findOldTable.TableStatus === 3) {

    updatedOldTabel = await saleModel.updateTableStatus({
      TableId: oldTableId,
      TableStatus: 1
    })
    updatedNewTable = await saleModel.updateTableStatus({
      TableId: newTableId,
      TableStatus: 3
    })

    updatedBooking = await saleModel.transferBooking(
      oldTableId,
      newTableId
    )

  } else if (findOldTable.TableStatus === 2) {

    updatedOldTabel = await saleModel.updateTableStatus({
      TableId: oldTableId,
      TableStatus: 1
    })
    updatedNewTable = await saleModel.updateTableStatus({
      TableId: newTableId,
      TableStatus: 2
    })


    updatedOrderProducts = await saleModel.transferOrderProducts(
      oldTableId,
      newTableId
    )

    updatedInvoice = await saleModel.transferInvoice(
      oldTableId,
      newTableId
    )
    updatedBooking = await saleModel.transferBooking(
      oldTableId,
      newTableId
    )
  }

  return { updatedOldTabel, updatedNewTable, updatedBooking, updatedOrderProducts, updatedInvoice }
}

const getInfoSplitTable = async (TableId) => {
  try {
    const product = await saleModel.getInfoSplitTable(TableId)

    if (!product.length) {
      return { PeopleCount: 0, products: [] }
    }

    const PeopleCount = product[0].PeopleCount

    const products = product.map(item => ({
      ProductId: item.ProductId,
      ProductName: item.ProductName,
      Price: item.Price,
      Quantity: item.Quantity
    }))

    return { PeopleCount, products }
  } catch (error) { throw error }
}

const splitTable = async (reqBody) => {
  const { oldTableId, newTableId, PeopleCount, products } = reqBody

  if (oldTableId === newTableId ) {
    throw new ApiError(StatusCodes.CONFLICT, 'Cannot split to the same table.')
  }

  // 1. Thực hiện Thêm mời orderProducts
  const createOrderProduct = await createSplitProducts(newTableId, products)
  // 2. update lại table orderProducts
  const updateOrderProducr = await updateSplitProducts(oldTableId, products)

  // 3. Tìm customerId
  const findOneByBooking = await saleModel.findOneByBookingId(oldTableId)

  if (!findOneByBooking) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Current booking not found.')
  }

  // 4. Thêm vào table Booking

  const createdBooking = await createSplitBooking(newTableId, PeopleCount, findOneByBooking.CustomerId, findOneByBooking.BookingTime)
  // 5. update lại table Booking
  const updatedBookingOld = await updateSplitBooking(oldTableId, PeopleCount)

  // 6. lấy hóa đơn
  const findOneByInvoice = await saleModel.findOneByInvoice(oldTableId)
  if (!findOneByInvoice) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Current invoice not found.')
  }

  // 7. Lấy thông tin sản phâm của table mới
  const getInfoProduct = await saleModel.getPaymentInfo(newTableId)


  // 8. Tính tổng tiền hóa đơn sau khi tách bàn ra

  const totalPrice = totalPriceInvoice(getInfoProduct, products)
  // 9. Create Table Invoices

  const createdInvoices = createSplitInvoices(findOneByInvoice.EmployeeId, newTableId, findOneByInvoice.CustomerId, totalPrice)

  // 10. update lại table Invoices
  const updatedInvoices = await saleModel.updateSplitInvoiceTotalPrice({
    TableId: oldTableId,
    TotalPrice: totalPrice
  })

  // 11. Tìm InvoiceId
  const findOneByNewInvoice = await saleModel.findOneByInvoice(newTableId)

  // 12. Create InvoiceDetail mới
  const createdInvoiceDetail = await createSplitInvoiceDetail(findOneByNewInvoice.InvoiceId, getInfoProduct )

  // 13. Cập nhật invoiceDetail
  const updatedinvoiceDetail = await updateSplitInvoiceDetail(findOneByInvoice.InvoiceId, products)

  // 14. cập nhập Status Table
  const updatedStatusTable = await saleModel.updateTableStatus({
    TableId: newTableId,
    TableStatus: 2
  })

  return {
    createOrderProduct,
    updateOrderProducr,
    createdBooking,
    updatedBookingOld,
    createdInvoices,
    updatedInvoices,
    createdInvoiceDetail,
    updatedinvoiceDetail,
    updatedStatusTable,
    oldTableId,
    newTableId
  }
}

const createSplitProducts = async (newTableId, products) => {

  for (const product of products) {
    await saleModel.createSplitOrderProduct({
      TableId: newTableId,
      ProductId: product.ProductId,
      Quantity: product.Quantity,
      Status: 1
    })
  }

}

const updateSplitProducts = async (oldTableId, products) => {

  const updatedOrderProducts = []

  for (const product of products) {
    const updatedOrderProduct =
      await saleModel.updateSplitOrderProduct({
        TableId: oldTableId,
        ProductId: product.ProductId,
        Quantity: product.Quantity
      })

    if (!updatedOrderProduct) {
      throw new Error( `Món ${product.ProductId} không tồn tại hoặc số lượng tách không hợp lệ` )
    }

    updatedOrderProducts.push(updatedOrderProduct)
  }

  return updatedOrderProducts
}

const createSplitBooking = async ( newTableId, splitPeopleCount, customerId, BookingTime) => {

  const createdBooking = await saleModel.createSplitBooking({
    CustomerId: customerId,
    TableId: newTableId,
    BookingTime: BookingTime,
    PeopleCount: splitPeopleCount,
    Status: 1
  })

  return createdBooking
}

const updateSplitBooking = async (oldTableId, splitPeopleCount) => {
  const updatedBooking = await saleModel.updateSplitBookingPeopleCount({
    TableId: oldTableId,
    PeopleCount: splitPeopleCount
  })
  return updatedBooking
}

const createSplitInvoices = async (EmployeeId, newTableId, CustomerId, TotalPrice) => {
  const createdInvoices = await saleModel.createInvoice({
    EmployeeId: EmployeeId,
    TableId: newTableId,
    CustomerId: CustomerId,
    PromotionId: null,
    TotalPrice: TotalPrice,
    InvoiceStatus: 1
  })
  return createdInvoices
}

const createSplitInvoiceDetail = async (InvoiceId, getInfoProduct) => {
  const createdInvoiceDetails = []
  for (const product of getInfoProduct ) {
    const createdInvoiceDetail = await saleModel.createInvoiceDetail({
      InvoiceId: InvoiceId,
      ProductId: product.ProductId,
      Quantity: product.Quantity,
      Price: product.Price
    })
    createdInvoiceDetails.push(createdInvoiceDetail)
  }

  return createdInvoiceDetails

}

const updateSplitInvoiceDetail = async (oldInvoiceId, products) => {
  for (const product of products) {
    const updatedInvoiceDetail = await saleModel.updateSplitInvoiceDetail({
      InvoiceId: oldInvoiceId,
      ProductId: product.ProductId,
      Quantity: product.Quantity
    })
    if (updatedInvoiceDetail.Quantity === 0) {
      await saleModel.deleteInvoiceDetail({
        InvoiceId: oldInvoiceId,
        ProductId: product.ProductId
      })
    }
  }
}

const cancelTable = async (TableId) => {
  try {

    const bookingId = await saleModel.findOneByBookingId(TableId)
    const updatedBooking = await saleModel.updatedStatusBooking(bookingId.BookingId)
    const updatedStatusTable = await saleModel.updateTableStatus({
      TableId: TableId,
      TableStatus: 1
    })

    return { updatedBooking, updatedStatusTable }
  } catch (error) { throw error }
}

const mergeTable = async (reqBody) => {
  try {

    const { mergeTableIds, targetTableId } = reqBody
    // B1. Merge Table Booking
    const mergeBooking = await mergeBookings(mergeTableIds, targetTableId)

    // B2. Merge Table OrderProducts
    const mergeOrderProduct = await mergeOrderProducts(mergeTableIds, targetTableId)

    // B3. Merge Table Invoice
    const mergeInvoice = await mergeInvoices(mergeTableIds, targetTableId)
    // B4. Merge Table InvoiceDetail
    const mergeInvoiceDetail = await mergeinvoiceDetails(mergeInvoice)

    // B5. updated lại Status Table CafeTables

    const updatedStatusTables = []
    for (const TableId of mergeTableIds) {
      const updateStatusTable = await saleModel.updateTableStatus({
        TableId: TableId,
        TableStatus: 1
      })
      updatedStatusTables.push(updateStatusTable)
    }

    return { mergeBooking, mergeOrderProduct, mergeInvoice, mergeInvoiceDetail, updatedStatusTables }


  } catch (error) { throw error }
}

const mergeBookings = async ( mergeTableIds, targetTableId) => {

  const targetBookingTableId = await saleModel.findOneByBookingId(targetTableId)

  const mergeBookings = []

  for (const tableId of mergeTableIds) {
    const booking = await saleModel.findOneByBookingId(tableId)
    mergeBookings.push(booking)
  }

  let totalPeopleCount = targetBookingTableId.PeopleCount

  for (const booking of mergeBookings) {
    totalPeopleCount += booking.PeopleCount
  }

  const updatedBookingPeople = await saleModel.updateMergeBookingPeopleCount({
    TableId: targetTableId,
    PeopleCount: totalPeopleCount
  })

  let updatedStatusBooking
  for (const booking of mergeBookings) {
    await saleModel.updatedStatusBooking( booking.BookingId)
  }
  return { updatedBookingPeople, updatedStatusBooking }
}


const mergeOrderProducts = async (mergeTableIds, targetTableId) => {

  const updatedOrderProducts = []
  for (const mergeTableId of mergeTableIds) {
    const orderProducts = await saleModel.findOrderProduct(mergeTableId)

    for (const product of orderProducts) {
      const targetProduct = await saleModel.findOrderProductIdAndProductId(
        targetTableId,
        product.ProductId
      )

      let updatedOrderProduct
      if (!targetProduct) {
        updatedOrderProduct = await saleModel.updateOrderProductTableId({
          OrderProductId: product.OrderProductId,
          TableId: targetTableId
        })
      } else {
        updatedOrderProduct = await saleModel.updateOrderProductQuantity({
          OrderProductId: targetProduct.OrderProductId,
          Quantity: Number(targetProduct.Quantity) + Number(product.Quantity)
        })

        await saleModel.deleteOrderProduct(product.OrderProductId )
      }
      updatedOrderProducts.push(updatedOrderProduct)
    }
  }
  return updatedOrderProducts
}

const mergeInvoices = async (mergeTableIds, targetTableId) => {

  const tagerInvoiceTableId = await saleModel.findOneByInvoice(targetTableId)

  const invoicesTableIdToMerges = []
  for (const mergeTableId of mergeTableIds) {
    const invoicesTableIdToMerge = await saleModel.findOneByInvoice(mergeTableId)
    invoicesTableIdToMerges.push(invoicesTableIdToMerge)
  }

  let totalPrice = tagerInvoiceTableId.TotalPrice

  for (const invoice of invoicesTableIdToMerges) {
    totalPrice += invoice.TotalPrice
  }

  const updatedtotalPrice = await saleModel.updateInvoice({
    InvoiceId: tagerInvoiceTableId.InvoiceId,
    TotalPrice: totalPrice
  })

  const updatedStatusInvoices = []
  for (const invoice of invoicesTableIdToMerges ) {
    const updatedStatusInvoice = await saleModel.updatedStatusInvoice({
      InvoiceId: invoice.InvoiceId,
      InvoiceStatus: 3
    })
    updatedStatusInvoices.push(updatedStatusInvoice)
  }

  return { updatedtotalPrice, updatedStatusInvoices, tagerInvoiceTableId, invoicesTableIdToMerges }
}

const mergeinvoiceDetails = async (mergeInvoice) => {

  const { tagerInvoiceTableId, invoicesTableIdToMerges } = mergeInvoice

  const updatedInvoiceDetails = []

  for (const invoice of invoicesTableIdToMerges) {
    const invoiceDetail = await saleModel.findInvoiceDetail(invoice.InvoiceId)

    for (const detail of invoiceDetail) {
      const targetDetail = await saleModel.findInvoiceAndProductId(tagerInvoiceTableId.InvoiceId, detail.ProductId)

      let updatedInvoiceDetail
      if ( !targetDetail ) {
        updatedInvoiceDetail = await saleModel.createInvoiceDetail({
          InvoiceId: tagerInvoiceTableId.InvoiceId,
          ProductId: detail.ProductId,
          Quantity: detail.Quantity,
          Price: detail.Price
        })
      } else {
        const newQuantity = Number(targetDetail.Quantity) + Number(detail.Quantity)
        updatedInvoiceDetail = await saleModel.updateInvoiceDetail({
          InvoiceId: tagerInvoiceTableId.InvoiceId,
          ProductId: detail.ProductId,
          Quantity:  newQuantity,
          Price: detail.Price
        })
      }
      updatedInvoiceDetails.push(updatedInvoiceDetail)
    }
    await saleModel.deleteInvoiceDetailsByInvoiceId(invoice.InvoiceId)
  }

  return updatedInvoiceDetails
}

export const saleService = {
  getAllTable,
  bookingTable,
  getAllProduct,
  createOrder,
  getTableDetail,
  getPaymentInfo,
  payment,
  tranferTables,
  getInfoSplitTable,
  splitTable,
  cancelTable,
  mergeTable
}