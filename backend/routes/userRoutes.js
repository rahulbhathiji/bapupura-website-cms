const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All user management routes require authentication
router.use(protect);

// GET /api/users - List all admins
router.get('/', userController.getUsers);

// GET /api/users/:id - Get single user
router.get('/:id', userController.getUserById);

// POST /api/users - Create new admin (Super Admin only)
router.post('/', authorize('super_admin'), userController.createUser);

// PUT /api/users/:id - Update admin details (Super Admin only)
router.put('/:id', authorize('super_admin'), userController.updateUser);

// PUT /api/users/:id/password - Reset user password (Super Admin only)
router.put('/:id/password', authorize('super_admin'), userController.resetUserPassword);

// DELETE /api/users/:id - Delete admin (Super Admin only)
router.delete('/:id', authorize('super_admin'), userController.deleteUser);

module.exports = router;
