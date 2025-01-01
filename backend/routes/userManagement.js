const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const UserManagementService = require('../services/userManagementService');

// Get user details
router.get('/:userId', [auth], async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has access
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const userDetails = await UserManagementService.getUserDetails(userId);
    res.json(userDetails);
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const user = await UserManagementService.updateUserProfile(
      req.user.id,
      req.body
    );
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update password
router.post('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const result = await UserManagementService.updatePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.json(result);
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin routes
// Get user list
router.get('/', [auth, adminAuth], async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const users = await UserManagementService.getUserList(
      filters,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );
    res.json(users);
  } catch (error) {
    console.error('Error getting user list:', error);
    res.status(500).json({ message: 'Failed to get user list' });
  }
});

// Manage user status
router.post('/:userId/status', [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    if (action === 'suspend' && !reason) {
      return res.status(400).json({ message: 'Reason is required for suspension' });
    }

    const user = await UserManagementService.manageUserStatus(
      userId,
      action,
      reason
    );
    res.json(user);
  } catch (error) {
    console.error('Error managing user status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete('/:userId', [auth, adminAuth], async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserManagementService.deleteUser(userId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
