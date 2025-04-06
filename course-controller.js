const Course = require('../models/Course');
const Module = require('../models/Module');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('express-async-handler');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = asyncHandler(async (req, res) => {
  // Build query with filters
  const { category, level, search, skillsTaught, requiredForRole, requiredForDepartment, sort } = req.query;
  
  const queryObj = {};
  
  // Filter by category
  if (category) {
    queryObj.category = category;
  }
  
  // Filter by level
  if (level) {
    queryObj.level = level;
  }
  
  // Filter by skills taught
  if (skillsTaught) {
    queryObj.skillsTaught = { $in: skillsTaught.split(',') };
  }
  
  // Filter by required for role
  if (requiredForRole) {
    queryObj.requiredForRoles = { $in: [requiredForRole] };
  }
  
  // Filter by required for department
  if (requiredForDepartment) {
    queryObj.requiredForDepartments = { $in: [requiredForDepartment] };
  }
  
  // Filter published courses only for non-admin users
  if (!req.user || req.user.role !== 'admin') {
    queryObj.isPublished = true;
  }
  
  // Search by title or description
  if (search) {
    queryObj.$or = [
      { title: { $regex: search, $options: 'i' } },
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
  } else if (sort === 'rating') {
    sortOption = { rating: -1 };
  } else {
    sortOption = { createdAt: -1 }; // Default sort by newest
  }
  
  const courses = await Course.find(queryObj)
    .populate('skillsTaught', 'name')
    .populate('creator', 'name')
    .sort(sortOption)
    .skip(startIndex)
    .limit(limit);
  
  const total = await Course.countDocuments(queryObj);
  
  // Calculate enrollments for authenticated users
  let enrolledCourses = [];
  if (req.user) {
    enrolledCourses = await Enrollment.find({ user: req.user.id })
      .select('course status progressPercentage')
      .lean();
  }
  
  // Add enrollment info to courses
  const coursesWithEnrollment = courses.map(course => {
    const courseObj = course.toObject();
    const enrollment = enrolledCourses.find(
      enrollment => enrollment.course.toString() === courseObj._id.toString()
    );
    
    if (enrollment) {
      courseObj.isEnrolled = true;
      courseObj.enrollmentStatus = enrollment.status;
      courseObj.progress = enrollment.progressPercentage;
    } else {
      courseObj.isEnrolled = false;
    }
    
    return courseObj;
  });
  
  res.status(200).json({
    success: true,
    count: courses.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit)
    },
    data: coursesWithEnrollment
  });
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('skillsTaught', 'name')
    .populate('creator', 'name')
    .populate({
      path: 'modules',
      select: 'title description duration quizRequired order',
      options: { sort: { order: 1 } }
    });
  
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  
  // Check if course is published or user is admin
  if (!course.isPublished && (!req.user || req.user.role !== 'admin')) {
    res.status(403);
    throw new Error('Access to unpublished course denied');
  }
  
  // Get enrollment info if user is authenticated
  let enrollment = null;
  if (req.user) {
    enrollment = await Enrollment.findOne({
      user: req.user.id,
      course: course._id
    })
      .select('status progressPercentage completedModules lastAccessedOn')
      .lean();
  }
  
  const courseObj = course.toObject();
  if (enrollment) {
    courseObj.isEnrolled = true;
    courseObj.enrollmentStatus = enrollment.status;
    courseObj.progress = enrollment.progressPercentage;
    courseObj.lastAccessed = enrollment.lastAccessedOn;
    courseObj.completedModules = enrollment.completedModules.map(
      module => module.module.toString()
    );
  } else {
    courseObj.isEnrolled = false;
  }
  
  res.status(200).json({
    success: true,
    data: courseObj
  });
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = asyncHandler(async (req, res) => {
  req.body.creator = req.user.id;
  
  const course = await Course.create(req.body);
  
  res.status(201).json({
    success: true,
    data: course
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = asyncHandler(async (req, res) => {
  let course = await Course.findById(req.params.id);
  
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  
  // Check user is course creator or admin
  if (
    course.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this course');
  }
  
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  
  // Check user is course creator or admin
  if (
    course.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this course');
  }
  
  // Delete all related modules
  await Module.deleteMany({ course: course._id });
  
  // Delete all related enrollments
  await Enrollment.deleteMany({ course: course._id });
  
  await course.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
};
