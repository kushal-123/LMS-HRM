/**
 * Error handling middleware for Express.js
 * This middleware captures and formats errors in the application
 */

const { constants } = require('http2');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'API_ERROR', data = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Utility function to create different types of API errors
 */
const createApiError = {
  badRequest: (message, errorCode = 'BAD_REQUEST', data = null) => 
    new ApiError(constants.HTTP_STATUS_BAD_REQUEST, message, errorCode, data),
  
  unauthorized: (message, errorCode = 'UNAUTHORIZED', data = null) => 
    new ApiError(constants.HTTP_STATUS_UNAUTHORIZED, message, errorCode, data),
  
  forbidden: (message, errorCode = 'FORBIDDEN', data = null) => 
    new ApiError(constants.HTTP_STATUS_FORBIDDEN, message, errorCode, data),
  
  notFound: (message, errorCode = 'NOT_FOUND', data = null) => 
    new ApiError(constants.HTTP_STATUS_NOT_FOUND, message, errorCode, data),
  
  conflict: (message, errorCode = 'CONFLICT', data = null) => 
    new ApiError(constants.HTTP_STATUS_CONFLICT, message, errorCode, data),
  
  validation: (message, data = null) => 
    new ApiError(constants.HTTP_STATUS_BAD_REQUEST, message, 'VALIDATION_ERROR', data),
  
  internal: (message, errorCode = 'INTERNAL_SERVER_ERROR', data = null) => 
    new ApiError(constants.HTTP_STATUS_INTERNAL_SERVER_ERROR, message, errorCode, data)
};

/**
 * Error handler for the 404 not found error
 * This middleware should be placed after all routes
 */
const notFoundHandler = (req, res, next) => {
  const error = createApiError.notFound(`Resource not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Main error handler middleware
 * This middleware should be placed at the end of the middleware chain
 */
const errorHandler = (err, req, res, next) => {
  // Log error for internal debugging
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ...(err.data && { data: err.data })
  });
  
  // Set default values if not provided
  const statusCode = err.statusCode || constants.HTTP_STATUS_INTERNAL_SERVER_ERROR;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  
  // Format the error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Something went wrong',
      code: errorCode,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      ...(err.data && { details: err.data })
    },
    timestamp: err.timestamp || new Date().toISOString(),
    path: req.path
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose validation error
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.details = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  } else if (err.name === 'MongoError' && err.code === 11000) {
    // MongoDB duplicate key error
    errorResponse.error.code = 'DUPLICATE_KEY';
    errorResponse.error.message = 'Duplicate key error';
    errorResponse.error.statusCode = constants.HTTP_STATUS_CONFLICT;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    errorResponse.error.code = 'INVALID_TOKEN';
    errorResponse.error.statusCode = constants.HTTP_STATUS_UNAUTHORIZED;
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired error
    errorResponse.error.code = 'TOKEN_EXPIRED';
    errorResponse.error.statusCode = constants.HTTP_STATUS_UNAUTHORIZED;
  }
  
  // Send the response with appropriate status code
  res.status(errorResponse.error.statusCode).json(errorResponse);
};

/**
 * Async handler to catch errors in async route handlers
 * This wrapper eliminates the need for try/catch blocks in route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error handler for express-validator
 * This middleware should be used after validation checks
 */
const validationErrorHandler = (req, res, next) => {
  const { validationErrors } = req;
  
  if (validationErrors && validationErrors.length > 0) {
    const formattedErrors = validationErrors.reduce((acc, error) => {
      acc[error.param] = error.msg;
      return acc;
    }, {});
    
    const error = createApiError.validation('Validation failed', formattedErrors);
    return next(error);
  }
  
  next();
};

/**
 * Database error handler
 * This middleware converts database errors to API errors
 */
const databaseErrorHandler = (err, req, res, next) => {
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    // Handle MongoDB errors
    if (err.code === 11000) {
      // Duplicate key error
      return next(createApiError.conflict('Duplicate key error', 'DUPLICATE_KEY', {
        field: Object.keys(err.keyPattern)[0]
      }));
    }
    
    return next(createApiError.internal('Database error', 'DATABASE_ERROR'));
  }
  
  // Pass other errors to the next handler
  next(err);
};

/**
 * Rate limiting error handler
 * This middleware converts rate limit errors to API errors
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.name === 'RateLimitError' || err.statusCode === 429) {
    return next(createApiError.tooManyRequests('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', {
      retryAfter: err.retryAfter || 60
    }));
  }
  
  // Pass other errors to the next handler
  next(err);
};

/**
 * Authentication error handler
 * This middleware converts authentication errors to API errors
 */
const authErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    let errorCode = 'AUTHENTICATION_ERROR';
    let message = 'Authentication failed';
    
    if (err.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      message = 'Authentication token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN';
      message = 'Invalid authentication token';
    }
    
    return next(createApiError.unauthorized(message, errorCode));
  }
  
  // Pass other errors to the next handler
  next(err);
};

/**
 * Request validation middleware using Joi schemas
 * @param {Object} schema - Joi schema for validation
 * @param {string} property - Request property to validate (body, params, query)
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (!error) {
      return next();
    }
    
    const validationErrors = error.details.reduce((acc, detail) => {
      const key = detail.path.join('.');
      acc[key] = detail.message.replace(/"/g, '');
      return acc;
    }, {});
    
    const err = createApiError.validation('Validation failed', validationErrors);
    next(err);
  };
};

module.exports = {
  ApiError,
  createApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  validationErrorHandler,
  databaseErrorHandler,
  rateLimitErrorHandler,
  authErrorHandler,
  validateRequest
};
