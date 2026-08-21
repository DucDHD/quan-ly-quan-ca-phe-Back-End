import { saleModel } from '~/models/saleModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { TABLE_STATUS, BOOKING_STATUS } from '~/utils/status'

const getAllTable = async () => {
  try {
    const getTable = await saleModel.getAllTable()
    return getTable
  } catch (error) { throw error }
}

// const bookingTable = async (reqBody) => {
//   try {

//     const now = new Date()
//     const bookingTime = new Date(reqBody.BookingTime)

//     now.setSeconds(0, 0)
//     bookingTime.setSeconds(0, 0)

//     if (bookingTime < now) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'Thời gian đặt bàn không được nhỏ hơn thời gian hiện tại.')
//     }

//     const table = await saleModel.findStatusTableById(reqBody.TableId)

//     if (!table) {
//       throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bàn.')
//     }

//     if (table.TableStatus === 2) {
//       const currentBooking = await saleModel.findCurrentBooking(reqBody.TableId)

//       if (currentBooking) {
//         const currentEndTime = new Date(currentBooking.BookingTime)
//         currentEndTime.setHours(currentEndTime.getHours() + 2)

//         if (bookingTime < currentEndTime) {
//           throw new ApiError(StatusCodes.CONFLICT, 'Bàn đang được sử dụng trong khung giờ này.' )
//         }
//       }

//     }

//     const existBooking = await saleModel.findBookingConflict(reqBody.TableId, reqBody.BookingTime)

//     if (existBooking) {
//       throw new ApiError(StatusCodes.CONFLICT, 'Bàn đã có khách sử dụng trong khung giờ này.')
//     }


//     let createdNewCustomer = null

//     const existCustomer = await saleModel.findOneByCustomer(reqBody)
//     if (!existCustomer) {
//       createdNewCustomer = await saleModel.createdNewCustomer(reqBody)
//     }

//     const bookingData = {
//       ...reqBody,
//       CustomerId: existCustomer ? existCustomer.CustomerId : createdNewCustomer.CustomerId,
//       Status:1
//     }

//     const bookingTable = await saleModel.createNewBooking(bookingData)

//     const isBookingNow = bookingTime.getTime() === now.getTime()

//     let updateStatusTable = null

//     if (isBookingNow && table.TableStatus !== 2) {
//       updateStatusTable = await saleModel.updateTableStatus({
//         TableId: reqBody.TableId,
//         TableStatus: 2
//       })
//     }
//     return { createdNewCustomer, bookingTable, updateStatusTable }
//   } catch (error) { throw error }
// }

const bookingTable = async reqBody => {
  try {
    // B1. Lấy thời gian hiện tại và thời gian khách đặt
    const now = new Date()
    const bookingTime = new Date(reqBody.BookingTime)

    now.setSeconds(0, 0)
    bookingTime.setSeconds(0, 0)

    // B2. Không cho đặt thời gian trong quá khứ
    if (bookingTime < now) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Thời gian đặt bàn không được nhỏ hơn thời gian hiện tại.')
    }

    // B3. Kiểm tra bàn tồn tại
    const table = await saleModel.findStatusTableById(reqBody.TableId)

    if (!table) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bàn.')
    }

    // B4. Kiểm tra có phải khách đặt ngay thời điểm hiện tại không
    const isBookingNow = bookingTime.getTime() - now.getTime() <= 60 * 60 * 1000

    const existBooking = await saleModel.findBookingConflict(reqBody.TableId, reqBody.BookingTime)

    if (existBooking) {
      throw new ApiError(StatusCodes.CONFLICT, 'Bàn đã có khách đặt trong khung giờ này.')
    }


    let createdNewCustomer = null

    const existCustomer = await saleModel.findOneByCustomer(reqBody)

    // Nếu khách chưa tồn tại thì tạo mới
    if (!existCustomer) {
      createdNewCustomer = await saleModel.createdNewCustomer(reqBody)
    }

    // B8. Chuẩn bị dữ liệu booking
    const bookingData = {
      ...reqBody,
      CustomerId: existCustomer ? existCustomer.CustomerId : createdNewCustomer.CustomerId,
      Status: 1
    }

    // B9. Tạo booking
    const bookingTable = await saleModel.createNewBooking(bookingData)

    let updateStatusTable = null

    // B10. Nếu khách đặt đúng thời gian hiện tại thì coi như khách đang sử dụng bàn

    if (isBookingNow) {
      updateStatusTable = await saleModel.updateTableStatus({
        TableId: reqBody.TableId,
        TableStatus: 3
      })
    }

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
    const booking = await saleModel.findCurrentBookingByTableId(reqBody.TableId)

    if (!booking) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin đặt bàn.')
    }

    // 5. Insert hoặc update OrderProducts

    const orderProducts = await handleOrderProducts(reqBody.TableId, reqBody.Products)

    // 6. Tạo hoặc cập nhật hóa đơn

    const { invoice, updateStatusTable } = await handleInvoice(reqBody.TableId, totalPrice, EmployeeId, booking.CustomerId)

    let updatedStatusBooking = null
    if (booking.Status === 1) {
      updatedStatusBooking = await saleModel.updateBookingStatus({
        BookingId: booking.BookingId,
        Status: 2
      })
    }
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
      updatedStatusBooking,
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
    const existOrderProduct = await saleModel.findOrderProductIdAndProductId( TableId, item.ProductId)
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

// const handleInvoice = async (TableId, totalPrice, EmployeeId, CustomerId ) => {
//   const existInvoice = await saleModel.findOneByInvoice(TableId)
//   let invoice
//   let updateStatusTable = null
//   const createData = {
//     EmployeeId,
//     TableId,
//     CustomerId,
//     PromotionId: null,
//     TotalPrice: totalPrice,
//     InvoiceStatus: 1
//   }
//   if (!existInvoice) {
//     invoice = await saleModel.createInvoice(createData)
//     // Cập nhật trạng thái bàn
//     updateStatusTable = await saleModel.updateTableStatus({ TableId, TableStatus: 2 })
//   } else {
//     const newTotalPrice = Number(existInvoice.TotalPrice) + Number(totalPrice)
//     const updateData = {
//       InvoiceId: existInvoice.InvoiceId,
//       TotalPrice: newTotalPrice
//     }

//     invoice = await saleModel.updateInvoice(updateData)
//   }
//   return { invoice, updateStatusTable }
// }

const handleInvoice = async (TableId, totalPrice, EmployeeId, CustomerId) => {
  const existInvoice = await saleModel.findOneByInvoice(TableId, CustomerId)

  let invoice
  let updateStatusTable = null

  const createData = {
    EmployeeId,
    TableId,
    CustomerId,
    PromotionId: null,
    TotalPrice: totalPrice,
    InvoiceStatus: 1
  }

  if (!existInvoice) {
    invoice = await saleModel.createInvoice(createData)

    updateStatusTable = await saleModel.updateTableStatus({
      TableId,
      TableStatus: 2
    })
  } else {
    const newTotalPrice = Number(existInvoice.TotalPrice) + Number(totalPrice)

    invoice = await saleModel.updateInvoice({
      InvoiceId: existInvoice.InvoiceId,
      TotalPrice: newTotalPrice
    })
  }

  return { invoice, updateStatusTable }
}

const handleInvoiceDetails = async (InvoiceId, products, productFromClient) => {
  const invoiceDetails = []

  for (const item of productFromClient) {
    const product = products.find(
      product => product.ProductId === item.ProductId
    )

    const existInvoiceDetail = await saleModel.findInvoiceDetail(InvoiceId, item.ProductId)

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

const getTableDetail = async TableId => {
  try {
    const bookings = await saleModel.getCustomerBookingsByTableId(TableId)
    const products = await saleModel.findProductsByTableId(TableId)

    return { bookings, products }
  } catch (error) { throw error }
}
// const getPaymentInfo = async (TableId) => {
//   try {
//     const paymentInfo = await saleModel.getPaymentInfo(TableId)
//     return paymentInfo
//   } catch (error) { throw error }
// }

const getPaymentInfo = async TableId => {
  try {
    const customer = await saleModel.findCurrentCustomerByTableId(TableId)
    const products = await saleModel.findProductsByTableId(TableId)

    return {
      customer: customer || null,
      products: products || []
    }
  } catch (error) { throw error }
}


// const payment = async (TableId, EmployeeId) => {
//   try {
//     // 1. Tìm đúng Booking và Invoice của khách đang sử dụng bàn
//     const findId = await saleModel.findOneByInvoiceIdAndBookingId(TableId)

//     if (!findId) {
//       throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin thanh toán.')
//     }

//     // 2. Hoàn thành hóa đơn
//     const updatedStatusInvoice = await saleModel.updatedStatusInvoice({
//       InvoiceId: findId.InvoiceId,
//       InvoiceStatus: 2
//     })

//     // 3. Hoàn thành các món hiện tại của bàn
//     const updatedStatusOrderProducts = await saleModel.updatedStatusOrderProducts(TableId)

//     // 4. Hoàn thành đúng booking của khách hiện tại
//     const updatedStatusBooking = await saleModel.updatedStatusBooking({
//       BookingId: findId.BookingId,
//       Status: 3
//     })

//     const nextBooking = await saleModel.findNextBookingByTableId(TableId)

//     // 5. Trả bàn về trạng thái trống
//     const updateStatusTable = await saleModel.updateTableStatus({
//       TableId,
//       TableStatus: nextBooking ? 3 : 1
//     })

//     // 6. Ghi nhận doanh thu
//     const createIncome = await saleModel.createIncome({
//       EmployeeId,
//       InvoiceId: findId.InvoiceId,
//       IncomeDate: new Date(),
//       TotalPrice: findId.TotalPrice,
//       Description: `Thanh toán hóa đơn ${findId.InvoiceId}`
//     })

//     return {
//       updatedStatusInvoice,
//       updatedStatusOrderProducts,
//       updatedStatusBooking,
//       updateStatusTable,
//       createIncome
//     }
//   } catch (error) { throw error }
// }

const payment = async (TableId, EmployeeId) => {
  try {
    // 1. Tìm đúng Booking và Invoice của khách đang sử dụng bàn
    const findId = await saleModel.findOneByInvoiceIdAndBookingId(TableId)

    if (!findId) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin thanh toán.')
    }

    // 2. Hoàn thành hóa đơn
    const updatedStatusInvoice = await saleModel.updatedStatusInvoice({
      InvoiceId: findId.InvoiceId,
      InvoiceStatus: 2
    })

    // 3. Hoàn thành các món hiện tại của bàn
    const updatedStatusOrderProducts = await saleModel.updatedStatusOrderProducts(TableId)

    // 4. Hoàn thành đúng booking của khách hiện tại
    const updatedStatusBooking = await saleModel.updatedStatusBooking({
      BookingId: findId.BookingId,
      Status: 3
    })

    // 5. Kiểm tra bàn còn khách hay không
    const countOrderedBooking = await saleModel.countBookingsByStatus(TableId, 2)
    const countReservedBooking = await saleModel.countBookingsByStatus(TableId, 1)

    let tableStatus

    if (countOrderedBooking > 0) {
      tableStatus = 2
    } else if (countReservedBooking > 0) {
      tableStatus = 3
    } else {
      tableStatus = 1
    }

    const updateStatusTable = await saleModel.updateTableStatus({
      TableId,
      TableStatus: tableStatus
    })

    // 6. Ghi nhận doanh thu
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
  } catch (error) { throw error }
}

const getCustomerBooking = async tableId => {
  try {
    const result = await saleModel.getCustomerBookingsByTableId(tableId)
    return result
  } catch (error) { throw error }
}

// const tranferTables = async (reqBody) => {
//   const { oldTableId, newTableId, bookingId } = reqBody

//   const bookingStatus = 1
//   const orderedStatus = 2


//   if (oldTableId === newTableId ) {
//     throw new ApiError(StatusCodes.CONFLICT, 'Không thể chuyển sang cùng một bàn.')
//   }


//   const findOldTable = await saleModel.findStatusTableById(oldTableId)
//   const findNewTable = await saleModel.findStatusTableById(newTableId)

//   const booking = await saleModel.findBookingById(bookingId)


//   if (!booking) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy khách hàng đang đặt bàn này.')
//   }

//   if (!findOldTable) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bàn hiện tại.')
//   }

//   if (!findNewTable) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bàn cần chuyển đến.')
//   }

//   if (![2, 3].includes(findOldTable.TableStatus)) {
//     throw new ApiError(StatusCodes.CONFLICT, 'Bàn hiện tại không thể thực hiện chuyển bàn.')
//   }

//   if (findNewTable.TableStatus !== 1) {
//     throw new ApiError(StatusCodes.CONFLICT, 'Bàn cần chuyển đến hiện không trống.')
//   }

//   let updatedOldTabel
//   let updatedNewTable
//   let updatedBooking
//   let updatedOrderProducts
//   let updatedInvoice


//   if (findOldTable.TableStatus === 3) {
//     updatedBooking = await saleModel.transferBooking(
//       booking.BookingId,
//       newTableId
//     )

//     const countOrderedBooking = await saleModel.countBookingsByStatus(oldTableId, orderedStatus)
//     const countReservedBooking = await saleModel.countBookingsByStatus(oldTableId, bookingStatus)

//     if (countOrderedBooking > 0) {
//       updatedOldTabel = await saleModel.updateTableStatus({
//         TableId: oldTableId,
//         TableStatus: 2
//       })
//     } else if (countReservedBooking > 0) {
//       updatedOldTabel = await saleModel.updateTableStatus({
//         TableId: oldTableId,
//         TableStatus: 3
//       })
//     } else {
//       updatedOldTabel = await saleModel.updateTableStatus({
//         TableId: oldTableId,
//         TableStatus: 1
//       })
//     }

//     updatedNewTable = await saleModel.updateTableStatus({
//       TableId: newTableId,
//       TableStatus: 3
//     })

//   } else if (findOldTable.TableStatus === 2) {
//     updatedOrderProducts = await saleModel.transferOrderProducts(
//       oldTableId,
//       newTableId
//     )

//     updatedInvoice = await saleModel.transferInvoice(
//       oldTableId,
//       newTableId
//     )

//     updatedBooking = await saleModel.transferBooking(
//       booking.BookingId,
//       newTableId
//     )

//     const countOrderedBooking = await saleModel.countBookingsByStatus(oldTableId, orderedStatus)
//     const countReservedBooking = await saleModel.countBookingsByStatus(oldTableId, bookingStatus)

//     if (countOrderedBooking > 0) {
//       updatedOldTabel = await saleModel.updateTableStatus({
//         TableId: oldTableId,
//         TableStatus: 2
//       })
//     } else if (countReservedBooking > 0) {
//       updatedOldTabel = await saleModel.updateTableStatus({
//         TableId: oldTableId,
//         TableStatus: 3
//       })
//     } else {
//       updatedOldTabel = await saleModel.updateTableStatus({
//         TableId: oldTableId,
//         TableStatus: 1
//       })
//     }

//     updatedNewTable = await saleModel.updateTableStatus({
//       TableId: newTableId,
//       TableStatus: 2
//     })
//   }

//   return { updatedOldTabel, updatedNewTable, updatedBooking, updatedOrderProducts, updatedInvoice }
// }

const tranferTables = async reqBody => {
  const { oldTableId, newTableId, bookingId } = reqBody

  const bookingStatus = 1
  const orderedStatus = 2

  if (oldTableId === newTableId) {
    throw new ApiError(StatusCodes.CONFLICT, 'Không thể chuyển sang cùng một bàn.')
  }

  const findOldTable = await saleModel.findStatusTableById(oldTableId)
  const findNewTable = await saleModel.findStatusTableById(newTableId)
  const booking = await saleModel.findBookingById(bookingId)

  if (!findOldTable) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bàn hiện tại.')
  }

  if (!findNewTable) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bàn cần chuyển đến.')
  }

  if (!booking) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin đặt bàn.')
  }

  if (booking.TableId !== oldTableId) {
    throw new ApiError(StatusCodes.CONFLICT, 'Thông tin đặt bàn không thuộc bàn hiện tại.')
  }

  if (![bookingStatus, orderedStatus].includes(booking.Status)) {
    throw new ApiError(StatusCodes.CONFLICT, 'Thông tin đặt bàn không thể thực hiện chuyển bàn.')
  }

  if (findNewTable.TableStatus !== 1) {
    throw new ApiError(StatusCodes.CONFLICT, 'Bàn cần chuyển đến hiện không trống.')
  }

  let updatedOldTabel
  let updatedNewTable
  let updatedBooking
  let updatedOrderProducts
  let updatedInvoice

  // Khách chưa chọn món
  if (booking.Status === bookingStatus) {
    updatedBooking = await saleModel.transferBooking(
      booking.BookingId,
      newTableId
    )

    updatedNewTable = await saleModel.updateTableStatus({
      TableId: newTableId,
      TableStatus: 3
    })
  }

  // Khách đã chọn món
  if (booking.Status === orderedStatus) {
    updatedOrderProducts = await saleModel.transferOrderProducts(
      oldTableId,
      newTableId
    )

    updatedInvoice = await saleModel.transferInvoice(
      oldTableId,
      newTableId
    )

    updatedBooking = await saleModel.transferBooking(
      booking.BookingId,
      newTableId
    )

    updatedNewTable = await saleModel.updateTableStatus({
      TableId: newTableId,
      TableStatus: 2
    })
  }

  // Sau khi chuyển xong mới kiểm tra lại bàn cũ
  const countOrderedBooking = await saleModel.countBookingsByStatus(oldTableId, orderedStatus)
  const countReservedBooking = await saleModel.countBookingsByStatus(oldTableId, bookingStatus)

  if (countOrderedBooking > 0) {
    updatedOldTabel = await saleModel.updateTableStatus({
      TableId: oldTableId,
      TableStatus: 2
    })
  } else if (countReservedBooking > 0) {
    updatedOldTabel = await saleModel.updateTableStatus({
      TableId: oldTableId,
      TableStatus: 3
    })
  } else {
    updatedOldTabel = await saleModel.updateTableStatus({
      TableId: oldTableId,
      TableStatus: 1
    })
  }

  return {
    updatedOldTabel,
    updatedNewTable,
    updatedBooking,
    updatedOrderProducts,
    updatedInvoice
  }
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
  const findOneByInvoice = await saleModel.findOneByInvoice(oldTableId, findOneByBooking.CustomerId)
  if (!findOneByInvoice) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hóa đơn hiện tại.')
  }

  // 7. Lấy thông tin sản phâm của table mới
  const getInfoProduct = await saleModel.getPaymentInfo(newTableId)


  // 8. Tính tổng tiền hóa đơn sau khi tách bàn ra

  const totalPrice = totalPriceInvoice(getInfoProduct, products)
  // 9. Create Table Invoices

  const createdInvoices = await createSplitInvoices(findOneByInvoice.EmployeeId, newTableId, findOneByInvoice.CustomerId, totalPrice)

  // 10. update lại table Invoices
  const updatedInvoices = await saleModel.updateSplitInvoiceTotalPrice({
    TableId: oldTableId,
    TotalPrice: totalPrice
  })

  // 11. Tìm InvoiceId
  const findOneByNewInvoice = await saleModel.findOneByInvoice(newTableId, findOneByInvoice.CustomerId)

  // 12. Create InvoiceDetail mới
  const createdInvoiceDetail = await createSplitInvoiceDetail(findOneByNewInvoice.InvoiceId, getInfoProduct )

  // 13. Cập nhật invoiceDetail
  const updatedinvoiceDetail = await updateSplitInvoiceDetail(findOneByInvoice.InvoiceId, products)

  // 14. Cập nhật trạng thái bàn cũ
  const updatedOldTable = await saleModel.updateTableStatus({
    TableId: oldTableId,
    TableStatus: TABLE_STATUS.OCCUPIED
  })

  // 15. Cập nhật trạng thái bàn mới
  const updatedNewTable = await saleModel.updateTableStatus({
    TableId: newTableId,
    TableStatus: TABLE_STATUS.OCCUPIED
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
    updatedOldTable,
    updatedNewTable,
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


const createSplitBooking = async (newTableId, splitPeopleCount, customerId, BookingTime) => {
  const createdBooking = await saleModel.createSplitBooking({
    CustomerId: customerId,
    TableId: newTableId,
    BookingTime,
    PeopleCount: splitPeopleCount,
    Status: BOOKING_STATUS.ORDERED
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

// const cancelTable = async (TableId) => {
//   try {

//     const bookingId = await saleModel.findOneByBookingId(TableId)
//     const updatedBooking = await saleModel.updatedStatusBooking(bookingId.BookingId)
//     const updatedStatusTable = await saleModel.updateTableStatus({
//       TableId: TableId,
//       TableStatus: 1
//     })

//     return { updatedBooking, updatedStatusTable }
//   } catch (error) { throw error }
// }

const cancelTable = async (reqBody) => {
  try {
    const { TableId, BookingId } = reqBody

    const bookingStatus = 1
    const orderedStatus = 2

    const booking = await saleModel.findBookingById(BookingId)

    if (!booking) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin đặt bàn.')
    }

    if (booking.TableId !== TableId) {
      throw new ApiError(StatusCodes.CONFLICT, 'Thông tin đặt bàn không thuộc bàn hiện tại.')
    }

    if (booking.Status !== bookingStatus) {
      throw new ApiError(StatusCodes.CONFLICT, 'Khách hàng đã chọn món, không thể hủy bàn.')
    }

    const updatedBooking = await saleModel.updatedStatusBooking({
      BookingId,
      Status: 4
    })

    const countOrderedBooking = await saleModel.countBookingsByStatus(TableId, orderedStatus)
    const countReservedBooking = await saleModel.countBookingsByStatus(TableId, bookingStatus)

    let updatedStatusTable

    if (countOrderedBooking > 0) {
      updatedStatusTable = await saleModel.updateTableStatus({
        TableId,
        TableStatus: 2
      })
    } else if (countReservedBooking > 0) {
      updatedStatusTable = await saleModel.updateTableStatus({
        TableId,
        TableStatus: 3
      })
    } else {
      updatedStatusTable = await saleModel.updateTableStatus({
        TableId,
        TableStatus: 1
      })
    }

    return { updatedBooking, updatedStatusTable }
  } catch (error) { throw error }
}

// const mergeTable = async (reqBody) => {
//   try {

//     const { mergeTableIds, targetTableId } = reqBody


//     // B1. Merge Table Booking
//     const mergeBooking = await mergeBookings(mergeTableIds, targetTableId)

//     // B2. Merge Table OrderProducts
//     const mergeOrderProduct = await mergeOrderProducts(mergeTableIds, targetTableId)

//     // B3. Merge Table Invoice
//     const mergeInvoice = await mergeInvoices(mergeTableIds, targetTableId)
//     // B4. Merge Table InvoiceDetail
//     const mergeInvoiceDetail = await mergeinvoiceDetails(mergeInvoice)

//     // B5. updated lại Status Table CafeTables

//     const updatedStatusTables = []
//     for (const TableId of mergeTableIds) {
//       const updateStatusTable = await saleModel.updateTableStatus({
//         TableId: TableId,
//         TableStatus: 1
//       })
//       updatedStatusTables.push(updateStatusTable)
//     }

//     return { mergeBooking, mergeOrderProduct, mergeInvoice, mergeInvoiceDetail, updatedStatusTables }


//   } catch (error) { throw error }
// }

// const mergeTable = async reqBody => {
//   try {
//     const { mergeTableIds, targetTableId } = reqBody

//     // B1. Gộp Booking
//     const mergeBooking = await mergeBookings(
//       mergeTableIds,
//       targetTableId
//     )

//     // B2. Gộp OrderProducts
//     const mergeOrderProduct = await mergeOrderProducts(
//       mergeTableIds,
//       targetTableId
//     )
//     // B3. Gộp Invoice
//     const mergeInvoice = await mergeInvoices(
//       mergeTableIds,
//       targetTableId
//     )

//     // B4. Gộp InvoiceDetails
//     const mergeInvoiceDetail = await mergeinvoiceDetails(
//       mergeInvoice
//     )

//     // B5. Các bàn nguồn sau khi gộp hết dữ liệu → bàn trống
//     const updatedStatusTables = []

//     for (const TableId of mergeTableIds) {
//       const updatedTable = await saleModel.updateTableStatus({
//         TableId,
//         TableStatus: TABLE_STATUS.AVAILABLE
//       })

//       updatedStatusTables.push(updatedTable)
//     }

//     // B6. Kiểm tra Booking còn lại ở bàn đích
//     const countOrderedBooking = await saleModel.countBookingsByStatus(
//       targetTableId,
//       BOOKING_STATUS.ORDERED
//     )

//     const countReservedBooking = await saleModel.countBookingsByStatus(
//       targetTableId,
//       BOOKING_STATUS.RESERVED
//     )

//     let updatedTargetTable

//     if (countOrderedBooking > 0) {
//       updatedTargetTable = await saleModel.updateTableStatus({
//         TableId: targetTableId,
//         TableStatus: TABLE_STATUS.OCCUPIED
//       })
//     } else if (countReservedBooking > 0) {
//       updatedTargetTable = await saleModel.updateTableStatus({
//         TableId: targetTableId,
//         TableStatus: TABLE_STATUS.RESERVED
//       })
//     } else {
//       updatedTargetTable = await saleModel.updateTableStatus({
//         TableId: targetTableId,
//         TableStatus: TABLE_STATUS.AVAILABLE
//       })
//     }

//     return {
//       mergeBooking,
//       mergeOrderProduct,
//       mergeInvoice,
//       mergeInvoiceDetail,
//       updatedStatusTables,
//       updatedTargetTable
//     }
//   } catch (error) { throw error }
// }

const mergeTable = async reqBody => {
  try {
    const { mergeTableIds, targetTableId } = reqBody

    // B1. Gộp Booking
    const mergeBooking = await mergeBookings(
      mergeTableIds,
      targetTableId
    )

    // B2. Gộp OrderProducts
    const mergeOrderProduct = await mergeOrderProducts(
      mergeTableIds,
      targetTableId
    )

    // B3. Gộp Invoice
    const mergeInvoice = await mergeInvoices(
      mergeTableIds,
      targetTableId
    )

    // B4. Các bàn nguồn sau khi gộp hết dữ liệu → bàn trống
    const updatedStatusTables = []

    // Cập nhật lại trạng thái từng bàn được đem đi gộp
    for (const TableId of mergeTableIds) {
      const countOrderedBooking = await saleModel.countBookingsByStatus(
        TableId,
        BOOKING_STATUS.ORDERED
      )

      const countReservedBooking = await saleModel.countBookingsByStatus(
        TableId,
        BOOKING_STATUS.RESERVED
      )

      let tableStatus = TABLE_STATUS.AVAILABLE

      if (countOrderedBooking > 0) {
        tableStatus = TABLE_STATUS.OCCUPIED
      } else if (countReservedBooking > 0) {
        tableStatus = TABLE_STATUS.RESERVED
      }

      const updatedTable = await saleModel.updateTableStatus({
        TableId,
        TableStatus: tableStatus
      })

      updatedStatusTables.push(updatedTable)
    }


    // Cập nhật lại trạng thái bàn đích
    const countOrderedBooking = await saleModel.countBookingsByStatus(
      targetTableId,
      BOOKING_STATUS.ORDERED
    )

    const countReservedBooking = await saleModel.countBookingsByStatus(
      targetTableId,
      BOOKING_STATUS.RESERVED
    )

    let targetTableStatus = TABLE_STATUS.AVAILABLE

    if (countOrderedBooking > 0) {
      targetTableStatus = TABLE_STATUS.OCCUPIED
    } else if (countReservedBooking > 0) {
      targetTableStatus = TABLE_STATUS.RESERVED
    }

    const updatedTargetTable = await saleModel.updateTableStatus({
      TableId: targetTableId,
      TableStatus: targetTableStatus
    })

    return {
      mergeBooking,
      mergeOrderProduct,
      mergeInvoice,
      updatedStatusTables,
      updatedTargetTable
    }
  } catch (error) { throw error }
}

// const mergeBookings = async ( mergeTableIds, targetTableId) => {

//   const targetBookingTableId = await saleModel.findOneByBookingId(targetTableId)

//   const mergeBookings = []

//   for (const tableId of mergeTableIds) {
//     const booking = await saleModel.findOneByBookingId(tableId)
//     mergeBookings.push(booking)
//   }

//   let totalPeopleCount = targetBookingTableId.PeopleCount

//   for (const booking of mergeBookings) {
//     totalPeopleCount += booking.PeopleCount
//   }

//   const updatedBookingPeople = await saleModel.updateMergeBookingPeopleCount({
//     TableId: targetTableId,
//     PeopleCount: totalPeopleCount
//   })

//   let updatedStatusBooking
//   for (const booking of mergeBookings) {
//     await saleModel.updatedStatusBooking( booking.BookingId)
//   }
//   return { updatedBookingPeople, updatedStatusBooking }
// }

const mergeBookings = async (mergeTableIds, targetTableId) => {
  const targetBookings = await saleModel.findOrderedBookingsByTableId(targetTableId)

  if (!targetBookings || targetBookings.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy booking đang sử dụng của bàn đích.')
  }

  const targetBooking = targetBookings[0]
  let totalPeopleCount = Number(targetBooking.PeopleCount)

  const sourceBookings = []

  for (const tableId of mergeTableIds) {
    const bookings = await saleModel.findOrderedBookingsByTableId(tableId)

    for (const booking of bookings) {
      totalPeopleCount += Number(booking.PeopleCount)
      sourceBookings.push(booking)
    }
  }

  // Cộng số người vào Booking bàn đích
  const updatedBookingPeople = await saleModel.updateMergeBookingPeopleCount({
    BookingId: targetBooking.BookingId,
    PeopleCount: totalPeopleCount
  })

  // Booking của các bàn nguồn → hoàn thành
  const updatedStatusBookings = []

  for (const booking of sourceBookings) {
    const updatedBooking = await saleModel.updatedStatusBooking({
      BookingId: booking.BookingId,
      Status: BOOKING_STATUS.PAID
    })

    updatedStatusBookings.push(updatedBooking)
  }

  return { updatedBookingPeople, updatedStatusBookings }
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

// const mergeInvoices = async (mergeTableIds, targetTableId) => {

//   const tagerInvoiceTableId = await saleModel.findOneByInvoice(targetTableId)

//   const invoicesTableIdToMerges = []
//   for (const mergeTableId of mergeTableIds) {
//     const invoicesTableIdToMerge = await saleModel.findOneByInvoice(mergeTableId)
//     invoicesTableIdToMerges.push(invoicesTableIdToMerge)
//   }

//   let totalPrice = tagerInvoiceTableId.TotalPrice

//   for (const invoice of invoicesTableIdToMerges) {
//     totalPrice += invoice.TotalPrice
//   }

//   const updatedtotalPrice = await saleModel.updateInvoice({
//     InvoiceId: tagerInvoiceTableId.InvoiceId,
//     TotalPrice: totalPrice
//   })

//   const updatedStatusInvoices = []
//   for (const invoice of invoicesTableIdToMerges ) {
//     const updatedStatusInvoice = await saleModel.updatedStatusInvoice({
//       InvoiceId: invoice.InvoiceId,
//       InvoiceStatus: 3
//     })
//     updatedStatusInvoices.push(updatedStatusInvoice)
//   }

//   return { updatedtotalPrice, updatedStatusInvoices, tagerInvoiceTableId, invoicesTableIdToMerges }
// }

const mergeInvoices = async (mergeTableIds, targetTableId) => {
  const mergedInvoices = []

  for (const tableId of mergeTableIds) {
    const invoices = await saleModel.findActiveInvoicesByTableId(tableId)

    for (const invoice of invoices) {
      const updatedInvoice = await saleModel.updateInvoiceTableId(invoice.InvoiceId, targetTableId)
      mergedInvoices.push(updatedInvoice)
    }
  }

  return mergedInvoices
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
  mergeTable,
  getCustomerBooking
}