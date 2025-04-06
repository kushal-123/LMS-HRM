/**
 * Content Controller
 * Handles content-related operations (CRUD, progress tracking, etc.)
 */

const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Content = require('../models/Content');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const Assignment = require('../models/Assignment');
const { createApiError, asyncHandler } = require('../config/middleware');
const { validateProgressUpdate } = require('../utils/dataValidation');

/**
 * @desc    Get all content for a module
 * @route   GET /api/courses/:courseId/modules/:moduleId/content
 * @access  Private
 */
const getModuleContent = asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.params;
  
  // Verify course and module exist
  const course = await Course.findById(courseId);
  if (!course) {
    throw createApiError.notFound('Course not found');
  }
  
  const module = await Module.findOne({
    _id: moduleId,
    course: courseId
  });
  
  if (!module) {
    throw createApiError.notFound('Module not found');
  }

  // Get content items
  const content = await Content.find({
    module: moduleId
  }).sort({ order: 1 });
  
  // If user is enrolled, get progress information
  let contentWithProgress = content;
  
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });
    
    if (enrollment) {
      contentWithProgress = content.map(item => {
        const contentProgress = enrollment.moduleProgress
          .find(mp => mp.moduleId.toString() === moduleId)?.contentProgress
          .find(cp => cp.contentId.toString() === item._id.toString());
        
        return {
          ...item.toObject(),
          progress: contentProgress ? {
            status: contentProgress.status,
            progress: contentProgress.progress,
            lastAccessDate: contentProgress.lastAccessDate,
            completionDate: contentProgress.completionDate,
            timeSpent: contentProgress.timeSpent
          } : {
            status: 'not-started',
            progress: 0
          }
        };
      });
    }
  }
  
  res.status(200).json({
    success: true,
    count: contentWithProgress.length,
    data: contentWithProgress
  });
});

/**
 * @desc    Get content by ID
 * @route   GET /api/courses/:courseId/modules/:moduleId/content/:contentId
 * @access  Private
 */
const getContentById = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  
  // Verify content exists and belongs to the specified module and course
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId
  });
  
  if (!content) {
    throw createApiError.notFound('Content not found');
  }
  
  // Get additional content data based on type
  let contentData = content.toObject();
  
  if (content.contentType === 'quiz' && content.quiz) {
    const quiz = await Quiz.findById(content.quiz).select('-answers');
    if (quiz) {
      contentData.quizData = quiz;
    }
  } else if (content.contentType === 'assignment' && content.assignment) {
    const assignment = await Assignment.findById(content.assignment);
    if (assignment) {
      contentData.assignmentData = assignment;
    }
  }
  
  // Get user progress if enrolled
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });
    
    if (enrollment) {
      const moduleProgress = enrollment.moduleProgress.find(
        mp => mp.moduleId.toString() === moduleId
      );
      
      if (moduleProgress) {
        const contentProgress = moduleProgress.contentProgress.find(
          cp => cp.contentId.toString() === contentId
        );
        
        if (contentProgress) {
          contentData.progress = {
            status: contentProgress.status,
            progress: contentProgress.progress,
            lastAccessDate: contentProgress.lastAccessDate,
            completionDate: contentProgress.completionDate,
            timeSpent: contentProgress.timeSpent
          };
        }
      }
    }
  }
  
  res.status(200).json({
    success: true,
    data: contentData
  });
});

/**
 * @desc    Create content
 * @route   POST /api/courses/:courseId/modules/:moduleId/content
 * @access  Private/Instructor
 */
const createContent = asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.params;
  const contentData = req.body;
  
  // Verify course and module exist
  const course = await Course.findById(courseId);
  if (!course) {
    throw createApiError.notFound('Course not found');
  }
  
  // Verify user is the course instructor or admin
  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createApiError.forbidden('Not authorized to add content to this course');
  }
  
  const module = await Module.findOne({
    _id: moduleId,
    course: courseId
  });
  
  if (!module) {
    throw createApiError.notFound('Module not found');
  }
  
  // If order not specified, add to the end
  if (!contentData.order) {
    const lastContent = await Content.findOne({ module: moduleId })
      .sort({ order: -1 });
    
    contentData.order = lastContent ? lastContent.order + 1 : 0;
  }
  
  // Create content document
  const content = new Content({
    ...contentData,
    course: courseId,
    module: moduleId,
    createdBy: req.user._id
  });
  
  // Create related documents if needed (quiz, assignment)
  if (content.contentType === 'quiz' && contentData.quiz) {
    const quiz = new Quiz({
      title: content.title,
      description: content.description,
      course: courseId,
      module: moduleId,
      questions: contentData.quiz.questions,
      timeLimit: contentData.quiz.timeLimit,
      passingScore: contentData.quiz.passingScore || 70,
      attempts: contentData.quiz.attempts || 3,
      showFeedback: contentData.quiz.showFeedback !== false,
      randomizeQuestions: contentData.quiz.randomizeQuestions || false,
      createdBy: req.user._id
    });
    
    await quiz.save();
    content.quiz = quiz._id;
  } else if (content.contentType === 'assignment' && contentData.assignment) {
    const assignment = new Assignment({
      title: content.title,
      description: content.description,
      course: courseId,
      module: moduleId,
      instructions: contentData.assignment.instructions,
      dueDate: contentData.assignment.dueDate,
      totalPoints: contentData.assignment.totalPoints || 100,
      passingPoints: contentData.assignment.passingPoints || 60,
      allowResubmission: contentData.assignment.allowResubmission || false,
      maxResubmissions: contentData.assignment.maxResubmissions || 1,
      submissionType: contentData.assignment.submissionType || 'file',
      createdBy: req.user._id
    });
    
    await assignment.save();
    content.assignment = assignment._id;
  }
  
  await content.save();
  
  // Update module to include this content
  module.contents.push(content._id);
  await module.save();
  
  res.status(201).json({
    success: true,
    data: content
  });
});

/**
 * @desc    Update content
 * @route   PUT /api/courses/:courseId/modules/:moduleId/content/:contentId
 * @access  Private/Instructor
 */
const updateContent = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  const updateData = req.body;
  
  // Verify course and content ownership
  const course = await Course.findById(courseId);
  if (!course) {
    throw createApiError.notFound('Course not found');
  }
  
  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createApiError.forbidden('Not authorized to update content in this course');
  }
  
  // Find and update content
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId
  });
  
  if (!content) {
    throw createApiError.notFound('Content not found');
  }
  
  // Update related documents if needed
  if (content.contentType === 'quiz' && updateData.quiz && content.quiz) {
    await Quiz.findByIdAndUpdate(content.quiz, {
      title: updateData.title || content.title,
      description: updateData.description || content.description,
      questions: updateData.quiz.questions,
      timeLimit: updateData.quiz.timeLimit,
      passingScore: updateData.quiz.passingScore,
      attempts: updateData.quiz.attempts,
      showFeedback: updateData.quiz.showFeedback,
      randomizeQuestions: updateData.quiz.randomizeQuestions
    });
  } else if (content.contentType === 'assignment' && updateData.assignment && content.assignment) {
    await Assignment.findByIdAndUpdate(content.assignment, {
      title: updateData.title || content.title,
      description: updateData.description || content.description,
      instructions: updateData.assignment.instructions,
      dueDate: updateData.assignment.dueDate,
      totalPoints: updateData.assignment.totalPoints,
      passingPoints: updateData.assignment.passingPoints,
      allowResubmission: updateData.assignment.allowResubmission,
      maxResubmissions: updateData.assignment.maxResubmissions,
      submissionType: updateData.assignment.submissionType
    });
  }
  
  // Fields to exclude from direct update
  const excludeFields = ['_id', 'course', 'module', 'quiz', 'assignment', 'createdBy', 'createdAt'];
  
  // Filter out excluded fields from updateData
  Object.keys(updateData).forEach(key => {
    if (excludeFields.includes(key)) {
      delete updateData[key];
    }
  });
  
  // Update content document
  Object.assign(content, updateData);
  await content.save();
  
  res.status(200).json({
    success: true,
    data: content
  });
});

/**
 * @desc    Delete content
 * @route   DELETE /api/courses/:courseId/modules/:moduleId/content/:contentId
 * @access  Private/Instructor
 */
const deleteContent = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  
  // Verify course ownership
  const course = await Course.findById(courseId);
  if (!course) {
    throw createApiError.notFound('Course not found');
  }
  
  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createApiError.forbidden('Not authorized to delete content from this course');
  }
  
  // Find content
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId
  });
  
  if (!content) {
    throw createApiError.notFound('Content not found');
  }
  
  // Delete related documents if needed
  if (content.contentType === 'quiz' && content.quiz) {
    await Quiz.findByIdAndDelete(content.quiz);
  } else if (content.contentType === 'assignment' && content.assignment) {
    await Assignment.findByIdAndDelete(content.assignment);
  }
  
  // Remove content from module
  await Module.findByIdAndUpdate(moduleId, {
    $pull: { contents: contentId }
  });
  
  // Delete content
  await Content.findByIdAndDelete(contentId);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Reorder content within a module
 * @route   PUT /api/courses/:courseId/modules/:moduleId/content/reorder
 * @access  Private/Instructor
 */
const reorderContent = asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.params;
  const { order } = req.body;
  
  if (!order || !Array.isArray(order)) {
    throw createApiError.badRequest('Order array is required');
  }
  
  // Verify course ownership
  const course = await Course.findById(courseId);
  if (!course) {
    throw createApiError.notFound('Course not found');
  }
  
  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createApiError.forbidden('Not authorized to reorder content in this course');
  }
  
  // Verify module exists
  const module = await Module.findOne({
    _id: moduleId,
    course: courseId
  });
  
  if (!module) {
    throw createApiError.notFound('Module not found');
  }
  
  // Verify all content IDs exist in this module
  const contentCount = await Content.countDocuments({
    _id: { $in: order },
    module: moduleId
  });
  
  if (contentCount !== order.length) {
    throw createApiError.badRequest('Invalid content IDs in order array');
  }
  
  // Update order for each content item
  const updatePromises = order.map((contentId, index) => {
    return Content.findByIdAndUpdate(contentId, { order: index });
  });
  
  await Promise.all(updatePromises);
  
  // Get updated content
  const updatedContent = await Content.find({
    module: moduleId
  }).sort({ order: 1 });
  
  res.status(200).json({
    success: true,
    data: updatedContent
  });
});

/**
 * @desc    Track content progress
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/progress
 * @access  Private
 */
const trackContentProgress = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  const { progress, status, timeSpent } = req.body;
  
  // Validate progress data
  const progressData = {
    userId: req.user._id,
    courseId,
    moduleId,
    contentId,
    progress,
    timeSpent,
    status
  };
  
  const { isValid, errors } = validateProgressUpdate(progressData);
  
  if (!isValid) {
    throw createApiError.validation('Invalid progress data', errors);
  }
  
  // Find enrollment
  const enrollment = await Enrollment.findOne({
    user: req.user._id,
    course: courseId
  });
  
  if (!enrollment) {
    throw createApiError.badRequest('You are not enrolled in this course');
  }
  
  // Find the module progress or create it
  let moduleProgress = enrollment.moduleProgress.find(
    mp => mp.moduleId.toString() === moduleId
  );
  
  if (!moduleProgress) {
    moduleProgress = {
      moduleId,
      progress: 0,
      contentProgress: []
    };
    enrollment.moduleProgress.push(moduleProgress);
  }
  
  // Find the content progress or create it
  let contentProgress = moduleProgress.contentProgress.find(
    cp => cp.contentId.toString() === contentId
  );
  
  if (!contentProgress) {
    contentProgress = {
      contentId,
      status: 'not-started',
      progress: 0,
      timeSpent: 0
    };
    moduleProgress.contentProgress.push(contentProgress);
  }
  
  // Update content progress
  if (progress !== undefined) {
    contentProgress.progress = progress;
  }
  
  if (status) {
    contentProgress.status = status;
  }
  
  if (timeSpent) {
    contentProgress.timeSpent += timeSpent;
  }
  
  contentProgress.lastAccessDate = new Date();
  
  // Mark as completed if progress is 100%
  if (contentProgress.progress >= 100 || status === 'completed') {
    contentProgress.status = 'completed';
    contentProgress.completionDate = contentProgress.completionDate || new Date();
  }
  
  // Update module progress - average of all content progress
  const totalContentCount = moduleProgress.contentProgress.length;
  const completedContent = moduleProgress.contentProgress.filter(
    cp => cp.status === 'completed'
  ).length;
  
  moduleProgress.progress = (completedContent / totalContentCount) * 100;
  
  // Update course progress - average of all module progress
  const totalModuleCount = enrollment.moduleProgress.length;
  const modulesProgressSum = enrollment.moduleProgress.reduce(
    (sum, module) => sum + module.progress, 0
  );
  
  enrollment.progress = modulesProgressSum / totalModuleCount;
  
  // Mark course as completed if progress is 100%
  if (enrollment.progress >= 100) {
    enrollment.status = 'completed';
    enrollment.completionDate = enrollment.completionDate || new Date();
  }
  
  await enrollment.save();
  
  res.status(200).json({
    success: true,
    data: {
      contentProgress,
      moduleProgress: {
        moduleId: moduleProgress.moduleId,
        progress: moduleProgress.progress
      },
      courseProgress: enrollment.progress
    }
  });
});

/**
 * @desc    Submit quiz attempt
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/quiz/submit
 * @access  Private
 */
const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  const { answers } = req.body;
  
  if (!answers || !Array.isArray(answers)) {
    throw createApiError.badRequest('Quiz answers are required');
  }
  
  // Find content and verify it's a quiz
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId,
    contentType: 'quiz'
  });
  
  if (!content || !content.quiz) {
    throw createApiError.notFound('Quiz not found');
  }
  
  // Get the quiz with answers for grading
  const quiz = await Quiz.findById(content.quiz);
  if (!quiz) {
    throw createApiError.notFound('Quiz data not found');
  }
  
  // Grade quiz
  let totalPoints = 0;
  let earnedPoints = 0;
  const gradedAnswers = [];
  
  quiz.questions.forEach(question => {
    const userAnswer = answers.find(a => a.questionId.toString() === question._id.toString());
    totalPoints += question.points;
    
    let isCorrect = false;
    let earnedQuestionPoints = 0;
    
    if (userAnswer) {
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        // For multiple choice, check if selected options match correct options
        isCorrect = userAnswer.selectedOptions &&
          userAnswer.selectedOptions.length > 0 &&
          question.options.every(option => {
            const isOptionSelected = userAnswer.selectedOptions.includes(option._id.toString());
            return option.isCorrect === isOptionSelected;
          });
      } else if (question.type === 'short-answer') {
        // For short answer, do case-insensitive comparison
        isCorrect = userAnswer.answer &&
          userAnswer.answer.toLowerCase() === question.correctAnswer.toLowerCase();
      }
      
      if (isCorrect) {
        earnedQuestionPoints = question.points;
        earnedPoints += earnedQuestionPoints;
      }
      
      gradedAnswers.push({
        questionId: question._id,
        userAnswer: userAnswer.selectedOptions || userAnswer.answer,
        isCorrect,
        earnedPoints: earnedQuestionPoints,
        totalPoints: question.points
      });
    }
  });
  
  // Calculate percentage score
  const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = score >= quiz.passingScore;
  
  // Record quiz attempt
  const attempt = {
    user: req.user._id,
    quiz: quiz._id,
    content: contentId,
    score,
    earnedPoints,
    totalPoints,
    answers: gradedAnswers,
    passed,
    timeSpent: req.body.timeSpent || 0,
    attemptedAt: new Date()
  };
  
  // Add the attempt to the quiz
  quiz.attempts.push(attempt);
  await quiz.save();
  
  // Update enrollment progress if passed
  if (passed) {
    await trackContentProgress(req, res);
  } else {
    res.status(200).json({
      success: true,
      data: {
        score,
        passed,
        earnedPoints,
        totalPoints,
        feedback: quiz.showFeedback ? gradedAnswers : null,
        attemptsRemaining: quiz.attempts - (quiz.attempts.filter(a => 
          a.user.toString() === req.user._id.toString()
        ).length)
      }
    });
  }
});

/**
 * @desc    Submit assignment
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/assignment/submit
 * @access  Private
 */
const submitAssignment = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  const { submission, submissionType } = req.body;
  
  if (!submission) {
    throw createApiError.badRequest('Submission is required');
  }
  
  // Find content and verify it's an assignment
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId,
    contentType: 'assignment'
  });
  
  if (!content || !content.assignment) {
    throw createApiError.notFound('Assignment not found');
  }
  
  // Get the assignment
  const assignment = await Assignment.findById(content.assignment);
  if (!assignment) {
    throw createApiError.notFound('Assignment data not found');
  }
  
  // Check if submission type is allowed
  if (submissionType && assignment.submissionType !== submissionType) {
    throw createApiError.badRequest(`Submission type must be ${assignment.submissionType}`);
  }
  
  // Check due date if set
  if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
    // Allow late submission but mark it as late
    req.body.isLate = true;
  }
  
  // Create submission record
  const submissionRecord = {
    user: req.user._id,
    content: contentId,
    assignment: assignment._id,
    submissionType: submissionType || assignment.submissionType,
    submission,
    isLate: req.body.isLate || false,
    submittedAt: new Date(),
    status: 'submitted'
  };
  
  // Add files if provided
  if (req.files && req.files.length > 0) {
    submissionRecord.files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    }));
  }
  
  // Add submission to assignment
  assignment.submissions.push(submissionRecord);
  await assignment.save();
  
  // Update progress to "in-progress" since assignment needs grading
  req.body.status = 'in-progress';
  req.body.progress = 50; // Set to 50% until graded
  
  await trackContentProgress(req, res);
});

/**
 * @desc    Grade assignment submission
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/assignment/:submissionId/grade
 * @access  Private/Instructor
 */
const gradeAssignment = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId, submissionId } = req.params;
  const { grade, feedback } = req.body;
  
  if (grade === undefined || grade === null) {
    throw createApiError.badRequest('Grade is required');
  }
  
  // Verify course ownership
  const course = await Course.findById(courseId);
  if (!course) {
    throw createApiError.notFound('Course not found');
  }
  
  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createApiError.forbidden('Not authorized to grade assignments in this course');
  }
  
  // Find content and verify it's an assignment
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId,
    contentType: 'assignment'
  });
  
  if (!content || !content.assignment) {
    throw createApiError.notFound('Assignment not found');
  }
  
  // Get the assignment
  const assignment = await Assignment.findById(content.assignment);
  if (!assignment) {
    throw createApiError.notFound('Assignment data not found');
  }
  
  // Find the submission
  const submissionIndex = assignment.submissions.findIndex(
    sub => sub._id.toString() === submissionId
  );
  
  if (submissionIndex === -1) {
    throw createApiError.notFound('Submission not found');
  }
  
  // Update submission
  assignment.submissions[submissionIndex].grade = grade;
  assignment.submissions[submissionIndex].feedback = feedback;
  assignment.submissions[submissionIndex].gradedBy = req.user._id;
  assignment.submissions[submissionIndex].gradedAt = new Date();
  assignment.submissions[submissionIndex].status = 'graded';
  
  // Calculate percentage score
  const score = (grade / assignment.totalPoints) * 100;
  const passed = score >= (assignment.passingPoints / assignment.totalPoints) * 100;
  assignment.submissions[submissionIndex].passed = passed;
  
  await assignment.save();
  
  // Update student progress if passed
  if (passed) {
    // Find enrollment
    const enrollment = await Enrollment.findOne({
      user: assignment.submissions[submissionIndex].user,
      course: courseId
    });
    
    if (enrollment) {
      // Find module progress
      const moduleProgress = enrollment.moduleProgress.find(
        mp => mp.moduleId.toString() === moduleId
      );
      
      if (moduleProgress) {
        // Find content progress
        const contentProgress = moduleProgress.contentProgress.find(
          cp => cp.contentId.toString() === contentId
        );
        
        if (contentProgress) {
          contentProgress.status = 'completed';
          contentProgress.progress = 100;
          contentProgress.completionDate = new Date();
          
          // Update module progress
          const totalContentCount = moduleProgress.contentProgress.length;
          const completedContent = moduleProgress.contentProgress.filter(
            cp => cp.status === 'completed'
          ).length;
          
          moduleProgress.progress = (completedContent / totalContentCount) * 100;
          
          // Update course progress
          const totalModuleCount = enrollment.moduleProgress.length;
          const modulesProgressSum = enrollment.moduleProgress.reduce(
            (sum, module) => sum + module.progress, 0
          );
          
          enrollment.progress = modulesProgressSum / totalModuleCount;
          
          // Mark course as completed if progress is 100%
          if (enrollment.progress >= 100) {
            enrollment.status = 'completed';
            enrollment.completionDate = enrollment.completionDate || new Date();
          }
          
          await enrollment.save();
        }
      }
    }
  }
  
  res.status(200).json({
    success: true,
    data: assignment.submissions[submissionIndex]
  });
});

/**
 * @desc    Get quiz results
 * @route   GET /api/courses/:courseId/modules/:moduleId/content/:contentId/quiz/results
 * @access  Private
 */
const getQuizResults = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  
  // Find content and verify it's a quiz
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId,
    contentType: 'quiz'
  });
  
  if (!content || !content.quiz) {
    throw createApiError.notFound('Quiz not found');
  }
  
  // Get the quiz with attempts
  const quiz = await Quiz.findById(content.quiz);
  if (!quiz) {
    throw createApiError.notFound('Quiz data not found');
  }
  
  // Filter attempts for the current user
  const userAttempts = quiz.attempts.filter(
    attempt => attempt.user.toString() === req.user._id.toString()
  );
  
  // Get best attempt
  const bestAttempt = userAttempts.length > 0 ? 
    userAttempts.reduce((best, current) => 
      current.score > best.score ? current : best
    , userAttempts[0]) : null;
  
  res.status(200).json({
    success: true,
    data: {
      attempts: userAttempts.length,
      maxAttempts: quiz.attempts,
      attemptsRemaining: quiz.attempts - userAttempts.length,
      bestScore: bestAttempt ? bestAttempt.score : 0,
      passed: bestAttempt ? bestAttempt.passed : false,
      latestAttempt: userAttempts.length > 0 ? 
        userAttempts.sort((a, b) => 
          new Date(b.attemptedAt) - new Date(a.attemptedAt)
        )[0] : null
    }
  });
});

/**
 * @desc    Get assignment submissions
 * @route   GET /api/courses/:courseId/modules/:moduleId/content/:contentId/assignment/submissions
 * @access  Private
 */
const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  const isInstructor = req.query.isInstructor === 'true';
  
  // Find content and verify it's an assignment
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId,
    contentType: 'assignment'
  });
  
  if (!content || !content.assignment) {
    throw createApiError.notFound('Assignment not found');
  }
  
  // Get the assignment
  const assignment = await Assignment.findById(content.assignment);
  if (!assignment) {
    throw createApiError.notFound('Assignment data not found');
  }
  
  // If instructor, return all submissions
  if (isInstructor) {
    // Verify the user is the course instructor or admin
    const course = await Course.findById(courseId);
    if (!course) {
      throw createApiError.notFound('Course not found');
    }
    
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw createApiError.forbidden('Not authorized to view all submissions');
    }
    
    // Return all submissions with user info
    const submissions = await Promise.all(assignment.submissions.map(async (sub) => {
      const user = await mongoose.model('User').findById(sub.user).select('firstName lastName email');
      return {
        ...sub.toObject(),
        user
      };
    }));
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } else {
    // Return only the current user's submissions
    const userSubmissions = assignment.submissions.filter(
      sub => sub.user.toString() === req.user._id.toString()
    );
    
    res.status(200).json({
      success: true,
      count: userSubmissions.length,
      data: userSubmissions,
      canSubmit: assignment.allowResubmission || userSubmissions.length === 0
    });
  }
});

/**
 * @desc    Get content comments
 * @route   GET /api/courses/:courseId/modules/:moduleId/content/:contentId/comments
 * @access  Private
 */
const getContentComments = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  
  // Find content
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId
  }).populate({
    path: 'comments.user',
    select: 'firstName lastName profileImage'
  });
  
  if (!content) {
    throw createApiError.notFound('Content not found');
  }
  
  // Verify user is enrolled or instructor
  const isInstructor = await Course.exists({
    _id: courseId,
    instructor: req.user._id
  });
  
  const isEnrolled = await Enrollment.exists({
    course: courseId,
    user: req.user._id
  });
  
  if (!isInstructor && !isEnrolled && req.user.role !== 'admin') {
    throw createApiError.forbidden('Not authorized to view comments');
  }
  
  // Return comments sorted by date
  const comments = content.comments.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  res.status(200).json({
    success: true,
    count: comments.length,
    data: comments
  });
});

/**
 * @desc    Add comment to content
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/comments
 * @access  Private
 */
const addContentComment = asyncHandler(async (req, res) => {
  const { courseId, moduleId, contentId } = req.params;
  const { text } = req.body;
  
  if (!text) {
    throw createApiError.badRequest('Comment text is required');
  }
  
  // Find content
  const content = await Content.findOne({
    _id: contentId,
    module: moduleId,
    course: courseId
  });
  
  if (!content) {
    throw createApiError.notFound('Content not found');
  }
  
  // Verify user is enrolled or instructor
  const isInstructor = await Course.exists({
    _id: courseId,
    instructor: req.user._id
  });
  
  const isEnrolled = await Enrollment.exists({
    course: courseId,
    user: req.user._id
  });
  
  if (!isInstructor && !isEnrolled && req.user.role !== 'admin') {
    throw createApiError.forbidden('Not authorized to add comments');
  }
  
  // Check if comments are allowed for this content
  if (!content.allowComments) {
    throw createApiError.forbidden('Comments are not allowed for this content');
  }
  
  // Add comment
  const comment = {
    user: req.user._id,
    text,
    createdAt: new Date()
  };
  
  content.comments.push(comment);
  await content.save();
  
  // Return the comment with user info
  const populatedContent = await Content.findById(contentId).populate({
    path: 'comments.user',
    select: 'firstName lastName profileImage'
  });
  
  const newComment = populatedContent.comments.find(c => 
    c.user._id.toString() === req.user._id.toString() && 
    c.text === text &&
    Math.abs(new Date(c.createdAt) - new Date()) < 60000 // Added within the last minute
  );
  
  res.status(201).json({
    success: true,
    data: newComment
  });
});

module.exports = {
  getModuleContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  reorderContent,
  trackContentProgress,
  submitQuizAttempt,
  submitAssignment,
  gradeAssignment,
  getQuizResults,
  getAssignmentSubmissions,
  getContentComments,
  addContentComment
};
