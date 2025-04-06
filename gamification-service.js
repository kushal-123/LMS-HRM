/**
 * Gamification Service
 * Handles API calls for gamification features (badges, points, rewards, etc.)
 */

import axios from 'axios';

const API_URL = '/api/gamification';

/**
 * Get user badges
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise} - Promise with user badges data
 */
export const getUserBadges = async (userId) => {
  let url = `${API_URL}/badges`;
  
  if (userId) {
    url += `?userId=${userId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Get badge details by ID
 * @param {string} badgeId - Badge ID
 * @returns {Promise} - Promise with badge details
 */
export const getBadgeById = async (badgeId) => {
  const response = await axios.get(`${API_URL}/badges/${badgeId}`);
  return response.data.data;
};

/**
 * Get all available badges
 * @param {Object} params - Query parameters
 * @param {string} params.category - Badge category
 * @returns {Promise} - Promise with all badges
 */
export const getAllBadges = async ({ category } = {}) => {
  let url = `${API_URL}/badges/all`;
  
  if (category) {
    url += `?category=${category}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Award a badge to a user
 * @param {Object} badgeData - Badge award data
 * @param {string} badgeData.badgeId - Badge ID
 * @param {string} badgeData.userId - User ID (optional, defaults to current user)
 * @param {string} badgeData.reason - Reason for awarding (optional)
 * @returns {Promise} - Promise with the awarded badge
 */
export const awardBadge = async ({ badgeId, userId, reason }) => {
  const response = await axios.post(`${API_URL}/badges/award`, {
    badgeId,
    userId,
    reason
  });
  
  return response.data.data;
};

/**
 * Get user points
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise} - Promise with user points data
 */
export const getUserPoints = async (userId) => {
  let url = `${API_URL}/points`;
  
  if (userId) {
    url += `?userId=${userId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Add points to a user
 * @param {Object} pointsData - Points data
 * @param {number} pointsData.points - Number of points to add
 * @param {string} pointsData.userId - User ID (optional, defaults to current user)
 * @param {string} pointsData.reason - Reason for adding points
 * @param {string} pointsData.source - Source of points (course, quiz, etc.)
 * @param {string} pointsData.sourceId - ID of the source (courseId, quizId, etc.)
 * @returns {Promise} - Promise with updated points data
 */
export const addPoints = async ({ points, userId, reason, source, sourceId }) => {
  const response = await axios.post(`${API_URL}/points/add`, {
    points,
    userId,
    reason,
    source,
    sourceId
  });
  
  return response.data.data;
};

/**
 * Get user's earned rewards
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise} - Promise with user rewards data
 */
export const getUserRewards = async (userId) => {
  let url = `${API_URL}/rewards/user`;
  
  if (userId) {
    url += `?userId=${userId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Get available rewards
 * @returns {Promise} - Promise with available rewards
 */
export const getAvailableRewards = async () => {
  const response = await axios.get(`${API_URL}/rewards/available`);
  return response.data.data;
};

/**
 * Redeem a reward
 * @param {string} rewardId - Reward ID
 * @returns {Promise} - Promise with redemption details
 */
export const redeemReward = async (rewardId) => {
  const response = await axios.post(`${API_URL}/rewards/redeem`, {
    rewardId
  });
  
  return response.data.data;
};

/**
 * Get leaderboard
 * @param {Object} params - Query parameters
 * @param {string} params.timeframe - Time frame (weekly, monthly, all-time)
 * @param {string} params.departmentId - Department ID
 * @param {number} params.limit - Number of results to return
 * @returns {Promise} - Promise with leaderboard data
 */
export const getLeaderboard = async ({ timeframe = 'weekly', departmentId, limit = 10 } = {}) => {
  let url = `${API_URL}/leaderboard?timeframe=${timeframe}&limit=${limit}`;
  
  if (departmentId) {
    url += `&departmentId=${departmentId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Get user achievements
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise} - Promise with user achievements data
 */
export const getUserAchievements = async (userId) => {
  let url = `${API_URL}/achievements`;
  
  if (userId) {
    url += `?userId=${userId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Get user streak information
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise} - Promise with user streak data
 */
export const getUserStreak = async (userId) => {
  let url = `${API_URL}/streak`;
  
  if (userId) {
    url += `?userId=${userId}`;
  }
  
  const response = await axios.get(url);
  return response.data.data;
};

/**
 * Update user streak
 * @param {Object} streakData - Streak data
 * @param {boolean} streakData.dailyGoalMet - Whether the daily goal was met
 * @returns {Promise} - Promise with updated streak data
 */
export const updateStreak = async ({ dailyGoalMet }) => {
  const response = await axios.post(`${API_URL}/streak/update`, {
    dailyGoalMet
  });
  
  return response.data.data;
};

export default {
  getUserBadges,
  getBadgeById,
  getAllBadges,
  awardBadge,
  getUserPoints,
  addPoints,
  getUserRewards,
  getAvailableRewards,
  redeemReward,
  getLeaderboard,
  getUserAchievements,
  getUserStreak,
  updateStreak
};
