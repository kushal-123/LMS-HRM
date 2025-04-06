import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/analytics';

// Helper function to handle API errors
const handleApiError = (error, rejectWithValue) => {
  const errorMessage = error.response && error.response.data.message
    ? error.response.data.message
    : error.message;
  return rejectWithValue(errorMessage);
};

/**
 * Fetch dashboard analytics data for admin/instructor dashboard
 */
export const fetchDashboardAnalytics = createAsyncThunk(
  'analytics/fetchDashboardAnalytics',
  async ({ timeframe = 'month', departmentId }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/dashboard?timeframe=${timeframe}`;
      
      if (departmentId) {
        url += `&departmentId=${departmentId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch analytics for a specific course
 */
export const fetchCourseAnalytics = createAsyncThunk(
  'analytics/fetchCourseAnalytics',
  async ({ courseId, timeframe = 'all' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/courses/${courseId}?timeframe=${timeframe}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch analytics for a specific user
 */
export const fetchUserAnalytics = createAsyncThunk(
  'analytics/fetchUserAnalytics',
  async ({ userId, timeframe = 'month' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId || 'me'}?timeframe=${timeframe}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch analytics for learning paths
 */
export const fetchLearningPathAnalytics = createAsyncThunk(
  'analytics/fetchLearningPathAnalytics',
  async ({ learningPathId, timeframe = 'month' }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/learning-paths`;
      
      if (learningPathId) {
        url += `/${learningPathId}`;
      }
      
      url += `?timeframe=${timeframe}`;
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch enrollment analytics
 */
export const fetchEnrollmentAnalytics = createAsyncThunk(
  'analytics/fetchEnrollmentAnalytics',
  async ({ timeframe = 'month', departmentId, courseId }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/enrollments?timeframe=${timeframe}`;
      
      if (departmentId) {
        url += `&departmentId=${departmentId}`;
      }
      
      if (courseId) {
        url += `&courseId=${courseId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch completion rate analytics
 */
export const fetchCompletionRateAnalytics = createAsyncThunk(
  'analytics/fetchCompletionRateAnalytics',
  async ({ timeframe = 'month', groupBy = 'course', departmentId }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/completion-rates?timeframe=${timeframe}&groupBy=${groupBy}`;
      
      if (departmentId) {
        url += `&departmentId=${departmentId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch user engagement analytics
 */
export const fetchEngagementAnalytics = createAsyncThunk(
  'analytics/fetchEngagementAnalytics',
  async ({ timeframe = 'month', departmentId, courseId }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/engagement?timeframe=${timeframe}`;
      
      if (departmentId) {
        url += `&departmentId=${departmentId}`;
      }
      
      if (courseId) {
        url += `&courseId=${courseId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch revenue analytics (if applicable)
 */
export const fetchRevenueAnalytics = createAsyncThunk(
  'analytics/fetchRevenueAnalytics',
  async ({ timeframe = 'month', groupBy = 'month' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/revenue?timeframe=${timeframe}&groupBy=${groupBy}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch skill gap analytics
 */
export const fetchSkillGapAnalytics = createAsyncThunk(
  'analytics/fetchSkillGapAnalytics',
  async ({ departmentId, roleId }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/skill-gaps`;
      
      if (departmentId) {
        url += `?departmentId=${departmentId}`;
        
        if (roleId) {
          url += `&roleId=${roleId}`;
        }
      } else if (roleId) {
        url += `?roleId=${roleId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch learning effectiveness analytics
 */
export const fetchLearningEffectivenessAnalytics = createAsyncThunk(
  'analytics/fetchLearningEffectivenessAnalytics',
  async ({ timeframe = 'month', departmentId, courseId }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/learning-effectiveness?timeframe=${timeframe}`;
      
      if (departmentId) {
        url += `&departmentId=${departmentId}`;
      }
      
      if (courseId) {
        url += `&courseId=${courseId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch compliance analytics
 */
export const fetchComplianceAnalytics = createAsyncThunk(
  'analytics/fetchComplianceAnalytics',
  async ({ departmentId, upcomingDays = 30 }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/compliance?upcomingDays=${upcomingDays}`;
      
      if (departmentId) {
        url += `&departmentId=${departmentId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch content popularity analytics
 */
export const fetchContentPopularityAnalytics = createAsyncThunk(
  'analytics/fetchContentPopularityAnalytics',
  async ({ timeframe = 'month', limit = 10, contentType }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/content-popularity?timeframe=${timeframe}&limit=${limit}`;
      
      if (contentType) {
        url += `&contentType=${contentType}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Generate analytics report
 */
export const generateReport = createAsyncThunk(
  'analytics/generateReport',
  async ({ 
    reportType, 
    startDate, 
    endDate, 
    department, 
    format = 'pdf',
    filters = {} 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/reports`, {
        reportType,
        startDate,
        endDate,
        department,
        format,
        filters
      });
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Export analytics data
 */
export const exportAnalyticsData = createAsyncThunk(
  'analytics/exportAnalyticsData',
  async ({ 
    dataType,
    format = 'csv',
    filters = {},
    timeframe = 'month'
  }, { rejectWithValue }) => {
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
        dataType,
        format,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch time distribution analytics
 */
export const fetchTimeDistributionAnalytics = createAsyncThunk(
  'analytics/fetchTimeDistributionAnalytics',
  async ({ userId, timeframe = 'month' }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/time-distribution?timeframe=${timeframe}`;
      
      if (userId) {
        url += `&userId=${userId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch quiz performance analytics
 */
export const fetchQuizPerformanceAnalytics = createAsyncThunk(
  'analytics/fetchQuizPerformanceAnalytics',
  async ({ courseId, userId, timeframe = 'all' }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/quiz-performance?timeframe=${timeframe}`;
      
      if (courseId) {
        url += `&courseId=${courseId}`;
      }
      
      if (userId) {
        url += `&userId=${userId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch assignment performance analytics
 */
export const fetchAssignmentPerformanceAnalytics = createAsyncThunk(
  'analytics/fetchAssignmentPerformanceAnalytics',
  async ({ courseId, userId, timeframe = 'all' }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/assignment-performance?timeframe=${timeframe}`;
      
      if (courseId) {
        url += `&courseId=${courseId}`;
      }
      
      if (userId) {
        url += `&userId=${userId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch feedback analytics
 */
export const fetchFeedbackAnalytics = createAsyncThunk(
  'analytics/fetchFeedbackAnalytics',
  async ({ courseId, timeframe = 'all' }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/feedback?timeframe=${timeframe}`;
      
      if (courseId) {
        url += `&courseId=${courseId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch user progress over time
 */
export const fetchUserProgressOverTime = createAsyncThunk(
  'analytics/fetchUserProgressOverTime',
  async ({ userId, courseId, timeframe = 'month' }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/user-progress?timeframe=${timeframe}`;
      
      if (userId) {
        url += `&userId=${userId}`;
      }
      
      if (courseId) {
        url += `&courseId=${courseId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch department comparison analytics
 */
export const fetchDepartmentComparisonAnalytics = createAsyncThunk(
  'analytics/fetchDepartmentComparisonAnalytics',
  async ({ metric = 'completion', timeframe = 'month' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/department-comparison?metric=${metric}&timeframe=${timeframe}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch content access patterns
 */
export const fetchContentAccessPatterns = createAsyncThunk(
  'analytics/fetchContentAccessPatterns',
  async ({ courseId, timeframe = 'month' }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/content-access?timeframe=${timeframe}`;
      
      if (courseId) {
        url += `&courseId=${courseId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch certificate issuance analytics
 */
export const fetchCertificateAnalytics = createAsyncThunk(
  'analytics/fetchCertificateAnalytics',
  async ({ timeframe = 'month', departmentId }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/certificates?timeframe=${timeframe}`;
      
      if (departmentId) {
        url += `&departmentId=${departmentId}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch user retention analytics
 */
export const fetchUserRetentionAnalytics = createAsyncThunk(
  'analytics/fetchUserRetentionAnalytics',
  async ({ cohort = 'month', timeframe = 'month' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/retention?cohort=${cohort}&timeframe=${timeframe}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);
