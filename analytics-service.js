/**
 * Analytics Service
 * Handles API calls for analytics data
 */

import axios from 'axios';

const API_URL = '/api/analytics';

/**
 * Get dashboard analytics
 * @param {Object} params - Query parameters
 * @param {string} params.timeframe - Time frame (day, week, month, year, all)
 * @param {string} params.departmentId - Department ID
 * @returns {Promise} - Promise with analytics data
 */
export const getDashboardAnalytics = async ({ timeframe = 'month', departmentId } = {}) => {
  let url = `${API_URL}/dashboard?timeframe=${timeframe}`;
  
  if (departmentId) {
    url += `&departmentId=${departmentId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Get course analytics
 * @param {string} courseId - Course ID
 * @param {Object} params - Query parameters
 * @param {string} params.timeframe - Time frame
 * @returns {Promise} - Promise with course analytics data
 */
export const getCourseAnalytics = async (courseId, { timeframe = 'all' } = {}) => {
  const response = await axios.get(`${API_URL}/courses/${courseId}?timeframe=${timeframe}`);
  return response.data.data;
};

/**
 * Get user analytics
 * @param {string} userId - User ID (optional, defaults to current user)
 * @param {Object} params - Query parameters
 * @param {string} params.timeframe - Time frame
 * @returns {Promise} - Promise with user analytics data
 */
export const getUserAnalytics = async (userId = 'me', { timeframe = 'month' } = {}) => {
  const response = await axios.get(`${API_URL}/users/${userId}?timeframe=${timeframe}`);
  return response.data.data;
};

/**
 * Get learning path analytics
 * @param {string} learningPathId - Learning path ID (optional)
 * @param {Object} params - Query parameters
 * @param {string} params.timeframe - Time frame
 * @returns {Promise} - Promise with learning path analytics data
 */
export const getLearningPathAnalytics = async (learningPathId, { timeframe = 'month' } = {}) => {
  let url = `${API_URL}/learning-paths`;
  
  if (learningPathId) {
    url += `/${learningPathId}`;
  }
  
  url += `?timeframe=${timeframe}`;
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Get enrollment analytics
 * @param {Object} params - Query parameters
 * @param {string} params.timeframe - Time frame
 * @param {string} params.departmentId - Department ID
 * @param {string} params.courseId - Course ID
 * @returns {Promise} - Promise with enrollment analytics data
 */
export const getEnrollmentAnalytics = async ({ 
  timeframe = 'month', 
  departmentId, 
  courseId 
} = {}) => {
  let url = `${API_URL}/enrollments?timeframe=${timeframe}`;
  
  if (departmentId) {
    url += `&departmentId=${departmentId}`;
  }
  
  if (courseId) {
    url += `&courseId=${courseId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Get completion rate analytics
 * @param {Object} params - Query parameters
 * @param {string} params.timeframe - Time frame
 * @param {string} params.groupBy - Group by field (course, department, etc.)
 * @param {string} params.departmentId - Department ID
 * @returns {Promise} - Promise with completion rate analytics data
 */
export const getCompletionRateAnalytics = async ({ 
  timeframe = 'month', 
  groupBy = 'course', 
  departmentId 
} = {}) => {
  let url = `${API_URL}/completion-rates?timeframe=${timeframe}&groupBy=${groupBy}`;
  
  if (departmentId) {
    url += `&departmentId=${departmentId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Get engagement analytics
 * @param {Object} params - Query parameters
 * @param {string} params.timeframe - Time frame
 * @param {string} params.departmentId - Department ID
 * @param {string} params.courseId - Course ID
 * @returns {Promise} - Promise with engagement analytics data
 */
export const getEngagementAnalytics = async ({ 
  timeframe = 'month', 
  departmentId, 
  courseId 
} = {}) => {
  let url = `${API_URL}/engagement?timeframe=${timeframe}`;
  
  if (departmentId) {
    url += `&departmentId=${departmentId}`;
  }
  
  if (courseId) {
    url += `&courseId=${courseId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Generate analytics report
 * @param {Object} reportData - Report parameters
 * @param {string} reportData.reportType - Report type
 * @param {string} reportData.startDate - Start date
 * @param {string} reportData.endDate - End date
 * @param {string} reportData.department - Department ID
 * @param {string} reportData.format - Report format (pdf, excel, csv)
 * @param {Object} reportData.filters - Additional filters
 * @returns {Promise} - Promise with report data or URL
 */
export const generateReport = async ({ 
  reportType, 
  startDate, 
  endDate, 
  department, 
  format = 'pdf',
  filters = {} 
}) => {
  const response = await axios.post(`${API_URL}/reports`, {
    reportType,
    startDate,
    endDate,
    department,
    format,
    filters
  });
  
  return response.data.data;
};

/**
 * Export analytics data
 * @param {Object} exportData - Export parameters
 * @param {string} exportData.dataType - Data type to export
 * @param {string} exportData.format - Export format (csv, excel, json)
 * @param {Object} exportData.filters - Filters to apply
 * @param {string} exportData.timeframe - Time frame
 * @returns {Promise} - Promise with response for file download
 */
export const exportAnalyticsData = async ({ 
  dataType,
  format = 'csv',
  filters = {},
  timeframe = 'month'
}) => {
  try {
    const response = await axios.post(`${API_URL}/export`, {
      dataType,
      format,
      filters,
      timeframe
    }, {
      responseType: 'blob'
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dataType}-analytics.${format}`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    return { 
      success: true,
      dataType,
      format,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
};

export default {
  getDashboardAnalytics,
  getCourseAnalytics,
  getUserAnalytics,
  getLearningPathAnalytics,
  getEnrollmentAnalytics,
  getCompletionRateAnalytics,
  getEngagementAnalytics,
  generateReport,
  exportAnalyticsData
};
