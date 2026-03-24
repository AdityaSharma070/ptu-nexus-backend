const jwt = require('jsonwebtoken');

// Protect routes - require authentication
exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    // Remove 'Bearer ' if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

// Check if user is a teacher
exports.isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Teachers only.' 
    });
  }
  next();
};

// Check if user is a student
exports.isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Students only.' 
    });
  }
  next();
};