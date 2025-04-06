const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Content = require('../models/Content');
const Badge = require('../models/Badge');
const asyncHandler = require('express-async-handler');
const notificationService = require('../services/notificationService');
const certificateService = require('../services/certificateService');

// @desc    Enroll user in a course
// @route   POST /api/enrollments
// @access  Private
const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  
  if (!courseId) {
    res.status(400);
    throw new Error('Course ID is required');
  }
  
  // Check if course exists and is published
  const course = await Course.findById(courseId);
  
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  
  if (!course.isPublished) {
    res.status(400);
    throw new Error('Cannot enroll in unpublished course');
  }
  
  // Check if user is already enrolled
  const existingEnrollment = await Enrollment.findOne({
    user: req.user.id,
    course: courseId
  });
  
  if (existingEnrollment) {
    res.status(400);
    throw new Error('Already enrolled in this course');
  }
  
  // Set due date if course is required
  let dueDate = null;
  let isRequired = false;
  let requiredBy = null;
  
  // Check if course is required for user's role or department
  if (
    course.requiredForRoles.includes(req.user.role) ||
    course.requiredForDepartments.includes(req.user.department)
  ) {
    isRequired = true;
    
    if (course.requiredForRoles.includes(req.user.role)) {
      requiredBy = 'Role';
    } else {
      requiredBy = 'Department';
    }
    
    // Set due date to 30 days from now for required courses
    dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
  }
  
  // Create enrollment
  const enrollment = await Enrollment.create({
    user: req.user.id,
    course: courseId,
    status: 'Not Started',
    dueDate,
    isRequired,
    requiredBy
  });
  
  // Increment course enrollment count
  await Course.findByIdAndUpdate(
    courseId,
    { $inc: { enrollmentCount: 1 } }
  );
  
  // Send enrollment notification
  await notificationService.sendNotification(
    req.user.id,
    'Course Enrollment',
    `You have been enrolled in ${course.title}`,
    {
      type: 'course_enrollment',
      courseId: course._id
    }
  );
  
  res.status(201).json({
    success: true,
    data: enrollment
  });
});

// @desc    Get user's enrollments
// @route   GET /api/enrollments
// @access  Private
const getUserEnrollments = asyncHandler(async (req, res) => {
  const { status, sort, category } = req.query;
  
  // Build query
  const queryObj = { user: req.user.id };
  
  // Filter by status
  if (status && ['Not Started', 'In Progress', 'Completed', 'Expired'].includes(status)) {
    queryObj.status = status;
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Build sort object
  let sortOption = {};
  if (sort === 'recent') {
    sortOption = { lastAccessedOn: -1 };
  } else if (sort === 'progress') {
    sortOption = { progressPercentage: -1 };
  } else if (sort === 'dueDate') {
    sortOption = { dueDate: 1 };
  } else {
    sortOption = { enrollmentDate: -1 }; // Default to enrollment date
  }
  
  // Get enrollments with course data
  let enrollmentsQuery = Enrollment.find(queryObj)
    .populate({
      path: 'course',
      select: 'title description category level thumbnail duration'
    })
    .sort(sortOption)
    .skip(startIndex)
    .limit(limit);
  
  // Apply course category filter if provided
  if (category) {
    enrollmentsQuery = enrollmentsQuery.populate({
      path: 'course',
      match: { category }
    });
  }
  
  const enrollments = await enrollmentsQuery;
  
  // Filter out null courses (when category filter applied)
  const filteredEnrollments = enrollments.filter(
    enrollment => enrollment.course !== null
  );
  
  // Get total count with filters
  const countQuery = { ...queryObj };
  
  if (category) {
    // This requires an aggregation to count filtered by course category
    const courseIds = await Course.find({ category })
      .select('_id')
      .lean();
    
    countQuery.course = { $in: courseIds.map(c => c._id) };
  }
  
  const total = await Enrollment.countDocuments(countQuery);
  
  res.status(200).json({
    success: true,
    count: filteredEnrollments.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit)
    },
    data: filteredEnrollments
  });
});

// @desc    Get enrollment details
// @route   GET /api/enrollments/:id
// @access  Private
const getEnrollmentDetails = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate({
      path: 'course',
      populate: {
        path: 'modules',
        options: { sort: { order: 1 } }
      }
    })
    .populate('completedModules.module')
    .populate('completedContent.content');
  
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  
  // Check if user owns the enrollment or is admin
  if (
    enrollment.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to access this enrollment');
  }
  
  res.status(200).json({
    success: true,
    data: enrollment
  });
});

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
const updateEnrollmentProgress = asyncHandler(async (req, res) => {
  const { moduleId, contentId, timeSpent, quizScore } = req.body;
  
  const enrollment = await Enrollment.findById(req.params.id);
  
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  
  // Check if user owns the enrollment
  if (enrollment.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this enrollment');
  }
  
  // Update last accessed timestamp
  enrollment.lastAccessedOn = Date.now();
  
  // Update content progress if provided
  if (contentId) {
    const content = await Content.findById(contentId);
    
    if (!content) {
      res.status(404);
      throw new Error('Content not found');
    }
    
    // Check if content is already completed
    const completedContentIndex = enrollment.completedContent.findIndex(
      item => item.content.toString() === contentId
    );
    
    if (completedContentIndex === -1) {
      // Add new completed content
      enrollment.completedContent.push({
        content: contentId,
        completedOn: Date.now(),
        timeSpent: timeSpent || 0
      });
    } else {
      // Update existing completed content
      enrollment.completedContent[completedContentIndex].timeSpent += timeSpent || 0;
    }
  }
  
  // Update module progress if provided
  if (moduleId) {
    const module = await Module.findById(moduleId);
    
    if (!module) {
      res.status(404);
      throw new Error('Module not found');
    }
    
    // Check if module is already completed
    const completedModuleIndex = enrollment.completedModules.findIndex(
      item => item.module.toString() === moduleId
    );
    
    if (completedModuleIndex === -1 && quizScore) {
      // Add new completed module with quiz score
      enrollment.completedModules.push({
        module: moduleId,
        completedOn: Date.now(),
        quizScore,
        quizAttempts: 1
      });
    } else if (completedModuleIndex !== -1 && quizScore) {
      // Update existing module quiz score if higher
      if (quizScore > enrollment.completedModules[completedModuleIndex].quizScore) {
        enrollment.completedModules[completedModuleIndex].quizScore = quizScore;
      }
      enrollment.completedModules[completedModuleIndex].quizAttempts += 1;
    }
  }
  
  // Calculate overall progress
  const course = await Course.findById(enrollment.course)
    .populate('modules');
  
  const totalModules = course.modules.length;
  const completedModulesCount = enrollment.completedModules.length;
  
  enrollment.progressPercentage = Math.round((completedModulesCount / totalModules) * 100);
  
  // Update status based on progress
  if (enrollment.progressPercentage === 0) {
    enrollment.status = 'Not Started';
  } else if (enrollment.progressPercentage < 100) {
    enrollment.status = 'In Progress';
  } else if (enrollment.progressPercentage === 100) {
    enrollment.status = 'Completed';
    
    // Issue certificate if not already issued
    if (!enrollment.certificateIssued) {
      try {
        const certificateUrl = await certificateService.generateCertificate(
          req.user.id,
          course.title,
          course.certificateTemplate
        );
        
        enrollment.certificateIssued = true;
        enrollment.certificateUrl = certificateUrl;
        enrollment.certificateIssuedOn = Date.now();
        
        // Send notification about certificate
        await notificationService.sendNotification(
          req.user.id,
          'Certificate Issued',
          `Congratulations! You have received a certificate for completing ${course.title}`,
          {
            type: 'certificate_issued',
            courseId: course._id,
            certificateUrl
          }
        );
        
        // Award completion badge if exists
        const completionBadge = await Badge.findOne({
          badgeType: 'Course Completion',
          courseId: course._id
        });
        
        if (completionBadge) {
          enrollment.badgesEarned.push(completionBadge._id);
          
          // Send notification about badge
          await notificationService.sendNotification(
            req.user.id,
            'Badge Earned',
            `You have earned the ${completionBadge.name} badge!`,
            {
              type: 'badge_earned',
              badgeId: completionBadge._id
            }
          );
        }
      } catch (error) {
        console.error('Certificate generation error:', error);
      }
    }
  }
  
  await enrollment.save();
  
  res.status(200).json({
    success: true,
    data: enrollment
  });
});

// @desc    Submit assignment
// @route   POST /api/enrollments/:id/assignments/:contentId
// @access  Private
const submitAssignment = asyncHandler(async (req, res) => {
  const { submissionText, submissionFileUrl, submissionLink } = req.body;
  const { id, contentId } = req.params;
  
  const enrollment = await Enrollment.findById(id);
  
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }
  
  // Check if user owns the enrollment
  if (enrollment.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this enrollment');
  }
  
  // Check if content exists and is an assignment
  const content = await Content.findById(contentId);
  
  if (!content || content.contentType !== 'Assignment') {
    res.status(400);
    throw new Error('Invalid assignment content');
  }
  
  // Find the completed content or create new
  const completedContentIndex = enrollment.completedContent.findIndex(
    item => item.content.toString() === contentId
  );
  
  if (completedContentIndex === -1) {
    // Add new completed content with assignment submission
    enrollment.completedContent.push({
      content: contentId,
      completedOn: Date.now(),
      timeSpent: 0,
      assignmentSubmission: {
        submissionText,
        submissionFileUrl,
        submissionLink,
        submittedOn: Date.now(),
        status: 'Pending'
      }
    });
  } else {
    // Update existing completed content with assignment submission
    enrollment.completedContent[completedContentIndex].assignmentSubmission = {
      submissionText,
      submissionFileUrl,
      submissionLink,
      submittedOn: Date.now(),
      status: 'Pending'
    };
  }
  
  // Update last accessed timestamp
  enrollment.lastAccessedOn = Date.now();
  
  await enrollment.save();
  
  // Notify instructor about the submission
  await notificationService.sendNotification(
    content.createdBy, // Assuming content has a createdBy field for the instructor
    'Assignment Submission',
    `New assignment submission for ${content.title}`,
    {
      type: 'assignment_submission',
      contentId: content._id,
      enrollmentId: enrollment._id,
      userId: req.user.id
    }
  );
  
  res.status(200).json({
    success: true,
    data: enrollment
  });
});

module.exports = {
  enrollInCourse,
  getUserEnrollments,
  getEnrollmentDetails,
  updateEnrollmentProgress,
  submitAssignment
};
