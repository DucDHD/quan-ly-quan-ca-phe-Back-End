import { saleModel } from '~/models/saleModel'

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

    const existInvoiceDetail = await saleModel.findInvoiceDetail(
      InvoiceId,
      item.ProductId
    )

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

const payment = async (TableId) => {
  try {
    // 1. tìm InvoiceId và BookingId
    const findId = await saleModel.findOneByInvoiceIdAndBookingId(TableId)

    // 2. cập nhập lại status của hóa đơn
    const updatedStatusInvoice = await saleModel.updatedStatusInvoice(findId.InvoiceId)

    // 3. cập nhập lại status của chón món
    const updatedStatusOrderProducts = await saleModel.updatedStatusOrderProducts(TableId)
    // 4. cập nhập lại status của đặt bàn
    const updatedStatusBooking = await saleModel.updatedStatusBooking(findId.BookingId)
    // 5. cập nhập lại status của bàn
    const updateStatusTable = await saleModel.updateTableStatus({ TableId, TableStatus: 1 })
    //return findId

    return {
      updatedStatusInvoice,
      updatedStatusOrderProducts,
      updatedStatusBooking,
      updateStatusTable
    }
  } catch (error) {throw error }
}


export const saleService = {
  getAllTable,
  bookingTable,
  getAllProduct,
  createOrder,
  getTableDetail,
  getPaymentInfo,
  payment
}