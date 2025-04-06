const express = require('express');
const router = express.Router();
const {
  getBadges,
  getBadge,
  createBadge,
  updateBadge,
  deleteBadge,
  getUserBadges,
  getLeaderboard,
  awardBadge,
  checkBadgeEligibility
} = require('../controllers/gamificationController');
const { protect, authorize } = require('../config/middleware');

// Badge routes
router.get('/badges', getBadges);
router.get('/badges/:id', getBadge);

// Protected badge routes
router.post('/badges', protect, authorize(['admin']), createBadge);
router.put('/badges/:id', protect, authorize(['admin']), updateBadge);
router.delete('/badges/:id', protect, authorize(['admin']), deleteBadge);

// User badge routes
router.get('/user-badges', protect, getUserBadges);
router.get('/check-eligibility', protect, checkBadgeEligibility);

// Leaderboard route
router.get('/leaderboard', getLeaderboard);

// Admin award badge route
router.post('/award-badge', protect, authorize(['admin']), awardBadge);

module.exports = router;
