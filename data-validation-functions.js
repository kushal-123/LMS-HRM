/**
 * dataValidation.js - Advanced data validation functions for the LMS module
 * 
 * This file contains specialized validation functions for complex data types
 * and domain-specific validation rules for the Learning Management System.
 */

const Joi = require('joi');

/**
 * Common validation schemas for reuse across the application
 */
const commonSchemas = {
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid ID format'
  }),

  email: Joi.string().email().max(255).messages({
    'string.email': 'Please enter a valid email address',
    'string.max': 'Email address cannot exceed {#limit} characters'
  }),

  password: Joi.string().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).messages({
    'string.min': 'Password must be at least {#limit} characters',
    'string.max': 'Password cannot exceed {#limit} characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }),

  name: Joi.string().min(2).max(100).pattern(/^[A-Za-z\s'\-]+$/).messages({
    'string.min': 'Name must be at least {#limit} characters',
    'string.max': 'Name cannot exceed {#limit} characters',
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes'
  }),

  phoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }),

  url: Joi.string().uri().messages({
    'string.uri': 'Please enter a valid URL'
  }),

  date: Joi.date().iso().messages({
    'date.base': 'Please enter a valid date',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)'
  }),

  duration: Joi.number().integer().min(0).messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be a whole number',
    'number.min': 'Duration cannot be negative'
  }),

  score: Joi.number().min(0).max(100).messages({
    'number.base': 'Score must be a number',
    'number.min': 'Score cannot be less than {#limit}',
    'number.max': 'Score cannot be greater than {#limit}'
  }),

  tags: Joi.array().items(Joi.string().max(50)).max(20).messages({
    'array.base': 'Tags must be an array',
    'array.max': 'Cannot have more than {#limit} tags',
    'string.max': 'Tag cannot exceed {#limit} characters'
  })
};

/**
 * Validation schema for user data
 */
const userSchema = Joi.object({
  firstName: commonSchemas.name.required(),
  lastName: commonSchemas.name.required(),
  email: commonSchemas.email.required(),
  password: commonSchemas.password.when('$isUpdate', {
    is: true,
    then: Joi.string().optional().allow(''),
    otherwise: Joi.required()
  }),
  department: commonSchemas.objectId.required(),
  role: commonSchemas.objectId.required(),
  phoneNumber: commonSchemas.phoneNumber.optional().allow(''),
  profileImage: Joi.string().optional().allow(''),
  bio: Joi.string().max(500).optional().allow(''),
  isActive: Joi.boolean().default(true),
  skills: Joi.array().items(
    Joi.object({
      skillId: commonSchemas.objectId.required(),
      level: Joi.number().integer().min(1).max(5).required()
    })
  ).optional(),
  preferences: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      push: Joi.boolean().default(true),
      sms: Joi.boolean().default(false)
    }).optional(),
    theme: Joi.string().valid('light', 'dark', 'system').default('system'),
    language: Joi.string().valid('en', 'es', 'fr', 'de').default('en')
  }).optional()
}).options({ stripUnknown: true });

/**
 * Validation schema for course data
 */
const courseSchema = Joi.object({
  title: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Course title must be at least {#limit} characters',
    'string.max': 'Course title cannot exceed {#limit} characters',
    'any.required': 'Course title is required'
  }),
  description: Joi.string().min(20).max(5000).required().messages({
    'string.min': 'Course description must be at least {#limit} characters',
    'string.max': 'Course description cannot exceed {#limit} characters',
    'any.required': 'Course description is required'
  }),
  thumbnail: Joi.string().uri().optional(),
  category: commonSchemas.objectId.required(),
  subcategory: commonSchemas.objectId.optional(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
  prerequisites: Joi.array().items(commonSchemas.objectId).optional(),
  duration: Joi.number().integer().min(1).required().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be a whole number',
    'number.min': 'Duration must be at least {#limit} minute',
    'any.required': 'Course duration is required'
  }),
  tags: commonSchemas.tags,
  instructor: commonSchemas.objectId.required(),
  coInstructors: Joi.array().items(commonSchemas.objectId).optional(),
  isPublished: Joi.boolean().default(false),
  publishDate: Joi.date().iso().when('isPublished', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  modules: Joi.array().items(
    Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(1000).optional().allow(''),
      order: Joi.number().integer().min(0).required(),
      isPublished: Joi.boolean().default(false),
      contents: Joi.array().items(
        Joi.object({
          title: Joi.string().min(3).max(200).required(),
          contentType: Joi.string().valid(
            'video', 'document', 'quiz', 'assignment', 'webinar', 'survey', 'interactive'
          ).required(),
          url: Joi.string().uri().when('contentType', {
            is: Joi.valid('video', 'document'),
            then: Joi.required(),
            otherwise: Joi.optional()
          }),
          duration: Joi.number().integer().min(0).when('contentType', {
            is: Joi.valid('video', 'webinar'),
            then: Joi.required(),
            otherwise: Joi.optional()
          }),
          order: Joi.number().integer().min(0).required(),
          isOptional: Joi.boolean().default(false),
          isPublished: Joi.boolean().default(false)
        })
      ).optional()
    })
  ).min(1).required().messages({
    'array.min': 'Course must have at least one module',
    'any.required': 'Course modules are required'
  })
}).options({ stripUnknown: true });

/**
 * Validation schema for quiz data
 */
const quizSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(1000).optional().allow(''),
  courseId: commonSchemas.objectId.required(),
  moduleId: commonSchemas.objectId.required(),
  timeLimit: Joi.number().integer().min(0).optional(),
  passingScore: Joi.number().min(0).max(100).default(70),
  attempts: Joi.number().integer().min(1).default(3),
  randomizeQuestions: Joi.boolean().default(false),
  showFeedback: Joi.boolean().default(true),
  isPublished: Joi.boolean().default(false),
  questions: Joi.array().items(
    Joi.object({
      text: Joi.string().min(3).max(1000).required(),
      type: Joi.string().valid('multiple-choice', 'true-false', 'short-answer', 'matching').required(),
      points: Joi.number().integer().min(1).default(1),
      options: Joi.array().items(
        Joi.object({
          text: Joi.string().min(1).max(500).required(),
          isCorrect: Joi.boolean().required()
        })
      ).when('type', {
        is: Joi.valid('multiple-choice', 'true-false', 'matching'),
        then: Joi.array().min(2).required(),
        otherwise: Joi.optional()
      }),
      correctAnswer: Joi.string().max(500).when('type', {
        is: 'short-answer',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      explanation: Joi.string().max(1000).optional().allow('')
    })
  ).min(1).required().messages({
    'array.min': 'Quiz must have at least one question',
    'any.required': 'Quiz questions are required'
  })
}).options({ stripUnknown: true });

/**
 * Validation schema for assignment data
 */
const assignmentSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(5000).required(),
  courseId: commonSchemas.objectId.required(),
  moduleId: commonSchemas.objectId.required(),
  dueDate: Joi.date().iso().greater('now').optional(),
  totalPoints: Joi.number().integer().min(1).default(100),
  passingPoints: Joi.number().integer().min(0).max(Joi.ref('totalPoints')).default(60),
  instructions: Joi.string().min(20).max(10000).required(),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().uri().required(),
      type: Joi.string().required(),
      size: Joi.number().integer().min(0).required()
    })
  ).optional(),
  rubric: Joi.array().items(
    Joi.object({
      criterion: Joi.string().min(3).max(200).required(),
      weight: Joi.number().min(0).max(100).required(),
      levels: Joi.array().items(
        Joi.object({
          description: Joi.string().min(3).max(500).required(),
          points: Joi.number().min(0).required()
        })
      ).min(2).required()
    })
  ).optional(),
  allowResubmission: Joi.boolean().default(false),
  maxResubmissions: Joi.number().integer().min(1).default(1).when('allowResubmission', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  submissionTypes: Joi.array().items(
    Joi.string().valid('file', 'text', 'url', 'media')
  ).min(1).required(),
  isGroupAssignment: Joi.boolean().default(false),
  maxGroupSize: Joi.number().integer().min(2).default(5).when('isGroupAssignment', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  isPublished: Joi.boolean().default(false)
}).options({ stripUnknown: true });

/**
 * Validation schema for learning path data
 */
const learningPathSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(5000).required(),
  thumbnail: Joi.string().uri().optional(),
  category: commonSchemas.objectId.required(),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
  estimatedDuration: Joi.number().integer().min(1).required(),
  tags: commonSchemas.tags,
  creator: commonSchemas.objectId.required(),
  isPublished: Joi.boolean().default(false),
  targetAudience: Joi.string().max(1000).optional().allow(''),
  prerequisites: Joi.string().max(1000).optional().allow(''),
  learningObjectives: Joi.array().items(Joi.string().max(500)).optional(),
  steps: Joi.array().items(
    Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(1000).optional().allow(''),
      order: Joi.number().integer().min(0).required(),
      resourceType: Joi.string().valid('course', 'webinar', 'external', 'assessment').required(),
      resourceId: Joi.alternatives().conditional('resourceType', {
        is: Joi.valid('course', 'webinar', 'assessment'),
        then: commonSchemas.objectId.required(),
        otherwise: Joi.optional()
      }),
      externalUrl: Joi.string().uri().when('resourceType', {
        is: 'external',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      duration: Joi.number().integer().min(1).required(),
      isOptional: Joi.boolean().default(false)
    })
  ).min(1).required().messages({
    'array.min': 'Learning path must have at least one step',
    'any.required': 'Learning path steps are required'
  })
}).options({ stripUnknown: true });

/**
 * Validation schema for webinar data
 */
const webinarSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(5000).required(),
  thumbnail: Joi.string().uri().optional(),
  category: commonSchemas.objectId.required(),
  startDate: Joi.date().iso().greater('now').required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  timezone: Joi.string().required(),
  host: commonSchemas.objectId.required(),
  coHosts: Joi.array().items(commonSchemas.objectId).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  registrationDeadline: Joi.date().iso().less(Joi.ref('startDate')).optional(),
  isRecorded: Joi.boolean().default(true),
  recordingUrl: Joi.string().uri().when('isRecorded', {
    is: true,
    then: Joi.optional(),
    otherwise: Joi.optional().allow('')
  }),
  zoomMeetingId: Joi.string().optional().allow(''),
  zoomPassword: Joi.string().optional().allow(''),
  tags: commonSchemas.tags,
  materials: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().uri().required(),
      type: Joi.string().required()
    })
  ).optional(),
  isPublished: Joi.boolean().default(false),
  sendReminders: Joi.boolean().default(true),
  reminderTimes: Joi.array().items(
    Joi.number().integer().min(1).max(72)
  ).when('sendReminders', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
}).options({ stripUnknown: true });

/**
 * Validation schema for badge data
 */
const badgeSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  image: Joi.string().uri().required(),
  category: Joi.string().valid('achievement', 'skill', 'participation', 'completion').required(),
  level: Joi.string().valid('bronze', 'silver', 'gold', 'platinum').default('bronze'),
  points: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
  requirements: Joi.object({
    type: Joi.string().valid(
      'course-completion', 'learning-path-completion', 'quiz-score', 'assignment-score',
      'course-count', 'forum-participation', 'streak', 'custom'
    ).required(),
    courseId: commonSchemas.objectId.when('type', {
      is: Joi.valid('course-completion', 'quiz-score', 'assignment-score'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    learningPathId: commonSchemas.objectId.when('type', {
      is: 'learning-path-completion',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    minScore: Joi.number().min(0).max(100).when('type', {
      is: Joi.valid('quiz-score', 'assignment-score'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    courseCount: Joi.number().integer().min(1).when('type', {
      is: 'course-count',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    postCount: Joi.number().integer().min(1).when('type', {
      is: 'forum-participation',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    streakDays: Joi.number().integer().min(1).when('type', {
      is: 'streak',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    customDescription: Joi.string().max(1000).when('type', {
      is: 'custom',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }).required()
}).options({ stripUnknown: true });

/**
 * Validation schema for enrollment data
 */
const enrollmentSchema = Joi.object({
  userId: commonSchemas.objectId.required(),
  courseId: commonSchemas.objectId.required(),
  enrollmentDate: Joi.date().iso().default(Date.now),
  expirationDate: Joi.date().iso().greater('now').optional(),
  progress: Joi.number().min(0).max(100).default(0),
  status: Joi.string().valid('active', 'completed', 'expired', 'withdrawn').default('active'),
  completionDate: Joi.date().iso().optional(),
  certificateId: Joi.string().optional(),
  lastAccessDate: Joi.date().iso().optional(),
  moduleProgress: Joi.array().items(
    Joi.object({
      moduleId: commonSchemas.objectId.required(),
      progress: Joi.number().min(0).max(100).default(0),
      completionDate: Joi.date().iso().optional(),
      contentProgress: Joi.array().items(
        Joi.object({
          contentId: commonSchemas.objectId.required(),
          status: Joi.string().valid('not-started', 'in-progress', 'completed').default('not-started'),
          progress: Joi.number().min(0).max(100).default(0),
          lastAccessDate: Joi.date().iso().optional(),
          completionDate: Joi.date().iso().optional(),
          timeSpent: Joi.number().integer().min(0).default(0)
        })
      ).optional()
    })
  ).optional(),
  score: Joi.number().min(0).max(100).optional(),
  feedback: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    comment: Joi.string().max(2000).optional().allow(''),
    submittedAt: Joi.date().iso().optional()
  }).optional(),
  nota: Joi.array().items(
    Joi.object({
      note: Joi.string().max(2000).required(),
      timestamp: Joi.date().iso().default(Date.now),
      contentId: commonSchemas.objectId.optional()
    })
  ).optional()
}).options({ stripUnknown: true });

/**
 * Validation schema for analytics query parameters
 */
const analyticsQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).when('startDate', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  courseId: commonSchemas.objectId.optional(),
  userId: commonSchemas.objectId.optional(),
  department: commonSchemas.objectId.optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'year', 'course', 'department', 'user').optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  page: Joi.number().integer().min(1).default(1),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  filters: Joi.object().pattern(
    Joi.string(),
    [Joi.string(), Joi.number(), Joi.boolean(), Joi.array()]
  ).optional()
}).options({ stripUnknown: true });

/**
 * Validation schema for certificate template data
 */
const certificateTemplateSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000).optional().allow(''),
  template: Joi.string().required(),
  variables: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().optional(),
      defaultValue: Joi.string().optional()
    })
  ).required(),
  orientation: Joi.string().valid('portrait', 'landscape').default('landscape'),
  dimensions: Joi.object({
    width: Joi.number().required(),
    height: Joi.number().required()
  }).required(),
  isActive: Joi.boolean().default(true),
  createdBy: commonSchemas.objectId.required()
}).options({ stripUnknown: true });

/**
 * Validation schema for certificate data
 */
const certificateSchema = Joi.object({
  userId: commonSchemas.objectId.required(),
  courseId: commonSchemas.objectId.optional(),
  learningPathId: commonSchemas.objectId.optional(),
  templateId: commonSchemas.objectId.required(),
  title: Joi.string().min(3).max(200).required(),
  issueDate: Joi.date().iso().default(Date.now),
  expirationDate: Joi.date().iso().greater('now').optional(),
  certificateNumber: Joi.string().required(),
  variables: Joi.object().pattern(
    Joi.string(),
    Joi.string()
  ).required(),
  downloadUrl: Joi.string().uri().optional(),
  isRevoked: Joi.boolean().default(false),
  revocationReason: Joi.string().max(1000).when('isRevoked', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow('')
  }),
  verificationCode: Joi.string().required()
}).options({ stripUnknown: true });

/**
 * Custom validation functions for different data types
 */

/**
 * Validate course data
 * @param {Object} courseData - Course data to validate
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateCourse = (courseData) => {
  const validation = courseSchema.validate(courseData, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateUser = (userData, isUpdate = false) => {
  const validation = userSchema.validate(userData, {
    abortEarly: false,
    context: { isUpdate }
  });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate quiz data
 * @param {Object} quizData - Quiz data to validate
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateQuiz = (quizData) => {
  const validation = quizSchema.validate(quizData, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  // Additional validation for multiple-choice questions
  const multipleChoiceQuestions = quizData.questions.filter(q => q.type === 'multiple-choice');
  const invalidQuestions = multipleChoiceQuestions.filter(q => {
    const correctOptions = q.options.filter(option => option.isCorrect);
    return correctOptions.length === 0;
  });
  
  if (invalidQuestions.length > 0) {
    return {
      isValid: false,
      errors: {
        questions: 'Each multiple-choice question must have at least one correct answer'
      }
    };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate learning path data
 * @param {Object} pathData - Learning path data to validate
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateLearningPath = (pathData) => {
  const validation = learningPathSchema.validate(pathData, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  // Check for duplicate resource IDs
  const resourceIds = pathData.steps
    .filter(step => step.resourceType !== 'external')
    .map(step => step.resourceId);
  
  const uniqueResourceIds = new Set(resourceIds);
  
  if (uniqueResourceIds.size !== resourceIds.length) {
    return {
      isValid: false,
      errors: {
        steps: 'Learning path cannot contain duplicate resources'
      }
    };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate certificate data
 * @param {Object} certificateData - Certificate data to validate
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateCertificate = (certificateData) => {
  // Ensure either courseId or learningPathId is provided, but not both
  if (!certificateData.courseId && !certificateData.learningPathId) {
    return {
      isValid: false,
      errors: {
        general: 'Either courseId or learningPathId must be provided'
      }
    };
  }
  
  if (certificateData.courseId && certificateData.learningPathId) {
    return {
      isValid: false,
      errors: {
        general: 'Certificate cannot be associated with both a course and a learning path'
      }
    };
  }
  
  const validation = certificateSchema.validate(certificateData, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate enrollment data
 * @param {Object} enrollmentData - Enrollment data to validate
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateEnrollment = (enrollmentData) => {
  const validation = enrollmentSchema.validate(enrollmentData, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate analytics query parameters
 * @param {Object} queryParams - Query parameters to validate
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateAnalyticsQuery = (queryParams) => {
  const validation = analyticsQuerySchema.validate(queryParams, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate file upload against allowed types and size limits
 * @param {Object} file - File object (with mimetype and size properties)
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result {isValid, error}
 */
const validateFileUpload = (file, options = {}) => {
  const defaultOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  };
  
  const validationOptions = { ...defaultOptions, ...options };
  
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  if (file.size > validationOptions.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds the limit of ${validationOptions.maxSize / (1024 * 1024)}MB`
    };
  }
  
  if (!validationOptions.allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${validationOptions.allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
};

/**
 * Extract formatted error messages from Joi validation error
 * @param {Object} joiError - Joi validation error object
 * @returns {Object} - Formatted error messages
 */
const extractJoiErrors = (joiError) => {
  if (!joiError || !joiError.details) return {};
  
  return joiError.details.reduce((errors, error) => {
    const key = error.path.join('.');
    errors[key] = error.message.replace(/"/g, '');
    return errors;
  }, {});
};

/**
 * Validate a progress update to prevent invalid values
 * @param {Object} progressData - Progress update data
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateProgressUpdate = (progressData) => {
  const progressSchema = Joi.object({
    userId: commonSchemas.objectId.required(),
    courseId: commonSchemas.objectId.required(),
    moduleId: commonSchemas.objectId.optional(),
    contentId: commonSchemas.objectId.optional(),
    progress: Joi.number().min(0).max(100).required(),
    timeSpent: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('not-started', 'in-progress', 'completed').optional()
  }).options({ stripUnknown: true });
  
  const validation = progressSchema.validate(progressData, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate feedback data for a course or learning path
 * @param {Object} feedbackData - Feedback data
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateFeedback = (feedbackData) => {
  const feedbackSchema = Joi.object({
    userId: commonSchemas.objectId.required(),
    resourceId: commonSchemas.objectId.required(),
    resourceType: Joi.string().valid('course', 'learning-path', 'webinar').required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(2000).optional().allow(''),
    categories: Joi.object({
      content: Joi.number().integer().min(1).max(5).optional(),
      instructor: Joi.number().integer().min(1).max(5).optional(),
      materials: Joi.number().integer().min(1).max(5).optional(),
      experience: Joi.number().integer().min(1).max(5).optional()
    }).optional(),
    isAnonymous: Joi.boolean().default(false),
    submittedAt: Joi.date().iso().default(Date.now)
  }).options({ stripUnknown: true });
  
  const validation = feedbackSchema.validate(feedbackData, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  return { isValid: true, data: validation.value };
};

/**
 * Validate badge awarding data
 * @param {Object} awardData - Badge award data
 * @returns {Object} - Validation result {isValid, errors}
 */
const validateBadgeAward = (awardData) => {
  const awardSchema = Joi.object({
    userId: commonSchemas.objectId.required(),
    badgeId: commonSchemas.objectId.required(),
    awardedBy: commonSchemas.objectId.required(),
    awardedAt: Joi.date().iso().default(Date.now),
    reason: Joi.string().max(1000).optional().allow(''),
    associatedResource: Joi.object({
      type: Joi.string().valid('course', 'learning-path', 'quiz', 'assignment').required(),
      id: commonSchemas.objectId.required()
    }).optional()
  }).options({ stripUnknown: true });
  
  const validation = awardSchema.validate(awardData, { abortEarly: false });
  
  if (validation.error) {
    const errors = extractJoiErrors(validation.error);
    return { isValid: false, errors };
  }
  
  return { isValid: true, data: validation.value };
};

module.exports = {
  // Validation schemas
  commonSchemas,
  userSchema,
  courseSchema,
  quizSchema,
  assignmentSchema,
  learningPathSchema,
  webinarSchema,
  badgeSchema,
  enrollmentSchema,
  analyticsQuerySchema,
  certificateTemplateSchema,
  certificateSchema,
  
  // Validation functions
  validateCourse,
  validateUser,
  validateQuiz,
  validateLearningPath,
  validateCertificate,
  validateEnrollment,
  validateAnalyticsQuery,
  validateFileUpload,
  validateProgressUpdate,
  validateFeedback,
  validateBadgeAward,
  
  // Helper functions
  extractJoiErrors
};
