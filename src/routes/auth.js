const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword 
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');

// @route   POST /api/auth/register
router.post('/register', [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], register);

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], login);

// @route   GET /api/auth/me
router.get('/me', auth, getMe);

// @route   PUT /api/auth/profile
router.put('/profile', auth, updateProfile);

// @route   PUT /api/auth/change-password
router.put('/change-password', auth, changePassword);

module.exports = router;