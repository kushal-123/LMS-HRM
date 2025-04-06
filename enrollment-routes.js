const express = require('express');
const router = express.Router();
const { 
  enrollInCourse,
  getUserEnrollments,
  getEnrollmentDetails,
  updateEnrollmentProgress,
  submitAssignment
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../config/middleware');

// All enrollment routes are protected
router.use(protect);

// User enrollments
router.post('/', enrollInCourse);
router.get('/', getUserEnrollments);
router.get('/:id', getEnrollmentDetails);
router.put('/:id/progress', updateEnrollmentProgress);
router.post('/:id/assignments/:contentId', submitAssignment);

// Admin routes
router.get('/users/:userId', authorize(['admin', 'instructor']), getUserEnrollments);

module.exports = router;
