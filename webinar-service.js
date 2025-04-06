/**
 * Webinar Service
 * Handles API calls for webinar features
 */

import axios from 'axios';

const API_URL = '/api/webinars';

/**
 * Get all webinars with optional filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of webinars per page
 * @param {string} params.search - Search term
 * @param {string} params.category - Category filter
 * @param {string} params.status - Status filter (upcoming, live, past)
 * @param {string} params.sortBy - Sort field
 * @returns {Promise} - Promise with webinars data
 */
export const getWebinars = async ({ page = 1, limit = 10, search, category, status, sortBy } = {}) => {
  let url = `${API_URL}?page=${page}&limit=${limit}`;
  
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  if (category) {
    url += `&category=${category}`;
  }
  
  if (status) {
    url += `&status=${status}`;
  }
  
  if (sortBy) {
    url += `&sortBy=${sortBy}`;
  }
  
  const response = await axios.get(url);
  return response.data;
};

/**
 * Get webinar by ID
 * @param {string} webinarId - Webinar ID
 * @returns {Promise} - Promise with webinar details
 */
export const getWebinarById = async (webinarId) => {
  const response = await axios.get(`${API_URL}/${webinarId}`);
  return response.data.data;
};

/**
 * Create a new webinar
 * @param {Object} webinarData - Webinar data
 * @returns {Promise} - Promise with created webinar
 */
export const createWebinar = async (webinarData) => {
  const response = await axios.post(API_URL, webinarData);
  return response.data.data;
};

/**
 * Update a webinar
 * @param {string} webinarId - Webinar ID
 * @param {Object} webinarData - Updated webinar data
 * @returns {Promise} - Promise with updated webinar
 */
export const updateWebinar = async (webinarId, webinarData) => {
  const response = await axios.put(`${API_URL}/${webinarId}`, webinarData);
  return response.data.data;
};

/**
 * Delete a webinar
 * @param {string} webinarId - Webinar ID
 * @returns {Promise} - Promise with deletion result
 */
export const deleteWebinar = async (webinarId) => {
  await axios.delete(`${API_URL}/${webinarId}`);
  return webinarId;
};

/**
 * Register for a webinar
 * @param {string} webinarId - Webinar ID
 * @param {Object} registrationData - Registration details (optional)
 * @returns {Promise} - Promise with registration details
 */
export const registerForWebinar = async (webinarId, registrationData = {}) => {
  const response = await axios.post(`${API_URL}/${webinarId}/register`, registrationData);
  return response.data.data;
};

/**
 * Cancel webinar registration
 * @param {string} webinarId - Webinar ID
 * @param {string} registrationId - Registration ID (optional)
 * @returns {Promise} - Promise with cancellation result
 */
export const cancelWebinarRegistration = async (webinarId, registrationId) => {
  const url = registrationId 
    ? `${API_URL}/${webinarId}/registrations/${registrationId}` 
    : `${API_URL}/${webinarId}/cancel-registration`;
  
  await axios.delete(url);
  return { webinarId, registrationId };
};

/**
 * Get user's webinars (registered, attended, hosted)
 * @returns {Promise} - Promise with user's webinar data
 */
export const getUserWebinars = async () => {
  const response = await axios.get(`${API_URL}/me`);
  return response.data.data;
};

/**
 * Get upcoming webinars
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of webinars to return
 * @param {number} params.days - Number of upcoming days to look for
 * @returns {Promise} - Promise with upcoming webinars
 */
export const getUpcomingWebinars = async ({ limit = 10, days = 30 } = {}) => {
  const response = await axios.get(`${API_URL}/upcoming?limit=${limit}&days=${days}`);
  return response.data.data;
};

/**
 * Get past webinars
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of webinars to return
 * @param {number} params.page - Page number
 * @returns {Promise} - Promise with past webinars
 */
export const getPastWebinars = async ({ limit = 10, page = 1 } = {}) => {
  const response = await axios.get(`${API_URL}/past?limit=${limit}&page=${page}`);
  return response.data.data;
};

/**
 * Check into a webinar (mark attendance)
 * @param {string} webinarId - Webinar ID
 * @param {Object} checkInData - Check-in data (e.g., check-in code)
 * @returns {Promise} - Promise with check-in confirmation
 */
export const checkIntoWebinar = async (webinarId, checkInData = {}) => {
  const response = await axios.post(`${API_URL}/${webinarId}/check-in`, checkInData);
  return response.data.data;
};

/**
 * Record webinar attendance
 * @param {string} webinarId - Webinar ID
 * @param {Object} attendanceData - Attendance data
 * @param {number} attendanceData.duration - Duration attended in minutes
 * @param {boolean} attendanceData.completed - Whether the webinar was completed
 * @returns {Promise} - Promise with attendance record
 */
export const recordWebinarAttendance = async (webinarId, attendanceData) => {
  const response = await axios.post(`${API_URL}/${webinarId}/attendance`, attendanceData);
  return response.data.data;
};

/**
 * Get webinar attendees
 * @param {string} webinarId - Webinar ID
 * @returns {Promise} - Promise with attendee list
 */
export const getWebinarAttendees = async (webinarId) => {
  const response = await axios.get(`${API_URL}/${webinarId}/attendees`);
  return response.data.data;
};

/**
 * Get webinar analytics
 * @param {string} webinarId - Webinar ID
 * @returns {Promise} - Promise with webinar analytics
 */
export const getWebinarAnalytics = async (webinarId) => {
  const response = await axios.get(`${API_URL}/${webinarId}/analytics`);
  return response.data.data;
};

/**
 * Update webinar materials
 * @param {string} webinarId - Webinar ID
 * @param {Array} materials - Materials array
 * @returns {Promise} - Promise with updated materials
 */
export const updateWebinarMaterials = async (webinarId, materials) => {
  const response = await axios.put(`${API_URL}/${webinarId}/materials`, { materials });
  return response.data.data;
};

/**
 * Send webinar reminders
 * @param {string} webinarId - Webinar ID
 * @param {Object} reminderOptions - Reminder options
 * @returns {Promise} - Promise with reminder sending result
 */
export const sendWebinarReminders = async (webinarId, reminderOptions = {}) => {
  const response = await axios.post(`${API_URL}/${webinarId}/send-reminders`, reminderOptions);
  return response.data.data;
};

export default {
  getWebinars,
  getWebinarById,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  registerForWebinar,
  cancelWebinarRegistration,
  getUserWebinars,
  getUpcomingWebinars,
  getPastWebinars,
  checkIntoWebinar,
  recordWebinarAttendance,
  getWebinarAttendees,
  getWebinarAnalytics,
  updateWebinarMaterials,
  sendWebinarReminders
};
