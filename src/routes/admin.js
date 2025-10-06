// Admin Routes
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getSystemSettings,
  updateSystemSetting,
  getAdminLogs,
  getUsageAnalytics,
  createFirstAdmin
} = require('../controllers/adminController');
const {
  getAllModels,
  updateModelForTier,
  getModelByTier
} = require('../controllers/modelController');

// Public routes
router.post('/admin/login', loginLimiter, adminLogin);
router.post('/admin/setup', createFirstAdmin); // Only works if no admins exist

// Protected routes (require admin authentication)
router.get('/admin/stats', requireAdmin, getDashboardStats);
router.get('/admin/users', requireAdmin, getAllUsers);
router.get('/admin/settings', requireAdmin, getSystemSettings);
router.put('/admin/settings/:settingKey', requireAdmin, updateSystemSetting);
router.get('/admin/logs', requireAdmin, getAdminLogs);
router.get('/admin/analytics', requireAdmin, getUsageAnalytics);

// Model management routes
router.get('/admin/models', requireAdmin, getAllModels);
router.get('/admin/models/:tier', requireAdmin, getModelByTier);
router.put('/admin/models/:tier', requireAdmin, updateModelForTier);

module.exports = router;
