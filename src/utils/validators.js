export const ID_RULE_MESSAGE = 'ID người dùng phải là số nguyên dương.'

export const PHONE_RULE = /^[0-9]{10}$/
export const PHONE_RULE_MESSAGE = 'Số điện thoại phải gồm đúng 10 chữ số.'

export const USERNAME_RULE=/^[a-zA-Z0-9_]{4,20}$/
export const USERNAME_RULE_MESSAGE='Tên đăng nhập phải có từ 4 đến 20 ký tự và chỉ chứa chữ, số và dấu gạch dưới.'
export const PASSWORD_RULE = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d\W]{8,256}$/
export const PASSWORD_RULE_MESSAGE = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ cái và 1 chữ số.'


// Liên quan đến Validate File
export const LIMIT_COMMON_FILE_SIZE = 10485760 // byte = 10 MB
export const ALLOW_COMMON_FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png']
export const singleFileValidator = (file) => {
  if (!file || !file.name || !file.size || !file.type) {
    return 'Vui lòng chọn file.'
  }
  if (file.size > LIMIT_COMMON_FILE_SIZE) {
    return 'Kích thước file không được vượt quá 10MB.'
  }
  if (!ALLOW_COMMON_FILE_TYPES.includes(file.type)) {
    return 'Định dạng file không hợp lệ. Chỉ chấp nhận JPG, JPEG và PNG.'
  }
  return null
}