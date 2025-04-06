const LearningPath = require('../models/LearningPath');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Badge = require('../models/Badge');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');
const certificateService = require('../services/certificateService');

// @desc    Get all learning paths
// @route   GET /api/learning-paths
// @access  Public
const getLearningPaths = asyncHandler(async (req, res) => {
  // Build query with filters
  const { role, department, search, sort } = req.query;
  
  const queryObj = {};
  
  // Filter for active paths only for non-admin users
  if (!req.user || req.user.role !== 'admin') {
    queryObj.isActive = true;
  }
  
  // Filter by target role
  if (role) {
    queryObj.targetRoles = { $in: [role] };
  }
  
  // Filter by target department
  if (department) {
    queryObj.targetDepartments = { $in: [department] };
  }
  
  // Search by name or description
  if (search) {
    queryObj.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Sort options
  let sortOption = {};
  if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'popularity') {
    sortOption = { enrollmentCount: -1 };
  } else if (sort === 'name') {
    sortOption = { name: 1 };
  } else {
    sortOption = { createdAt: -1 }; // Default sort by newest
  }
  
  // Execute query with populated courses and skills
  const learningPaths = await LearningPath.find(queryObj)
    .populate('skillsDeveloped', 'name category')
    .populate('courses', 'title category level thumbnail duration')
    .populate('creator', 'name')
    .populate('completionBadge', 'name imageUrl')
    .sort(sortOption)
    .skip(startIndex)
    .limit(limit);
  
  // Get total count for pagination
  const total = await LearningPath.countDocuments(queryObj);
  
  // Get enrollment status for authenticated users
  let enrolledPaths = [];
  if (req.user) {
    // Find all user enrollments for each course in any learning path
    const pathCourseIds = learningPaths.reduce((ids, path) => {
      if (path.courses && path.courses.length > 0) {
        ids.push(...path.courses.map(course => course._id));
      }
      return ids;
    }, []);
    
    // Get enrollments for these courses
    const enrollments = await Enrollment.find({
      user: req.user.id,
      course: { $in: pathCourseIds }
    }).select('course status progressPercentage');
    
    // Create a map of course enrollments
    const courseEnrollmentMap = {};
    enrollments.forEach(enrollment => {
      courseEnrollmentMap[enrollment.course.toString()] = {
        status: enrollment.status,
        progress: enrollment.progressPercentage
      };
    });
    
    // Add enrollment data to learning paths
    enrolledPaths = learningPaths.map(path => {
      const pathObj = path.toObject();
      
      // Calculate enrollment progress for this path
      let enrolledCourseCount = 0;
      let completedCourseCount = 0;
      let totalProgress = 0;
      
      if (pathObj.courses && pathObj.courses.length > 0) {
        pathObj.courses.forEach(course => {
          const courseId = course._id.toString();
          if (courseEnrollmentMap[courseId]) {
            enrolledCourseCount++;
            totalProgress += courseEnrollmentMap[courseId].progress;
            
            if (courseEnrollmentMap[courseId].status === 'Completed') {
              completedCourseCount++;
            }
          }
        });
      }
      
      // Determine if user is enrolled and overall progress
      pathObj.isEnrolled = enrolledCourseCount > 0;
      pathObj.enrollmentProgress = pathObj.courses.length > 0 ? 
        Math.round(totalProgress / pathObj.courses.length) : 0;
      pathObj.completedCourses = completedCourseCount;
      pathObj.isCompleted = pathObj.completionCriteria === 'All Courses' ?
        (completedCourseCount === pathObj.courses.length) :
        (pathObj.keyCourses && 
         pathObj.keyCourses.every(courseId => 
          courseEnrollmentMap[courseId.toString()]?.status === 'Completed'
         ));
      
      return pathObj;
    });
  }
  
  res.status(200).json({
    success: true,
    count: learningPaths.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit)
    },
    data: req.user ? enrolledPaths : learningPaths
  });
});

// @desc    Get single learning path
// @route   GET /api/learning-paths/:id
// @access  Public
const getLearningPath = asyncHandler(async (req, res) => {
  const learningPath = await LearningPath.findById(req.params.id)
    .populate('skillsDeveloped', 'name category')
    .populate({
      path: 'courses',
      select: 'title description category level thumbnail duration modules',
      populate: {
        path: 'modules',
        select: 'title description duration quizRequired'
      }
    })
    .populate('creator', 'name')
    .populate('completionBadge', 'name imageUrl description')
    .populate({
      path: 'prerequisites.skills',
      select: 'name category'
    });
  
  if (!learningPath) {
    return res.status(404).json({
      success: false,
      error: 'Learning path not found'
    });
  }
  
  // Check if path is active or user is admin
  if (!learningPath.isActive && (!req.user || req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      error: 'Access to inactive learning path denied'
    });
  }
  
  // Add user enrollment status if authenticated
  if (req.user) {
    const pathObj = learningPath.toObject();
    
    // Get all course IDs in this path
    const courseIds = pathObj.courses.map(course => course._id);
    
    // Get enrollments for these courses
    const enrollments = await Enrollment.find({
      user: req.user.id,
      course: { $in: courseIds }
    }).select('course status progressPercentage lastAccessedOn');
    
    // Create a map of course enrollments
    const courseEnrollmentMap = {};
    enrollments.forEach(enrollment => {
      courseEnrollmentMap[enrollment.course.toString()] = enrollment;
    });
    
    // Add enrollment status to each course
    let enrolledCourseCount = 0;
    let completedCourseCount = 0;
    
    pathObj.courses = pathObj.courses.map(course => {
      const courseId = course._id.toString();
      const enrollment = courseEnrollmentMap[courseId];
      
      if (enrollment) {
        enrolledCourseCount++;
        
        if (enrollment.status === 'Completed') {
          completedCourseCount++;
        }
        
        return {
          ...course,
          isEnrolled: true,
          enrollmentStatus: enrollment.status,
          progress: enrollment.progressPercentage,
          lastAccessed: enrollment.lastAccessedOn
        };
      }
      
      return {
        ...course,
        isEnrolled: false
      };
    });
    
    // Add overall enrollment status
    pathObj.isEnrolled = enrolledCourseCount > 0;
    pathObj.enrollmentProgress = courseIds.length > 0 ?
      Math.round((completedCourseCount / courseIds.length) * 100) : 0;
    pathObj.completedCourses = completedCourseCount;
    pathObj.isCompleted = pathObj.completionCriteria === 'All Courses' ?
      (completedCourseCount === courseIds.length) :
      (pathObj.keyCourses && 
       pathObj.keyCourses.every(courseId => 
        courseEnrollmentMap[courseId.toString()]?.status === 'Completed'
       ));
    
    return res.status(200).json({
      success: true,
      data: pathObj
    });
  }
  
  res.status(200).json({
    success: true,
    data: learningPath
  });
});

// @desc    Create new learning path
// @route   POST /api/learning-paths
// @access  Private/Admin
const createLearningPath = asyncHandler(async (req, res) => {
  req.body.creator = req.user.id;
  
  const learningPath = await LearningPath.create(req.body);
  
  res.status(201).json({
    success: true,
    data: learningPath
  });
});

// @desc    Update learning path
// @route   PUT /api/learning-paths/:id
// @access  Private/Admin
const updateLearningPath = asyncHandler(async (req, res) => {
  let learningPath = await LearningPath.findById(req.params.id);
  
  if (!learningPath) {
    return res.status(404).json({
      success: false,
      error: 'Learning path not found'
    });
  }
  
  // Check user is creator or admin
  if (
    learningPath.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this learning path'
    });
  }
  
  learningPath = await LearningPath.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: learningPath
  });
});

// @desc    Delete learning path
// @route   DELETE /api/learning-paths/:id
// @access  Private/Admin
const deleteLearningPath = asyncHandler(async (req, res) => {
  const learningPath = await LearningPath.findById(req.params.id);
  
  if (!learningPath) {
    return res.status(404).json({
      success: false,
      error: 'Learning path not found'
    });
  }
  
  // Check user is creator or admin
  if (
    learningPath.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this learning path'
    });
  }
  
  await learningPath.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Enroll user in all courses of a learning path
// @route   POST /api/learning-paths/:id/enroll
// @access  Private
const enrollInLearningPath = asyncHandler(async (req, res) => {
  const learningPathId = req.params.id;
  
  // Get the learning path with courses
  const learningPath = await LearningPath.findById(learningPathId)
    .populate('courses')
    .populate('skillsDeveloped', 'name');
  
  if (!learningPath) {
    return res.status(404).json({
      success: false,
      error: 'Learning path not found'
    });
  }
  
  if (!learningPath.isActive) {
    return res.status(400).json({
      success: false,
      error: 'Cannot enroll in inactive learning path'
    });
  }
  
  if (!learningPath.courses || learningPath.courses.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Learning path has no courses'
    });
  }
  
  // Get current enrollments to avoid duplicates
  const existingEnrollments = await Enrollment.find({
    user: req.user.id,
    course: { $in: learningPath.courses.map(c => c._id) }
  });
  
  const existingCourseIds = existingEnrollments.map(e => e.course.toString());
  
  // Enroll user in each course that they're not already enrolled in
  const enrollmentPromises = [];
  const newlyEnrolledCourses = [];
  
  for (let i = 0; i < learningPath.courses.length; i++) {
    const course = learningPath.courses[i];
    
    // Skip if already enrolled
    if (existingCourseIds.includes(course._id.toString())) {
      continue;
    }
    
    // Set due date incrementally (first course due sooner)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14 + (i * 14)); // 2 weeks + 2 weeks per course order
    
    // Create enrollment with learning path context
    const enrollment = new Enrollment({
      user: req.user.id,
      course: course._id,
      status: 'Not Started',
      isRequired: false, // Optional, even if part of a learning path
      dueDate,
      metadata: {
        enrolledFrom: 'LearningPath',
        learningPathId: learningPath._id,
        learningPathName: learningPath.name
      }
    });
    
    enrollmentPromises.push(enrollment.save());
    newlyEnrolledCourses.push(course);
    
    // Increment course enrollment count
    enrollmentPromises.push(
      Course.findByIdAndUpdate(
        course._id,
        { $inc: { enrollmentCount: 1 } }
      )
    );
  }
  
  // Wait for all enrollments to complete
  await Promise.all(enrollmentPromises);
  
  // Increment learning path enrollment count
  await LearningPath.findByIdAndUpdate(
    learningPathId,
    { $inc: { enrollmentCount: 1 } }
  );
  
  // Send notification if any new enrollments were created
  if (newlyEnrolledCourses.length > 0) {
    await notificationService.sendNotification(
      req.user.id,
      'Learning Path Enrollment',
      `You've been enrolled in the "${learningPath.name}" learning path with ${newlyEnrolledCourses.length} courses`,
      {
        type: 'learning_path_enrollment',
        metadata: {
          learningPathId: learningPath._id,
          courseCount: newlyEnrolledCourses.length,
          skills: learningPath.skillsDeveloped.map(skill => skill.name).join(', ')
        }
      }
    );
  }
  
  res.status(200).json({
    success: true,
    data: {
      learningPathId: learningPath._id,
      enrolledCourses: newlyEnrolledCourses.length,
      alreadyEnrolledCourses: existingCourseIds.length,
      totalCourses: learningPath.courses.length
    }
  });
});

// @desc    Get learning path progress for a user
// @route   GET /api/learning-paths/:id/progress
// @access  Private
const getLearningPathProgress = asyncHandler(async (req, res) => {
  const learningPathId = req.params.id;
  const userId = req.query.userId || req.user.id;
  
  // Check if user has permission (admin, manager, or self)
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    req.user.id !== userId
  ) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this user\'s progress'
    });
  }
  
  // Get the learning path with courses
  const learningPath = await LearningPath.findById(learningPathId)
    .populate('courses', 'title description duration category')
    .populate('completionBadge')
    .populate('skillsDeveloped', 'name');
  
  if (!learningPath) {
    return res.status(404).json({
      success: false,
      error: 'Learning path not found'
    });
  }
  
  // Get user's enrollments for courses in this path
  const courseIds = learningPath.courses.map(course => course._id);
  
  const enrollments = await Enrollment.find({
    user: userId,
    course: { $in: courseIds }
  })
    .populate('course', 'title description duration category')
    .select('status progressPercentage lastAccessedOn completedModules');
  
  // Create a map of course enrollments
  const courseEnrollmentMap = {};
  enrollments.forEach(enrollment => {
    courseEnrollmentMap[enrollment.course._id.toString()] = enrollment;
  });
  
  // Calculate overall progress
  const enrolledCourseCount = enrollments.length;
  const completedCourseCount = enrollments.filter(e => e.status === 'Completed').length;
  const inProgressCourseCount = enrollments.filter(e => e.status === 'In Progress').length;
  
  // Check if learning path is completed based on criteria
  let isCompleted = false;
  
  if (learningPath.completionCriteria === 'All Courses') {
    isCompleted = enrolledCourseCount === courseIds.length && 
                  completedCourseCount === courseIds.length;
  } else if (learningPath.completionCriteria === 'Key Courses') {
    // Check if all key courses are completed
    isCompleted = learningPath.keyCourses.every(courseId => {
      const enrollment = courseEnrollmentMap[courseId.toString()];
      return enrollment && enrollment.status === 'Completed';
    });
  }
  
  // Get recommended next course (first incomplete course)
  let nextRecommendedCourse = null;
  
  for (const course of learningPath.courses) {
    const enrollment = courseEnrollmentMap[course._id.toString()];
    
    if (!enrollment || enrollment.status !== 'Completed') {
      nextRecommendedCourse = {
        courseId: course._id,
        title: course.title,
        description: course.description,
        duration: course.duration,
        category: course.category,
        enrolled: !!enrollment,
        progress: enrollment ? enrollment.progressPercentage : 0
      };
      break;
    }
  }
  
  // Format data for frontend
  const progressData = {
    learningPath: {
      id: learningPath._id,
      name: learningPath.name,
      description: learningPath.description,
      totalCourses: courseIds.length
    },
    progress: {
      enrolledCourses: enrolledCourseCount,
      completedCourses: completedCourseCount,
      inProgressCourses: inProgressCourseCount,
      notStartedCourses: enrolledCourseCount - completedCourseCount - inProgressCourseCount,
      overallProgress: courseIds.length > 0 ? 
        Math.round((completedCourseCount / courseIds.length) * 100) : 0,
      isCompleted
    },
    courseProgress: learningPath.courses.map(course => {
      const enrollment = courseEnrollmentMap[course._id.toString()];
      
      return {
        courseId: course._id,
        title: course.title,
        enrolled: !!enrollment,
        status: enrollment ? enrollment.status : 'Not Enrolled',
        progress: enrollment ? enrollment.progressPercentage : 0,
        lastAccessed: enrollment ? enrollment.lastAccessedOn : null
      };
    }),
    nextRecommendedCourse,
    completionBadge: isCompleted && learningPath.completionBadge ? {
      id: learningPath.completionBadge._id,
      name: learningPath.completionBadge.name,
      imageUrl: learningPath.completionBadge.imageUrl
    } : null,
    skills: learningPath.skillsDeveloped.map(skill => skill.name)
  };
  
  res.status(200).json({
    success: true,
    data: progressData
  });
});

// @desc    Get all users enrolled in a learning path
// @route   GET /api/learning-paths/:id/enrollments
// @access  Private/Admin
const getLearningPathEnrollments = asyncHandler(async (req, res) => {
  const learningPathId = req.params.id;
  
  // Get the learning path
  const learningPath = await LearningPath.findById(learningPathId);
  
  if (!learningPath) {
    return res.status(404).json({
      success: false,
      error: 'Learning path not found'
    });
  }
  
  // Get all course IDs in this path
  const courseIds = learningPath.courses;
  
  if (!courseIds || courseIds.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }
  
  // Get all enrollments for these courses
  const enrollments = await Enrollment.find({
    course: { $in: courseIds },
    'metadata.enrolledFrom': 'LearningPath',
    'metadata.learningPathId': learningPathId
  })
    .populate('user', 'name email department role')
    .populate('course', 'title')
    .select('user course status progressPercentage enrollmentDate');
  
  // Group enrollments by user
  const userEnrollments = {};
  
  enrollments.forEach(enrollment => {
    const userId = enrollment.user._id.toString();
    
    if (!userEnrollments[userId]) {
      userEnrollments[userId] = {
        user: enrollment.user,
        enrolledCourses: 0,
        completedCourses: 0,
        overallProgress: 0,
        courses: []
      };
    }
    
    userEnrollments[userId].enrolledCourses++;
    userEnrollments[userId].courses.push({
      course: enrollment.course,
      status: enrollment.status,
      progress: enrollment.progressPercentage,
      enrollmentDate: enrollment.enrollmentDate
    });
    
    if (enrollment.status === 'Completed') {
      userEnrollments[userId].completedCourses++;
    }
  });
  
  // Calculate overall progress for each user
  Object.keys(userEnrollments).forEach(userId => {
    const user = userEnrollments[userId];
    
    user.overallProgress = Math.round(
      (user.completedCourses / courseIds.length) * 100
    );
    
    user.isCompleted = user.completedCourses === courseIds.length;
  });
  
  // Convert to array and sort by progress
  const userProgressList = Object.values(userEnrollments)
    .sort((a, b) => b.overallProgress - a.overallProgress);
  
  res.status(200).json({
    success: true,
    count: userProgressList.length,
    data: userProgressList
  });
});

// @desc    Award learning path completion badges
// @route   POST /api/learning-paths/:id/award-badges
// @access  Private/Admin
const awardLearningPathBadges = asyncHandler(async (req, res) => {
  const learningPathId = req.params.id;
  
  // Get the learning path with completion badge
  const learningPath = await LearningPath.findById(learningPathId)
    .populate('completionBadge')
    .populate('courses');
  
  if (!learningPath) {
    return res.status(404).json({
      success: false,
      error: 'Learning path not found'
    });
  }
  
  if (!learningPath.completionBadge) {
    return res.status(400).json({
      success: false,
      error: 'Learning path has no completion badge configured'
    });
  }
  
  // Get all course IDs in this path
  const courseIds = learningPath.courses.map(course => course._id);
  
  // If no criteria, default is all courses need to be completed
  let completionQuery = {};
  
  // Get users who completed all required courses
  if (learningPath.completionCriteria === 'All Courses') {
    // Get all users who completed every course in the path
    const aggregateResult = await Enrollment.aggregate([
      // Match enrollments for courses in this path that are completed
      { $match: { 
        course: { $in: courseIds }, 
        status: 'Completed' 
      }},
      // Group by user and count completed courses
      { $group: { 
        _id: '$user', 
        completedCount: { $sum: 1 }
      }},
      // Only include users who completed all courses
      { $match: { 
        completedCount: courseIds.length 
      }}
    ]);
    
    const qualifiedUserIds = aggregateResult.map(result => result._id);
    
    if (qualifiedUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users have completed all required courses',
        badgesAwarded: 0
      });
    }
    
    completionQuery = { _id: { $in: qualifiedUserIds } };
  } else if (learningPath.completionCriteria === 'Key Courses') {
    // Get all users who completed the key courses
    const keyCourseIds = learningPath.keyCourses.map(id => id.toString());
    
    const aggregateResult = await Enrollment.aggregate([
      // Match enrollments for key courses that are completed
      { $match: { 
        course: { $in: keyCourseIds.map(id => mongoose.Types.ObjectId(id)) }, 
        status: 'Completed' 
      }},
      // Group by user and collect completed course IDs
      { $group: { 
        _id: '$user', 
        completedCourses: { $push: '$course' }
      }},
      // Calculate set intersection to ensure all key courses are completed
      { $project: { 
        completedAll: { 
          $eq: [
            { $size: { $setIntersection: ['$completedCourses', keyCourseIds.map(id => mongoose.Types.ObjectId(id))] } }, 
            keyCourseIds.length
          ]
        }
      }},
      // Only include users who completed all key courses
      { $match: { completedAll: true }}
    ]);
    
    const qualifiedUserIds = aggregateResult.map(result => result._id);
    
    if (qualifiedUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users have completed the required key courses',
        badgesAwarded: 0
      });
    }
    
    completionQuery = { _id: { $in: qualifiedUserIds } };
  }
  
  // Get qualified users
  const qualifiedUsers = await User.find(completionQuery).select('_id name email');
  
  if (qualifiedUsers.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No users qualify for badge awards',
      badgesAwarded: 0
    });
  }
  
  // Award badges to qualifying users
  let badgesAwarded = 0;
  const badgeAwardPromises = [];
  
  for (const user of qualifiedUsers) {
    // Check if user already has this badge
    const existingEnrollment = await Enrollment.findOne({
      user: user._id,
      course: { $in: courseIds },
      badgesEarned: learningPath.completionBadge._id
    });
    
    if (!existingEnrollment) {
      // Find an enrollment to update
      const enrollment = await Enrollment.findOne({
        user: user._id,
        course: { $in: courseIds }
      });
      
      if (enrollment) {
        // Award badge
        enrollment.badgesEarned.push(learningPath.completionBadge._id);
        badgeAwardPromises.push(enrollment.save());
        
        // Send notification
        badgeAwardPromises.push(
          notificationService.sendNotification(
            user._id,
            'Badge Earned',
            `Congratulations! You've earned the "${learningPath.completionBadge.name}" badge for completing the "${learningPath.name}" learning path`,
            {
              type: 'badge_earned',
              metadata: {
                badgeId: learningPath.completionBadge._id,
                badgeName: learningPath.completionBadge.name,
                learningPathId: learningPath._id,
                learningPathName: learningPath.name
              }
            }
          )
        );
        
        badgesAwarded++;
      }
    }
  }
  
  // Wait for all badge awards to complete
  await Promise.all(badgeAwardPromises);
  
  res.status(200).json({
    success: true,
    message: `Awarded ${badgesAwarded} badges to qualifying users`,
    badgesAwarded,
    totalQualified: qualifiedUsers.length
  });
});

module.exports = {
  getLearningPaths,
  getLearningPath,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
  enrollInLearningPath,
  getLearningPathProgress,
  getLearningPathEnrollments,
  awardLearningPathBadges
};
