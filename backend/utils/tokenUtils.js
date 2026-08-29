import jwt from 'jsonwebtoken';

// Generate JWT Token
export const generateToken = (userId, role = 'citizen', expiresIn = process.env.JWT_EXPIRE || '7d') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

// Generate Refresh Token
export const generateRefreshToken = (userId, role = 'citizen') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Verify Token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Decode Token without verification
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

export default { generateToken, generateRefreshToken, verifyToken, decodeToken };
