/**
 * Content Routes
 * Handles API routes for content management
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const contentController = require('../controllers/contentController');
const { protect, authorize } = require('../config/middleware');
const { uploadContent } = require('../utils/fileUpload');

// Base route is /api/courses/:courseId/modules/:moduleId/content

/**
 * @route   GET /api/courses/:courseId/modules/:moduleId/content
 * @desc    Get all content for a module
 * @access  Private
 */
router.get('/', protect, contentController.getModuleContent);

/**
 * @route   GET /api/courses/:courseId/modules/:moduleId/content/:contentId
 * @desc    Get content by ID
 * @access  Private
 */
router.get('/:contentId', protect, contentController.getContentById);

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/content
 * @desc    Create content
 * @access  Private/Instructor
 */
router.post(
  '/',
  protect,
  authorize('instructor', 'admin'),
  contentController.createContent
);

/**
 * @route   PUT /api/courses/:courseId/modules/:moduleId/content/:contentId
 * @desc    Update content
 * @access  Private/Instructor
 */
router.put(
  '/:contentId',
  protect,
  authorize('instructor', 'admin'),
  contentController.updateContent
);

/**
 * @route   DELETE /api/courses/:courseId/modules/:moduleId/content/:contentId
 * @desc    Delete content
 * @access  Private/Instructor
 */
router.delete(
  '/:contentId',
  protect,
  authorize('instructor', 'admin'),
  contentController.deleteContent
);

/**
 * @route   PUT /api/courses/:courseId/modules/:moduleId/content/reorder
 * @desc    Reorder content within a module
 * @access  Private/Instructor
 */
router.put(
  '/reorder',
  protect,
  authorize('instructor', 'admin'),
  contentController.reorderContent
);

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/progress
 * @desc    Track content progress
 * @access  Private
 */
router.post(
  '/:contentId/progress',
  protect,
  contentController.trackContentProgress
);

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/quiz/submit
 * @desc    Submit quiz attempt
 * @access  Private
 */
router.post(
  '/:contentId/quiz/submit',
  protect,
  contentController.submitQuizAttempt
);

/**
 * @route   GET /api/courses/:courseId/modules/:moduleId/content/:contentId/quiz/results
 * @desc    Get quiz results
 * @access  Private
 */
router.get(
  '/:contentId/quiz/results',
  protect,
  contentController.getQuizResults
);

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/assignment/submit
 * @desc    Submit assignment
 * @access  Private
 */
router.post(
  '/:contentId/assignment/submit',
  protect,
  uploadContent.array('files', 5), // Allow up to 5 files
  contentController.submitAssignment
);

/**
 * @route   GET /api/courses/:courseId/modules/:moduleId/content/:contentId/assignment/submissions
 * @desc    Get assignment submissions
 * @access  Private
 */
router.get(
  '/:contentId/assignment/submissions',
  protect,
  contentController.getAssignmentSubmissions
);

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/assignment/:submissionId/grade
 * @desc    Grade assignment submission
 * @access  Private/Instructor
 */
router.post(
  '/:contentId/assignment/:submissionId/grade',
  protect,
  authorize('instructor', 'admin'),
  contentController.gradeAssignment
);

/**
 * @route   GET /api/courses/:courseId/modules/:moduleId/content/:contentId/comments
 * @desc    Get content comments
 * @access  Private
 */
router.get(
  '/:contentId/comments',
  protect,
  contentController.getContentComments
);

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/comments
 * @desc    Add comment to content
 * @access  Private
 */
router.post(
  '/:contentId/comments',
  protect,
  contentController.addContentComment
);

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/upload
 * @desc    Upload files for content
 * @access  Private/Instructor
 */
router.post(
  '/:contentId/upload',
  protect,
  authorize('instructor', 'admin'),
  uploadContent.array('files', 5),
  (req, res) => {
    // File URLs will be available in req.files
    const fileUrls = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      size: file.size,
      type: file.mimetype
    }));
    
    res.status(200).json({
      success: true,
      data: fileUrls
    });
  }
);

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/content/:contentId/track
 * @desc    Track content viewing (time spent, etc.)
 * @access  Private
 */
router.post(
  '/:contentId/track',
  protect,
  (req, res, next) => {
    // Combine with progress tracking
    req.body.status = req.body.status || 'in-progress';
    next();
  },
  contentController.trackContentProgress
);

module.exports = router;
