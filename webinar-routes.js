const express = require('express');
const router = express.Router();
const {
  getWebinars,
  getWebinar,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  registerForWebinar,
  cancelRegistration,
  markAttendance,
  submitFeedback,
  syncWithZoom,
  getWebinarCategories
} = require('../controllers/webinarController');
const { protect, authorize } = require('../config/middleware');

// Public routes
router.get('/', getWebinars);
router.get('/categories', getWebinarCategories);
router.get('/:id', getWebinar);

// Protected routes - all users
router.post('/:id/register', protect, registerForWebinar);
router.delete('/:id/register', protect, cancelRegistration);
router.post('/:id/feedback', protect, submitFeedback);

// Admin routes
router.post('/', protect, authorize(['admin']), createWebinar);
router.put('/:id', protect, authorize(['admin']), updateWebinar);
router.delete('/:id', protect, authorize(['admin']), deleteWebinar);
router.put('/:id/attendance', protect, authorize(['admin']), markAttendance);
router.post('/:id/sync-zoom', protect, authorize(['admin']), syncWithZoom);

module.exports = router;
