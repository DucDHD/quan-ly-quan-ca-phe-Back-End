import JWT from 'jsonwebtoken'


const generateToken = async (userInfo, secretSignature, tokenLife ) => {
  try {
    // Hàm sign() của thư viện JWT - thuật toán mặc định của nó là HS256
    return JWT.sign( userInfo, secretSignature, { algorithm: 'HS256', expiresIn: tokenLife } )
  } catch (error) { throw new Error(error) }
}

const verifyToken = async (token, secretSignature) => {
  try {
    // hàm verify của thư viện của JWT
    return JWT.verify(token, secretSignature)
  } catch (error) { throw new Error(error) }
}

export const JwtProvider = {
  generateToken,
  verifyToken
}