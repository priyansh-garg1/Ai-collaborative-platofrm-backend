import express from 'express';
import { signup, login, getProfile } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
const router = express.Router();

// @route   POST /api/users/signup
// @desc    Register a new user
router.post('/signup', signup);

// @route   POST /api/users/login
// @desc    Login user
router.post('/login', login);

// @route   GET /api/users/profile
// @desc    Get user profile (protected route)
router.get('/profile', auth, getProfile);

export default router;