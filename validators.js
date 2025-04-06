/**
 * validators.js - Utility functions for validating data
 * These functions help validate various data inputs for client-side validation
 */

/**
 * Check if a value is required (not empty)
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is not empty
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  
  return true;
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if the email is valid
 */
export const validateEmail = (email) => {
  if (!email) return false;
  
  // Basic email regex pattern
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length required (default: 8)
 * @param {boolean} options.requireUppercase - Require at least one uppercase letter (default: true)
 * @param {boolean} options.requireLowercase - Require at least one lowercase letter (default: true)
 * @param {boolean} options.requireNumbers - Require at least one number (default: true)
 * @param {boolean} options.requireSpecialChars - Require at least one special character (default: false)
 * @returns {boolean} - True if the password meets the requirements
 */
export const validatePassword = (
  password,
  {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = {}
) => {
  if (!password) return false;
  
  // Check minimum length
  if (password.length < minLength) {
    return false;
  }
  
  // Check for uppercase letters
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return false;
  }
  
  // Check for lowercase letters
  if (requireLowercase && !/[a-z]/.test(password)) {
    return false;
  }
  
  // Check for numbers
  if (requireNumbers && !/\d/.test(password)) {
    return false;
  }
  
  // Check for special characters
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return false;
  }
  
  return true;
};

/**
 * Validate URL format
 * @param {string} url - The URL to validate
 * @param {boolean} requireHttps - Whether to require HTTPS protocol (default: false)
 * @returns {boolean} - True if the URL is valid
 */
export const validateUrl = (url, requireHttps = false) => {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    
    if (requireHttps && parsedUrl.protocol !== 'https:') {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate phone number format
 * @param {string} phone - The phone number to validate
 * @param {string} countryCode - Country code for validation (default: 'US')
 * @returns {boolean} - True if the phone number is valid
 */
export const validatePhoneNumber = (phone, countryCode = 'US') => {
  if (!phone) return false;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  switch (countryCode) {
    case 'US':
      // US phone numbers should be 10 digits
      return cleaned.length === 10 || (cleaned.length === 11 && cleaned.charAt(0) === '1');
    
    case 'UK':
      // UK phone numbers should be 10-11 digits
      return cleaned.length >= 10 && cleaned.length <= 11;
    
    case 'AU':
      // Australian phone numbers should be 10 digits
      return cleaned.length === 10;
    
    case 'IN':
      // Indian phone numbers should be 10 digits
      return cleaned.length === 10;
    
    default:
      // Default validation: at least 10 digits
      return cleaned.length >= 10;
  }
};

/**
 * Validate date format
 * @param {string|Date} date - The date to validate
 * @param {Object} options - Validation options
 * @param {Date} options.minDate - Minimum allowed date (default: null)
 * @param {Date} options.maxDate - Maximum allowed date (default: null)
 * @returns {boolean} - True if the date is valid
 */
export const validateDate = (
  date,
  { minDate = null, maxDate = null } = {}
) => {
  if (!date) return false;
  
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = new Date(date);
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  // Check min date if provided
  if (minDate && dateObj < minDate) {
    return false;
  }
  
  // Check max date if provided
  if (maxDate && dateObj > maxDate) {
    return false;
  }
  
  return true;
};

/**
 * Validate date range (start date and end date)
 * @param {string|Date} startDate - The start date
 * @param {string|Date} endDate - The end date
 * @returns {boolean} - True if the date range is valid
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  // Check if end date is after start date
  return end >= start;
};

/**
 * Validate file size
 * @param {File|number} file - The file object or file size in bytes
 * @param {number} maxSizeInBytes - Maximum allowed size in bytes
 * @returns {boolean} - True if the file size is valid
 */
export const validateFileSize = (file, maxSizeInBytes) => {
  if (!file || !maxSizeInBytes) return false;
  
  const fileSize = typeof file === 'number' ? file : file.size;
  
  return fileSize <= maxSizeInBytes;
};

/**
 * Validate file type
 * @param {File} file - The file object
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if the file type is valid
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes || !Array.isArray(allowedTypes)) return false;
  
  return allowedTypes.includes(file.type);
};

/**
 * Validate file extension
 * @param {File|string} file - The file object or filename
 * @param {Array} allowedExtensions - Array of allowed file extensions
 * @returns {boolean} - True if the file extension is valid
 */
export const validateFileExtension = (file, allowedExtensions) => {
  if (!file || !allowedExtensions || !Array.isArray(allowedExtensions)) return false;
  
  let fileName = '';
  
  if (typeof file === 'string') {
    fileName = file;
  } else if (file instanceof File) {
    fileName = file.name;
  } else {
    return false;
  }
  
  const extension = fileName.split('.').pop().toLowerCase();
  
  return allowedExtensions.includes(extension);
};

/**
 * Validate number range
 * @param {number} value - The number to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} - True if the number is within the range
 */
export const validateNumberRange = (value, min, max) => {
  if (value === null || value === undefined || isNaN(value)) return false;
  
  const numValue = Number(value);
  
  if (min !== undefined && numValue < min) {
    return false;
  }
  
  if (max !== undefined && numValue > max) {
    return false;
  }
  
  return true;
};

/**
 * Validate string length
 * @param {string} value - The string to validate
 * @param {number} minLength - Minimum length (default: 0)
 * @param {number} maxLength - Maximum length (default: Infinity)
 * @returns {boolean} - True if the string length is valid
 */
export const validateStringLength = (
  value,
  minLength = 0,
  maxLength = Infinity
) => {
  if (value === null || value === undefined) return false;
  
  const strValue = String(value);
  
  return strValue.length >= minLength && strValue.length <= maxLength;
};

/**
 * Validate if a value matches a pattern
 * @param {string} value - The value to validate
 * @param {RegExp|string} pattern - Regular expression pattern
 * @returns {boolean} - True if the value matches the pattern
 */
export const validatePattern = (value, pattern) => {
  if (!value || !pattern) return false;
  
  const regexPattern = pattern instanceof RegExp 
    ? pattern 
    : new RegExp(pattern);
  
  return regexPattern.test(value);
};

/**
 * Validate if an object has all required properties
 * @param {Object} obj - The object to validate
 * @param {Array} requiredProps - Array of required property names
 * @returns {boolean} - True if the object has all required properties
 */
export const validateObjectProperties = (obj, requiredProps) => {
  if (!obj || !requiredProps || !Array.isArray(requiredProps)) return false;
  
  return requiredProps.every(prop => {
    return obj.hasOwnProperty(prop) && obj[prop] !== null && obj[prop] !== undefined;
  });
};

/**
 * Validate if all form fields pass their validation rules
 * @param {Object} fields - Object containing field values
 * @param {Object} rules - Validation rules for each field
 * @returns {Object} - Object with validation results {isValid, errors}
 */
export const validateForm = (fields, rules) => {
  const errors = {};
  
  for (const field in rules) {
    const value = fields[field];
    const fieldRules = rules[field];
    
    for (const rule of fieldRules) {
      const { type, message, options = {} } = rule;
      
      let isValid = true;
      
      switch (type) {
        case 'required':
          isValid = validateRequired(value);
          break;
        
        case 'email':
          isValid = validateEmail(value);
          break;
        
        case 'password':
          isValid = validatePassword(value, options);
          break;
        
        case 'url':
          isValid = validateUrl(value, options.requireHttps);
          break;
        
        case 'phone':
          isValid = validatePhoneNumber(value, options.countryCode);
          break;
        
        case 'date':
          isValid = validateDate(value, options);
          break;
        
        case 'dateRange':
          isValid = validateDateRange(value.startDate, value.endDate);
          break;
        
        case 'fileSize':
          isValid = validateFileSize(value, options.maxSize);
          break;
        
        case 'fileType':
          isValid = validateFileType(value, options.allowedTypes);
          break;
        
        case 'fileExtension':
          isValid = validateFileExtension(value, options.allowedExtensions);
          break;
        
        case 'numberRange':
          isValid = validateNumberRange(value, options.min, options.max);
          break;
        
        case 'stringLength':
          isValid = validateStringLength(value, options.minLength, options.maxLength);
          break;
        
        case 'pattern':
          isValid = validatePattern(value, options.pattern);
          break;
        
        case 'custom':
          isValid = options.validator(value, fields);
          break;
        
        default:
          isValid = true;
      }
      
      if (!isValid) {
        errors[field] = message || `${field} is invalid`;
        break; // Stop checking other rules for this field once one fails
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate credit card number (using Luhn algorithm)
 * @param {string} cardNumber - The credit card number to validate
 * @returns {boolean} - True if the card number is valid
 */
export const validateCreditCardNumber = (cardNumber) => {
  if (!cardNumber) return false;
  
  // Remove all spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Check if the card number only contains digits
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate credit card expiration date
 * @param {number|string} month - Expiration month (1-12)
 * @param {number|string} year - Expiration year (2 or 4 digits)
 * @returns {boolean} - True if the expiration date is valid and not expired
 */
export const validateCardExpiration = (month, year) => {
  if (!month || !year) return false;
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = now.getFullYear();
  
  let expMonth = parseInt(month, 10);
  let expYear = parseInt(year, 10);
  
  // Convert 2-digit year to 4-digit year
  if (expYear < 100) {
    expYear += 2000;
  }
  
  // Check if month is valid
  if (expMonth < 1 || expMonth > 12) {
    return false;
  }
  
  // Check if the card has expired
  return (expYear > currentYear) || (expYear === currentYear && expMonth >= currentMonth);
};

/**
 * Validate CVV (Card Verification Value)
 * @param {string} cvv - The CVV to validate
 * @param {string} cardType - Card type (default: 'other')
 * @returns {boolean} - True if the CVV is valid
 */
export const validateCVV = (cvv, cardType = 'other') => {
  if (!cvv) return false;
  
  // Remove all spaces
  const cleaned = cvv.replace(/\s/g, '');
  
  // Check if the CVV only contains digits
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }
  
  // AMEX requires 4-digit CVV, others use 3-digit CVV
  if (cardType.toLowerCase() === 'amex') {
    return cleaned.length === 4;
  }
  
  return cleaned.length === 3;
};

/**
 * Validate postal code (ZIP code)
 * @param {string} postalCode - The postal code to validate
 * @param {string} countryCode - Country code for validation (default: 'US')
 * @returns {boolean} - True if the postal code is valid
 */
export const validatePostalCode = (postalCode, countryCode = 'US') => {
  if (!postalCode) return false;
  
  const cleaned = postalCode.trim();
  
  switch (countryCode) {
    case 'US':
      // US ZIP code: 5 digits or 5+4 format
      return /^\d{5}(-\d{4})?$/.test(cleaned);
    
    case 'CA':
      // Canadian postal code: A1A 1A1
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(cleaned);
    
    case 'UK':
      // UK postcode
      return /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/.test(cleaned);
    
    case 'AU':
      // Australian postcode: 4 digits
      return /^\d{4}$/.test(cleaned);
    
    default:
      // Default validation: allow alphanumeric and dashes
      return /^[A-Za-z0-9 -]{3,10}$/.test(cleaned);
  }
};

/**
 * Validate username format
 * @param {string} username - The username to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length (default: 3)
 * @param {number} options.maxLength - Maximum length (default: 20)
 * @param {boolean} options.allowSpaces - Allow spaces (default: false)
 * @param {boolean} options.allowSpecialChars - Allow special characters (default: false)
 * @returns {boolean} - True if the username is valid
 */
export const validateUsername = (
  username,
  {
    minLength = 3,
    maxLength = 20,
    allowSpaces = false,
    allowSpecialChars = false
  } = {}
) => {
  if (!username) return false;
  
  if (username.length < minLength || username.length > maxLength) {
    return false;
  }
  
  let pattern = '^[a-zA-Z0-9';
  
  if (allowSpaces) {
    pattern += ' ';
  }
  
  if (allowSpecialChars) {
    pattern += '_\\-\\.@';
  }
  
  pattern += ']+$';
  
  const regex = new RegExp(pattern);
  return regex.test(username);
};

/**
 * Check if all values in an array are unique
 * @param {Array} array - The array to check
 * @returns {boolean} - True if all values are unique
 */
export const validateUniqueArray = (array) => {
  if (!array || !Array.isArray(array)) return false;
  
  return (new Set(array)).size === array.length;
};

export default {
  validateRequired,
  validateEmail,
  validatePassword,
  validateUrl,
  validatePhoneNumber,
  validateDate,
  validateDateRange,
  validateFileSize,
  validateFileType,
  validateFileExtension,
  validateNumberRange,
  validateStringLength,
  validatePattern,
  validateObjectProperties,
  validateForm,
  validateCreditCardNumber,
  validateCardExpiration,
  validateCVV,
  validatePostalCode,
  validateUsername,
  validateUniqueArray
};
