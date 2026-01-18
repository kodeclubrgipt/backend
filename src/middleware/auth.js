const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth header received:', authHeader ? 'Bearer [token]' : 'none');
    
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ No token provided');
      res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'fallback-secret') {
      console.error('❌ JWT_SECRET not configured');
      res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
      return;
    }
    
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token decoded, userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.log('❌ User not found for userId:', decoded.userId);
      res.status(401).json({ 
        success: false,
        message: 'Token is not valid' 
      });
      return;
    }

    console.log('✅ User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

module.exports = {
  authenticate,
};
