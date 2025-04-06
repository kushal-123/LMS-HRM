/**
 * formatters.js - Utility functions for formatting data
 * These functions help format various data types for display in the UI
 */

/**
 * Format a date with various format options
 * @param {Date|string|number} date - The date to format (Date object, ISO string or timestamp)
 * @param {string} format - The format to use (default: 'MM/DD/YYYY')
 * @returns {string} - The formatted date string
 */
export const formatDate = (date, format = 'MM/DD/YYYY') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  // Replace format tokens with values
  return format
    .replace('YYYY', year)
    .replace('YY', String(year).slice(2))
    .replace('MM', month)
    .replace('M', String(dateObj.getMonth() + 1))
    .replace('DD', day)
    .replace('D', String(dateObj.getDate()))
    .replace('HH', hours)
    .replace('H', String(dateObj.getHours()))
    .replace('mm', minutes)
    .replace('m', String(dateObj.getMinutes()))
    .replace('ss', seconds)
    .replace('s', String(dateObj.getSeconds()));
};

/**
 * Format a number with thousand separators and decimal places
 * @param {number} num - The number to format
 * @param {number} decimal - Number of decimal places (default: 0)
 * @param {string} thousandSeparator - The thousand separator (default: ',')
 * @param {string} decimalSeparator - The decimal separator (default: '.')
 * @returns {string} - The formatted number string
 */
export const formatNumber = (
  num,
  decimal = 0,
  thousandSeparator = ',',
  decimalSeparator = '.'
) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '';
  }
  
  const fixedNum = parseFloat(num).toFixed(decimal);
  const parts = fixedNum.split('.');
  
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  return parts.join(decimalSeparator);
};

/**
 * Format a currency amount
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - The formatted currency string
 */
export const formatCurrency = (
  amount,
  currencyCode = 'USD',
  locale = 'en-US'
) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currencyCode} ${formatNumber(amount, 2)}`;
  }
};

/**
 * Format a percentage value
 * @param {number} value - The value to format as percentage
 * @param {number} decimal - Number of decimal places (default: 1)
 * @param {boolean} includeSymbol - Whether to include the % symbol (default: true)
 * @returns {string} - The formatted percentage string
 */
export const formatPercentage = (value, decimal = 1, includeSymbol = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  
  const formattedValue = formatNumber(value, decimal);
  return includeSymbol ? `${formattedValue}%` : formattedValue;
};

/**
 * Format a file size in bytes to a human-readable format
 * @param {number} bytes - The file size in bytes
 * @param {number} decimal - Number of decimal places (default: 2)
 * @returns {string} - The formatted file size string
 */
export const formatFileSize = (bytes, decimal = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return '';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimal))} ${sizes[i]}`;
};

/**
 * Format a duration in seconds to a human-readable format (HH:MM:SS)
 * @param {number} seconds - The duration in seconds
 * @param {boolean} showSeconds - Whether to show seconds (default: true)
 * @returns {string} - The formatted duration string
 */
export const formatDuration = (seconds, showSeconds = true) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return showSeconds
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
      : `${hours}:${String(minutes).padStart(2, '0')}`;
  } else {
    return showSeconds
      ? `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
      : `${minutes} min`;
  }
};

/**
 * Format a duration in seconds to a human-readable format with words
 * @param {number} seconds - The duration in seconds
 * @returns {string} - The formatted duration string
 */
export const formatDurationWords = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  if (minutes > 0) {
    result += result ? ' ' : '';
    result += `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  
  if (remainingSeconds > 0 && hours === 0) {
    result += result ? ' ' : '';
    result += `${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
  }
  
  return result || '0 seconds';
};

/**
 * Format a name (first name, last name) with various formats
 * @param {Object} params - Name parameters
 * @param {string} params.firstName - First name
 * @param {string} params.lastName - Last name
 * @param {string} params.middleName - Middle name (optional)
 * @param {string} format - Format type: 'full', 'short', 'initial', 'last-first' (default: 'full')
 * @returns {string} - The formatted name
 */
export const formatName = ({ firstName, lastName, middleName }, format = 'full') => {
  if (!firstName && !lastName) return '';
  
  switch (format) {
    case 'full':
      return [firstName, middleName, lastName].filter(Boolean).join(' ');
    
    case 'short':
      return [firstName, lastName].filter(Boolean).join(' ');
    
    case 'initial':
      return [
        firstName ? `${firstName.charAt(0)}.` : '',
        lastName
      ].filter(Boolean).join(' ');
    
    case 'last-first':
      return [
        lastName,
        firstName ? `, ${firstName}` : ''
      ].filter(Boolean).join('');
    
    default:
      return [firstName, lastName].filter(Boolean).join(' ');
  }
};

/**
 * Truncate a string to a specified length and add ellipsis if needed
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length (default: 100)
 * @param {string} ellipsis - Ellipsis string (default: '...')
 * @returns {string} - The truncated string
 */
export const truncateText = (text, length = 100, ellipsis = '...') => {
  if (!text) return '';
  
  if (text.length <= length) {
    return text;
  }
  
  return text.slice(0, length) + ellipsis;
};

/**
 * Format a phone number
 * @param {string} phone - The phone number to format
 * @param {string} format - The format to use (default: '(###) ###-####')
 * @returns {string} - The formatted phone number
 */
export const formatPhoneNumber = (phone, format = '(###) ###-####') => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle international numbers
  if (cleaned.length > 10 && cleaned.startsWith('1')) {
    return formatPhoneNumber(cleaned.slice(1), format);
  }
  
  // Replace # with digits from the phone number
  let formatted = format;
  let charIndex = 0;
  
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] === '#') {
      if (charIndex < cleaned.length) {
        formatted = formatted.substring(0, i) + cleaned[charIndex++] + formatted.substring(i + 1);
      } else {
        formatted = formatted.substring(0, i) + '-' + formatted.substring(i + 1);
      }
    }
  }
  
  return formatted;
};

/**
 * Convert a string to title case (capitalize first letter of each word)
 * @param {string} str - The string to convert
 * @returns {string} - The title case string
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Format a time interval between two dates in a human-readable way
 * @param {Date|string|number} startDate - Start date
 * @param {Date|string|number} endDate - End date
 * @returns {string} - Formatted time interval
 */
export const formatTimeInterval = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error('Invalid date(s):', { startDate, endDate });
    return '';
  }
  
  const diffInSeconds = Math.floor((end - start) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'}`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'}`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'}`;
};

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 * @param {Date|string|number} date - The date to format
 * @returns {string} - Formatted relative time
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const targetDate = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(targetDate.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  const diffInSeconds = Math.floor((targetDate - now) / 1000);
  const isPast = diffInSeconds < 0;
  const absDiff = Math.abs(diffInSeconds);
  
  let result = '';
  
  if (absDiff < 60) {
    result = `${absDiff} ${absDiff === 1 ? 'second' : 'seconds'}`;
  } else if (absDiff < 3600) {
    const minutes = Math.floor(absDiff / 60);
    result = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  } else if (absDiff < 86400) {
    const hours = Math.floor(absDiff / 3600);
    result = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else if (absDiff < 2592000) {
    const days = Math.floor(absDiff / 86400);
    result = `${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (absDiff < 31536000) {
    const months = Math.floor(absDiff / 2592000);
    result = `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    const years = Math.floor(absDiff / 31536000);
    result = `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  
  return isPast ? `${result} ago` : `in ${result}`;
};

/**
 * Format a list of items with separators and conjunction
 * @param {Array} items - The items to format
 * @param {string} conjunction - The conjunction to use for the last item (default: 'and')
 * @param {string} separator - The separator to use between items (default: ', ')
 * @returns {string} - The formatted list
 */
export const formatList = (items, conjunction = 'and', separator = ', ') => {
  if (!items || !Array.isArray(items)) return '';
  
  const filteredItems = items.filter(Boolean);
  
  if (filteredItems.length === 0) return '';
  if (filteredItems.length === 1) return String(filteredItems[0]);
  if (filteredItems.length === 2) return `${filteredItems[0]} ${conjunction} ${filteredItems[1]}`;
  
  const lastItem = filteredItems.pop();
  return `${filteredItems.join(separator)}${separator}${conjunction} ${lastItem}`;
};

/**
 * Create a unique ID with an optional prefix
 * @param {string} prefix - Optional prefix for the ID (default: 'id')
 * @returns {string} - Unique ID
 */
export const createUniqueId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format bytes to bits, kilobits, megabits, etc.
 * @param {number} bytes - The bytes to convert
 * @param {number} decimal - Number of decimal places (default: 2)
 * @returns {string} - Formatted bits string
 */
export const formatBits = (bytes, decimal = 2) => {
  if (bytes === 0) return '0 bits';
  if (!bytes || isNaN(bytes)) return '';
  
  const bits = bytes * 8;
  const k = 1000; // Use 1000 for network speeds (not 1024)
  const sizes = ['bits', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps'];
  const i = Math.floor(Math.log(bits) / Math.log(k));
  
  return `${parseFloat((bits / Math.pow(k, i)).toFixed(decimal))} ${sizes[i]}`;
};

/**
 * Convert RGB color to HEX
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} - HEX color
 */
export const rgbToHex = (r, g, b) => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * Convert HEX color to RGB
 * @param {string} hex - HEX color code
 * @returns {Object|null} - RGB color object or null if invalid
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
};

/**
 * Format a score or grade based on percentage
 * @param {number} score - The score as percentage
 * @param {string} format - Format type: 'letter', 'percentage', 'stars', 'x-out-of-y' (default: 'percentage')
 * @param {number} total - Total possible score for 'x-out-of-y' format (default: 100)
 * @returns {string} - The formatted score
 */
export const formatScore = (score, format = 'percentage', total = 100) => {
  if (score === null || score === undefined || isNaN(score)) {
    return '';
  }
  
  switch (format) {
    case 'letter':
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 70) return 'C';
      if (score >= 60) return 'D';
      return 'F';
    
    case 'stars':
      const stars = Math.round(score / 20); // 5 stars system (100/5 = 20)
      return '★'.repeat(stars) + '☆'.repeat(5 - stars);
    
    case 'x-out-of-y':
      const scoreValue = (score / 100) * total;
      return `${formatNumber(scoreValue, 1)} / ${total}`;
    
    case 'percentage':
    default:
      return formatPercentage(score);
  }
};

export default {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  formatDuration,
  formatDurationWords,
  formatName,
  truncateText,
  formatPhoneNumber,
  toTitleCase,
  formatTimeInterval,
  formatRelativeTime,
  formatList,
  createUniqueId,
  formatBits,
  rgbToHex,
  hexToRgb,
  formatScore
};
