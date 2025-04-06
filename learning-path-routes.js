const express = require('express');
const router = express.Router();
const {
  getLearningPaths,
  getLearningPath,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
  enrollInLearningPath,
  getLearningPathProgress,
  getLearningPathEnrollments,
  awardLearningPathBadges
} = require('../controllers/learningPathController');
const { protect, authorize } = require('../config/middleware');

// Public routes
router.get('/', getLearningPaths);
router.get('/:id', getLearningPath);

// Protected routes
router.post('/', protect, authorize(['admin']), createLearningPath);
router.put('/:id', protect, authorize(['admin']), updateLearningPath);
router.delete('/:id', protect, authorize(['admin']), deleteLearningPath);

// User enrollment
router.post('/:id/enroll', protect, enrollInLearningPath);
router.get('/:id/progress', protect, getLearningPathProgress);

// Admin routes
router.get('/:id/enrollments', protect, authorize(['admin', 'manager']), getLearningPathEnrollments);
router.post('/:id/award-badges', protect, authorize(['admin']), awardLearningPathBadges);

module.exports = router;
