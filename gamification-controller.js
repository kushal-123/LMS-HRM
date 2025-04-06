const Badge = require('../models/Badge');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Course = require('../models/Course');
const LearningPath = require('../models/LearningPath');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');

// @desc    Get all badges
// @route   GET /api/gamification/badges
// @access  Public
const getBadges = asyncHandler(async (req, res) => {
  const { type, rarity, sort } = req.query;
  
  // Build query object
  const queryObj = {};
  
  // Admin can see inactive badges, others cannot
  if (!req.user || req.user.role !== 'admin') {
    queryObj.isActive = true;
  }
  
  // Filter by badge type
  if (type) {
    queryObj.badgeType = type;
  }
  
  // Filter by rarity
  if (rarity) {
    queryObj.rarity = rarity;
  }
  
  // Sort options
  let sortOption = {};
  if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'name') {
    sortOption = { name: 1 };
  } else if (sort === 'points') {
    sortOption = { points: -1 };
  } else if (sort === 'rarity') {
    // Sort by rarity level (highest to lowest)
    sortOption = { 
      rarity: -1, // Sort by enum value
      name: 1 // Then by name
    };
  } else {
    sortOption = { createdAt: -1 }; // Default sort by newest
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  // Execute query with appropriate population
  const badges = await Badge.find(queryObj)
    .populate('courseId', 'title')
    .populate('learningPathId', 'name')
    .populate('skillId', 'name')
    .populate('createdBy', 'name')
    .sort(sortOption)
    .skip(startIndex)
    .limit(limit);
  
  // Get total count for pagination
  const total = await Badge.countDocuments(queryObj);
  
  // Add user-specific badge status if authenticated
  if (req.user) {
    // Get user's earned badges
    const userEnrollments = await Enrollment.find({ user: req.user.id })
      .select('badgesEarned');
    
    // Create a set of earned badge IDs
    const earnedBadgeIds = new Set();
    userEnrollments.forEach(enrollment => {
      if (enrollment.badgesEarned && enrollment.badgesEarned.length > 0) {
        enrollment.badgesEarned.forEach(badgeId => {
          earnedBadgeIds.add(badgeId.toString());
        });
      }
    });
    
    // Add earned status to each badge
    const badgesWithStatus = badges.map(badge => {
      const badgeObj = badge.toObject();
      badgeObj.isEarned = earnedBadgeIds.has(badge._id.toString());
      return badgeObj;
    });
    
    return res.status(200).json({
      success: true,
      count: badges.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: badgesWithStatus
    });
  }
  
  res.status(200).json({
    success: true,
    count: badges.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit)
    },
    data: badges
  });
});

// @desc    Get a single badge
// @route   GET /api/gamification/badges/:id
// @access  Public
const getBadge = asyncHandler(async (req, res) => {
  const badge = await Badge.findById(req.params.id)
    .populate('courseId', 'title description category')
    .populate('learningPathId', 'name description')
    .populate('skillId', 'name category')
    .populate('createdBy', 'name');
  
  if (!badge) {
    return res.status(404).json({
      success: false,
      error: 'Badge not found'
    });
  }
  
  // Check if badge is active or user is admin
  if (!badge.isActive && (!req.user || req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      error: 'Access to inactive badge denied'
    });
  }
  
  // Add earned status if authenticated
  if (req.user) {
    // Check if user has earned this badge
    const badgeEarned = await Enrollment.findOne({
      user: req.user.id,
      badgesEarned: badge._id
    });
    
    const badgeObj = badge.toObject();
    badgeObj.isEarned = !!badgeEarned;
    
    return res.status(200).json({
      success: true,
      data: badgeObj
    });
  }
  
  res.status(200).json({
    success: true,
    data: badge
  });
});

// @desc    Create a badge
// @route   POST /api/gamification/badges
// @access  Private/Admin
const createBadge = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  
  // Validate badge type-specific fields
  if (req.body.badgeType === 'Course Completion' && !req.body.courseId) {
    return res.status(400).json({
      success: false,
      error: 'Course ID is required for Course Completion badges'
    });
  }
  
  if (req.body.badgeType === 'Learning Path' && !req.body.learningPathId) {
    return res.status(400).json({
      success: false,
      error: 'Learning Path ID is required for Learning Path badges'
    });
  }
  
  if (req.body.badgeType === 'Skill Mastery' && !req.body.skillId) {
    return res.status(400).json({
      success: false,
      error: 'Skill ID is required for Skill Mastery badges'
    });
  }
  
  const badge = await Badge.create(req.body);
  
  res.status(201).json({
    success: true,
    data: badge
  });
});

// @desc    Update a badge
// @route   PUT /api/gamification/badges/:id
// @access  Private/Admin
const updateBadge = asyncHandler(async (req, res) => {
  let badge = await Badge.findById(req.params.id);
  
  if (!badge) {
    return res.status(404).json({
      success: false,
      error: 'Badge not found'
    });
  }
  
  badge = await Badge.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: badge
  });
});

// @desc    Delete a badge
// @route   DELETE /api/gamification/badges/:id
// @access  Private/Admin
const deleteBadge = asyncHandler(async (req, res) => {
  const badge = await Badge.findById(req.params.id);
  
  if (!badge) {
    return res.status(404).json({
      success: false,
      error: 'Badge not found'
    });
  }
  
  await badge.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get user badges
// @route   GET /api/gamification/user-badges
// @access  Private
const getUserBadges = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user.id;
  
  // Check if user has permission (admin or self)
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to view these badges'
    });
  }
  
  // Get user's enrollments with badges
  const enrollments = await Enrollment.find({ user: userId })
    .populate({
      path: 'badgesEarned',
      populate: [
        { path: 'courseId', select: 'title' },
        { path: 'learningPathId', select: 'name' },
        { path: 'skillId', select: 'name' }
      ]
    })
    .select('badgesEarned course updatedAt')
    .populate('course', 'title');
  
  // Extract unique badges (a badge might be in multiple enrollments)
  const badgeMap = new Map();
  
  enrollments.forEach(enrollment => {
    if (enrollment.badgesEarned && enrollment.badgesEarned.length > 0) {
      enrollment.badgesEarned.forEach(badge => {
        if (!badgeMap.has(badge._id.toString())) {
          const badgeObj = badge.toObject();
          
          // Add context about when/how it was earned
          badgeObj.earnedOn = enrollment.updatedAt;
          badgeObj.earnedFrom = {
            courseId: enrollment.course._id,
            courseTitle: enrollment.course.title
          };
          
          badgeMap.set(badge._id.toString(), badgeObj);
        }
      });
    }
  });
  
  // Convert map to array and sort by earned date (newest first)
  const userBadges = Array.from(badgeMap.values())
    .sort((a, b) => new Date(b.earnedOn) - new Date(a.earnedOn));
  
  res.status(200).json({
    success: true,
    count: userBadges.length,
    data: userBadges
  });
});

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const { department, period, limit = 10 } = req.query;
  
  // Build query object
  const matchObj = {};
  
  // Filter by department if specified
  if (department && department !== 'all') {
    matchObj['user.department'] = department;
  }
  
  // Determine date filter based on period
  let dateFilter = {};
  const now = new Date();
  
  if (period === 'week') {
    // Last 7 days
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    dateFilter = { $gte: weekAgo };
  } else if (period === 'month') {
    // Last 30 days
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    dateFilter = { $gte: monthAgo };
  } else if (period === 'year') {
    // Last 365 days
    const yearAgo = new Date(now);
    yearAgo.setDate(now.getDate() - 365);
    dateFilter = { $gte: yearAgo };
  }
  
  // If period specified, add date filter to match object
  if (Object.keys(dateFilter).length > 0) {
    matchObj.updatedAt = dateFilter;
  }
  
  // Get badges earned by users with point values
  const badgesWithPoints = await Enrollment.aggregate([
    // Match enrollments with earned badges
    { $match: {
      badgesEarned: { $exists: true, $ne: [] },
      ...matchObj
    }},
    // Lookup user details
    { $lookup: {
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'user'
    }},
    // Unwind user array
    { $unwind: '$user' },
    // Unwind badges array
    { $unwind: '$badgesEarned' },
    // Lookup badge details
    { $lookup: {
      from: 'badges',
      localField: 'badgesEarned',
      foreignField: '_id',
      as: 'badgeDetails'
    }},
    // Unwind badge details array
    { $unwind: '$badgeDetails' },
    // Group by user and sum points
    { $group: {
      _id: '$user._id',
      name: { $first: '$user.name' },
      department: { $first: '$user.department' },
      role: { $first: '$user.role' },
      avatarUrl: { $first: '$user.avatarUrl' },
      points: { $sum: '$badgeDetails.points' },
      badgeCount: { $sum: 1 }
    }},
    // Sort by points (descending)
    { $sort: { points: -1 } },
    // Limit results
    { $limit: parseInt(limit) }
  ]);
  
  // Add rank to each user
  const leaderboard = badgesWithPoints.map((user, index) => ({
    ...user,
    rank: index + 1
  }));
  
  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard
  });
});

// @desc    Award a badge to user
// @route   POST /api/gamification/award-badge
// @access  Private/Admin
const awardBadge = asyncHandler(async (req, res) => {
  const { badgeId, userId, courseId } = req.body;
  
  if (!badgeId || !userId || !courseId) {
    return res.status(400).json({
      success: false,
      error: 'Badge ID, User ID, and Course ID are required'
    });
  }
  
  // Check if badge exists
  const badge = await Badge.findById(badgeId);
  
  if (!badge) {
    return res.status(404).json({
      success: false,
      error: 'Badge not found'
    });
  }
  
  // Check if user exists
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  // Check if course exists
  const course = await Course.findById(courseId);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      error: 'Course not found'
    });
  }
  
  // Check if user is already enrolled in the course
  let enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId
  });
  
  if (!enrollment) {
    // Create enrollment if it doesn't exist
    enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      status: 'Not Started'
    });
  }
  
  // Check if user already has this badge in this enrollment
  if (enrollment.badgesEarned.includes(badgeId)) {
    return res.status(400).json({
      success: false,
      error: 'User already has this badge'
    });
  }
  
  // Award the badge
  enrollment.badgesEarned.push(badgeId);
  await enrollment.save();
  
  // Send notification
  await notificationService.sendNotification(
    userId,
    'Badge Awarded',
    `Congratulations! You've been awarded the "${badge.name}" badge for your achievements in "${course.title}"`,
    {
      type: 'badge_earned',
      metadata: {
        badgeId: badge._id,
        badgeName: badge.name,
        courseId: course._id,
        courseTitle: course.title
      }
    }
  );
  
  res.status(200).json({
    success: true,
    message: `Badge "${badge.name}" awarded to ${user.name}`,
    data: {
      badgeId: badge._id,
      badgeName: badge.name,
      userId: user._id,
      userName: user.name,
      courseId: course._id,
      courseTitle: course.title
    }
  });
});

// @desc    Check eligibility for badges
// @route   POST /api/gamification/check-eligibility
// @access  Private
const checkBadgeEligibility = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Get user's enrollments
  const enrollments = await Enrollment.find({ user: userId })
    .populate('course')
    .populate('completedModules.module')
    .populate('badgesEarned');
  
  // Get user's badges
  const userBadgeIds = new Set();
  enrollments.forEach(enrollment => {
    if (enrollment.badgesEarned && enrollment.badgesEarned.length > 0) {
      enrollment.badgesEarned.forEach(badge => {
        userBadgeIds.add(badge._id.toString());
      });
    }
  });
  
  // Get all available badges
  const allBadges = await Badge.find({ isActive: true });
  
  // Filter for badges user doesn't have yet
  const eligibleBadges = [];
  
  for (const badge of allBadges) {
    // Skip if user already has this badge
    if (userBadgeIds.has(badge._id.toString())) {
      continue;
    }
    
    // Check eligibility based on badge type
    let isEligible = false;
    let progress = 0;
    let requirementDetails = '';
    
    switch (badge.badgeType) {
      case 'Course Completion':
        // Check if user completed the required course
        if (badge.courseId) {
          const courseEnrollment = enrollments.find(
            e => e.course && e.course._id.toString() === badge.courseId.toString()
          );
          
          if (courseEnrollment && courseEnrollment.status === 'Completed') {
            isEligible = true;
            progress = 100;
            requirementDetails = `Complete ${courseEnrollment.course.title}`;
          } else if (courseEnrollment) {
            progress = courseEnrollment.progressPercentage;
            requirementDetails = `Complete ${courseEnrollment.course.title}`;
          } else {
            requirementDetails = 'Enroll and complete the required course';
          }
        }
        break;
        
      case 'Engagement':
        // Example: Badge for completing X courses
        if (badge.requirementCriteria && badge.requirementCriteria.courseCount) {
          const completedCourseCount = enrollments.filter(
            e => e.status === 'Completed'
          ).length;
          
          const requiredCount = badge.requirementCriteria.courseCount;
          
          progress = Math.min(100, Math.round((completedCourseCount / requiredCount) * 100));
          isEligible = completedCourseCount >= requiredCount;
          requirementDetails = `Complete ${requiredCount} courses`;
        }
        break;
        
      // Add more badge types here
        
      default:
        requirementDetails = badge.requirements || 'Special requirements';
        break;
    }
    
    if (isEligible || progress > 0) {
      eligibleBadges.push({
        badge,
        isEligible,
        progress,
        requirementDetails
      });
    }
  }
  
  // Sort by eligibility and progress
  eligibleBadges.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.progress - a.progress;
  });
  
  res.status(200).json({
    success: true,
    count: eligibleBadges.length,
    data: eligibleBadges
  });
});

module.exports = {
  getBadges,
  getBadge,
  createBadge,
  updateBadge,
  deleteBadge,
  getUserBadges,
  getLeaderboard,
  awardBadge,
  checkBadgeEligibility
};
