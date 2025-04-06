const express = require('express');
const router = express.Router();
const { 
  getCourses, 
  getCourse, 
  createCourse, 
  updateCourse, 
  deleteCourse 
} = require('../controllers/courseController');
const { protect, authorize } = require('../config/middleware');

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourse);

// Protected routes
router.post('/', protect, authorize(['admin', 'instructor']), createCourse);
router.put('/:id', protect, authorize(['admin', 'instructor']), updateCourse);
router.delete('/:id', protect, authorize(['admin']), deleteCourse);

module.exports = router;
