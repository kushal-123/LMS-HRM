const express = require('express');
const router = express.Router();
const {
  getLearningEffectiveness,
  getSkillGapAnalysis,
  getDepartmentCompliance,
  getCareerPathPredictions,
  getUserLearningMetrics,
  getCourseCompletionStats,
  getOverallAnalytics,
  exportAnalyticsReport
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../config/middleware');

// All analytics routes are protected
router.use(protect);

// User-level analytics
router.get('/user/:userId', authorize(['admin', 'manager', 'self']), getUserLearningMetrics);

// Course analytics
router.get('/courses/:courseId', authorize(['admin', 'instructor']), getCourseCompletionStats);

// Department-level analytics
router.get('/effectiveness', authorize(['admin', 'manager']), getLearningEffectiveness);
router.get('/skill-gap', authorize(['admin', 'manager']), getSkillGapAnalysis);
router.get('/compliance', authorize(['admin', 'manager']), getDepartmentCompliance);
router.get('/career-path', authorize(['admin', 'manager']), getCareerPathPredictions);

// Organization-level analytics
router.get('/overall', authorize(['admin']), getOverallAnalytics);

// Export functionality
router.get('/export/:reportType', authorize(['admin', 'manager']), exportAnalyticsReport);

module.exports = router;
