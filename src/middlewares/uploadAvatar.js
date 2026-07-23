import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDirectory = path.resolve('src/assets/uploads')

// Nếu thư mục chưa tồn tại thì tự động tạo
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory)
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname)

    const fileName = `avatar-${Date.now()}-${Math.round(
      Math.random() * 1E9
    )}${extension}`

    callback(null, fileName)
  }
})

const fileFilter = (req, file, callback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ]

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new Error('Only JPG, PNG, and WEBP image files are allowed.'),
      false
    )
  }

  callback(null, true)
}

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})