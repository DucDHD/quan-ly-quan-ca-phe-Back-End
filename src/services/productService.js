import { productModel } from '~/models/productModel'

const getAllProducts = async (sortBy = 'ProductId', order = 'asc', search = '', page = 1, limit = 5) => {
  try {
    const status = 1
    const allowedSortFields = ['ProductId', 'ProductName', 'Price']

    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'ProductId'

    const validOrder = order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

    const validSearch = typeof search === 'string' ? search.trim() : ''

    const parsedPage = Number.parseInt(page, 10)
    const parsedLimit = Number.parseInt(limit, 10)

    const validPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

    const validLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 5

    const offset = (validPage - 1) * validLimit

    const getProducts = await productModel.getAllProducts({
      sortBy: validSortBy,
      order: validOrder,
      search: validSearch,
      offset,
      limit: validLimit,
      status
    })

    const totalRows = await productModel.countAllProducts({
      search: validSearch,
      status
    })

    const totalPages = Math.ceil(totalRows / validLimit)

    return {
      getProducts,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalRows,
        totalPages
      }
    }
  } catch (error) { throw error }
}

const getAvailableProducts = async () => {
  try {
    const status = 1
    const getAvailableProducts = await productModel.getAvailableProducts(status)
    return getAvailableProducts
  } catch (error) { throw error }
}

const createProduct = async (data) => {
  try {
    const { InventoryId, Price } = data

    if (!InventoryId) {
      throw new Error('Vui lòng chọn sản phẩm')
    }

    if (!Price || Number(Price) <= 0) {
      throw new Error('Giá bán phải lớn hơn 0')
    }

    const findInventory = await productModel.findInventoryById(InventoryId)

    if (!findInventory) {
      throw new Error('Không tìm thấy sản phẩm trong kho')
    }

    const findProduct = await productModel.findProductByInventoryId(InventoryId)

    if (findProduct?.Status === 0) {
      const updateProduct = await productModel.updateProductStatus(
        findProduct.ProductId,
        Price
      )

      return updateProduct
    }

    const createProduct = await productModel.createProduct(
      findInventory.CategoryName,
      Price,
      InventoryId
    )

    return createProduct
  } catch (error) { throw error }
}

const deleteProduct = async (ProductId) => {
  try {

    const deleteProduct = await productModel.deleteProduct(ProductId)

    return deleteProduct
  } catch (error) { throw error }
}

export const productService = {
  getAllProducts,
  getAvailableProducts,
  createProduct,
  deleteProduct
}