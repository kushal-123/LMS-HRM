/**
 * Zoom API integration service
 * Handles webinar creation, management, and participant handling
 */
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Zoom API configuration
const zoomConfig = {
  apiKey: process.env.ZOOM_API_KEY,
  apiSecret: process.env.ZOOM_API_SECRET,
  baseUrl: 'https://api.zoom.us/v2',
  tokenLifetime: 60 * 60 * 1000, // 1 hour in milliseconds
  defaultUserId: process.env.ZOOM_DEFAULT_USER_EMAIL
};

// Store token and its expiration
let zoomToken = null;
let tokenExpiration = null;

/**
 * Generate Zoom JWT token
 * @returns {string} - JWT token for Zoom API
 */
const generateZoomToken = () => {
  const now = Date.now();
  
  // Check if we have a valid token
  if (zoomToken && tokenExpiration && now < tokenExpiration) {
    return zoomToken;
  }
  
  // Generate new token
  const payload = {
    iss: zoomConfig.apiKey,
    exp: now + zoomConfig.tokenLifetime
  };
  
  const token = jwt.sign(payload, zoomConfig.apiSecret);
  
  // Store token and expiration
  zoomToken = token;
  tokenExpiration = now + zoomConfig.tokenLifetime;
  
  return token;
};

/**
 * Create a Zoom API client with authorization
 * @returns {Object} - Axios instance for Zoom API
 */
const createZoomClient = () => {
  const token = generateZoomToken();
  
  return axios.create({
    baseURL: zoomConfig.baseUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Create a Zoom webinar
 * @param {Object} webinarData - Webinar information
 * @returns {Object} - Created webinar details
 */
const createWebinar = async (webinarData) => {
  try {
    const client = createZoomClient();
    
    // Format date to Zoom API format (2022-01-01T10:00:00Z)
    const startTime = new Date(webinarData.startDate).toISOString();
    
    // Prepare webinar creation payload
    const payload = {
      topic: webinarData.title,
      type: 5, // Type 5 is webinar
      start_time: startTime,
      duration: webinarData.duration, // Duration in minutes
      timezone: webinarData.timezone || 'UTC',
      agenda: webinarData.description,
      settings: {
        host_video: true,
        panelists_video: true,
        practice_session: true,
        hd_video: true,
        approval_type: 0, // Automatically approve
        registration_type: 2, // Required registration
        audio: 'both',
        auto_recording: 'cloud',
        alternative_hosts: webinarData.alternativeHosts || '',
        close_registration: false,
        show_share_button: true,
        allow_multiple_devices: true,
        contact_name: webinarData.contactName || 'LMS Admin',
        contact_email: webinarData.contactEmail || zoomConfig.defaultUserId
      }
    };
    
    // Create webinar through Zoom API
    const response = await client.post(`/users/${zoomConfig.defaultUserId}/webinars`, payload);
    
    return {
      webinarId: response.data.id,
      password: response.data.password,
      joinUrl: response.data.join_url,
      startUrl: response.data.start_url,
      hostEmail: zoomConfig.defaultUserId,
      ...response.data
    };
  } catch (error) {
    console.error('Error creating Zoom webinar:', error.response?.data || error.message);
    throw new Error(`Failed to create Zoom webinar: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get webinar details from Zoom
 * @param {string} webinarId - Zoom webinar ID
 * @returns {Object} - Webinar details
 */
const getWebinarDetails = async (webinarId) => {
  try {
    const client = createZoomClient();
    
    const response = await client.get(`/webinars/${webinarId}`);
    
    return response.data;
  } catch (error) {
    console.error('Error getting Zoom webinar details:', error.response?.data || error.message);
    throw new Error(`Failed to get Zoom webinar details: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Register a participant for a webinar
 * @param {string} webinarId - Zoom webinar ID
 * @param {Object} participant - Participant information
 * @returns {Object} - Registration confirmation
 */
const registerParticipant = async (webinarId, participant) => {
  try {
    const client = createZoomClient();
    
    // Prepare registration payload
    const payload = {
      email: participant.email,
      first_name: participant.firstName || participant.name.split(' ')[0],
      last_name: participant.lastName || participant.name.split(' ').slice(1).join(' ') || '',
      job_title: participant.jobTitle || '',
      org: participant.organization || '',
      custom_questions: [
        {
          title: 'Employee ID',
          value: participant.employeeId || ''
        },
        {
          title: 'Department',
          value: participant.department || ''
        }
      ]
    };
    
    const response = await client.post(`/webinars/${webinarId}/registrants`, payload);
    
    return {
      registrantId: response.data.registrant_id,
      joinUrl: response.data.join_url,
      registrantEmail: participant.email,
      ...response.data
    };
  } catch (error) {
    console.error('Error registering webinar participant:', error.response?.data || error.message);
    throw new Error(`Failed to register webinar participant: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get webinar registrants list
 * @param {string} webinarId - Zoom webinar ID
 * @returns {Array} - List of registrants
 */
const getWebinarRegistrants = async (webinarId) => {
  try {
    const client = createZoomClient();
    
    const response = await client.get(`/webinars/${webinarId}/registrants`, {
      params: {
        page_size: 300, // Maximum allowed by Zoom
        status: 'approved'
      }
    });
    
    return response.data.registrants || [];
  } catch (error) {
    console.error('Error getting webinar registrants:', error.response?.data || error.message);
    throw new Error(`Failed to get webinar registrants: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Cancel a webinar registration
 * @param {string} webinarId - Zoom webinar ID
 * @param {string} registrantId - Registrant ID
 * @returns {boolean} - Success status
 */
const cancelRegistration = async (webinarId, registrantId) => {
  try {
    const client = createZoomClient();
    
    await client.delete(`/webinars/${webinarId}/registrants/${registrantId}`);
    
    return true;
  } catch (error) {
    console.error('Error canceling webinar registration:', error.response?.data || error.message);
    throw new Error(`Failed to cancel webinar registration: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Update a webinar
 * @param {string} webinarId - Zoom webinar ID
 * @param {Object} updateData - Updated webinar data
 * @returns {boolean} - Success status
 */
const updateWebinar = async (webinarId, updateData) => {
  try {
    const client = createZoomClient();
    
    // Format date to Zoom API format if provided
    let payload = {};
    
    if (updateData.title) {
      payload.topic = updateData.title;
    }
    
    if (updateData.description) {
      payload.agenda = updateData.description;
    }
    
    if (updateData.startDate) {
      payload.start_time = new Date(updateData.startDate).toISOString();
    }
    
    if (updateData.duration) {
      payload.duration = updateData.duration;
    }
    
    if (updateData.timezone) {
      payload.timezone = updateData.timezone;
    }
    
    // Update settings if provided
    if (Object.keys(updateData).some(key => ['hostVideo', 'panelistsVideo', 'practiceSession'].includes(key))) {
      payload.settings = {};
      
      if ('hostVideo' in updateData) {
        payload.settings.host_video = updateData.hostVideo;
      }
      
      if ('panelistsVideo' in updateData) {
        payload.settings.panelists_video = updateData.panelistsVideo;
      }
      
      if ('practiceSession' in updateData) {
        payload.settings.practice_session = updateData.practiceSession;
      }
      
      if ('alternativeHosts' in updateData) {
        payload.settings.alternative_hosts = updateData.alternativeHosts;
      }
    }
    
    await client.patch(`/webinars/${webinarId}`, payload);
    
    return true;
  } catch (error) {
    console.error('Error updating Zoom webinar:', error.response?.data || error.message);
    throw new Error(`Failed to update Zoom webinar: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Delete a webinar
 * @param {string} webinarId - Zoom webinar ID
 * @returns {boolean} - Success status
 */
const deleteWebinar = async (webinarId) => {
  try {
    const client = createZoomClient();
    
    await client.delete(`/webinars/${webinarId}`);
    
    return true;
  } catch (error) {
    console.error('Error deleting Zoom webinar:', error.response?.data || error.message);
    throw new Error(`Failed to delete Zoom webinar: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Get past webinar attendees
 * @param {string} webinarId - Zoom webinar ID
 * @returns {Array} - List of attendees
 */
const getWebinarAttendees = async (webinarId) => {
  try {
    const client = createZoomClient();
    
    // Get past instance of the webinar
    const pastInstances = await client.get(`/past_webinars/${webinarId}/instances`);
    
    if (!pastInstances.data.webinars || pastInstances.data.webinars.length === 0) {
      return [];
    }
    
    // Get the latest instance
    const latestInstance = pastInstances.data.webinars[0];
    
    // Get attendees for this instance
    const response = await client.get(`/past_webinars/${webinarId}/instances/${latestInstance.uuid}/participants`);
    
    return response.data.participants || [];
  } catch (error) {
    console.error('Error getting webinar attendees:', error.response?.data || error.message);
    throw new Error(`Failed to get webinar attendees: ${error.response?.data?.message || error.message}`);
  }
};

module.exports = {
  createWebinar,
  getWebinarDetails,
  registerParticipant,
  getWebinarRegistrants,
  cancelRegistration,
  updateWebinar,
  deleteWebinar,
  getWebinarAttendees
};
