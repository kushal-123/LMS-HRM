import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/enrollments';

// Helper function to handle API errors
const handleApiError = (error, rejectWithValue) => {
  const errorMessage = error.response && error.response.data.message
    ? error.response.data.message
    : error.message;
  return rejectWithValue(errorMessage);
};

/**
 * Fetch all enrollments for the current user
 */
export const getEnrollments = createAsyncThunk(
  'enrollments/getEnrollments',
  async ({ page = 1, limit = 10, status, sortBy, courseCategory }, { rejectWithValue }) => {
    try {
      let url = `${API_URL}?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      if (sortBy) {
        url += `&sortBy=${sortBy}`;
      }
      
      if (courseCategory) {
        url += `&courseCategory=${courseCategory}`;
      }
      
      const response = await axios.get(url);
      return {
        data: response.data.data,
        totalCount: response.data.totalCount
      };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch enrollment by ID
 */
export const getEnrollmentById = createAsyncThunk(
  'enrollments/getEnrollmentById',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${enrollmentId}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Enroll in a course
 */
export const enrollInCourse = createAsyncThunk(
  'enrollments/enrollInCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/courses/${courseId}/enroll`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Update enrollment status or details
 */
export const updateEnrollment = createAsyncThunk(
  'enrollments/updateEnrollment',
  async ({ enrollmentId, updateData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${enrollmentId}`, updateData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Cancel course enrollment
 */
export const cancelEnrollment = createAsyncThunk(
  'enrollments/cancelEnrollment',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${enrollmentId}`);
      return enrollmentId;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Get enrollment progress for a specific course
 */
export const getEnrollmentProgress = createAsyncThunk(
  'enrollments/getEnrollmentProgress',
  async ({ courseId, enrollmentId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${enrollmentId}/progress`);
      return {
        enrollmentId,
        courseId,
        progress: response.data.data.progress,
        moduleProgress: response.data.data.moduleProgress
      };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Update enrollment progress
 */
export const updateEnrollmentProgress = createAsyncThunk(
  'enrollments/updateEnrollmentProgress',
  async ({ enrollmentId, courseId, moduleId, contentId, progressData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `/api/courses/${courseId}/modules/${moduleId}/content/${contentId}/progress`,
        progressData
      );
      
      return {
        enrollmentId,
        courseId,
        moduleId,
        contentId,
        progress: response.data.data.courseProgress,
        moduleProgress: response.data.data.moduleProgress
      };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Get completed courses for the current user
 */
export const getCompletedCourses = createAsyncThunk(
  'enrollments/getCompletedCourses',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/completed?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Get in-progress courses for the current user
 */
export const getInProgressCourses = createAsyncThunk(
  'enrollments/getInProgressCourses',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/in-progress?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Get certificates earned by the current user
 */
export const getCertificates = createAsyncThunk(
  'enrollments/getCertificates',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/certificates?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Download a certificate
 */
export const downloadCertificate = createAsyncThunk(
  'enrollments/downloadCertificate',
  async (certificateId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Fetch certificate details to return and store in state
      const certificateResponse = await axios.get(`/api/certificates/${certificateId}`);
      return certificateResponse.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Submit quiz attempt
 */
export const submitQuizAttempt = createAsyncThunk(
  'enrollments/submitQuizAttempt',
  async ({ courseId, moduleId, contentId, answers, timeSpent }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/content/${contentId}/quiz/submit`,
        { answers, timeSpent }
      );
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Submit assignment
 */
export const submitAssignment = createAsyncThunk(
  'enrollments/submitAssignment',
  async ({ courseId, moduleId, contentId, submission, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('submission', submission);
      
      // Append files if they exist
      if (files && files.length) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }
      
      const response = await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/content/${contentId}/assignment/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Track content viewing (for video, documents, etc.)
 */
export const trackContentViewing = createAsyncThunk(
  'enrollments/trackContentViewing',
  async ({ courseId, moduleId, contentId, timeSpent, progress }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/content/${contentId}/track`,
        { timeSpent, progress }
      );
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Generate course completion certificate
 */
export const generateCourseCertificate = createAsyncThunk(
  'enrollments/generateCourseCertificate',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/courses/${courseId}/generate-certificate`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Get quiz results
 */
export const getQuizResults = createAsyncThunk(
  'enrollments/getQuizResults',
  async ({ courseId, moduleId, contentId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/api/courses/${courseId}/modules/${moduleId}/content/${contentId}/quiz/results`
      );
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Get assignment submissions for a user
 */
export const getAssignmentSubmissions = createAsyncThunk(
  'enrollments/getAssignmentSubmissions',
  async ({ courseId, moduleId, contentId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/api/courses/${courseId}/modules/${moduleId}/content/${contentId}/assignment/submissions`
      );
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Add note to course content
 */
export const addContentNote = createAsyncThunk(
  'enrollments/addContentNote',
  async ({ enrollmentId, contentId, note }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${enrollmentId}/notes`, {
        contentId,
        note
      });
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Get notes for a course
 */
export const getContentNotes = createAsyncThunk(
  'enrollments/getContentNotes',
  async ({ enrollmentId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${enrollmentId}/notes`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Add comment to course content
 */
export const addContentComment = createAsyncThunk(
  'enrollments/addContentComment',
  async ({ courseId, moduleId, contentId, text }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/api/courses/${courseId}/modules/${moduleId}/content/${contentId}/comments`,
        { text }
      );
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Get comments for course content
 */
export const getContentComments = createAsyncThunk(
  'enrollments/getContentComments',
  async ({ courseId, moduleId, contentId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/api/courses/${courseId}/modules/${moduleId}/content/${contentId}/comments`
      );
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Verify enrollment eligibility (check prerequisites)
 */
export const verifyEnrollmentEligibility = createAsyncThunk(
  'enrollments/verifyEnrollmentEligibility',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/verify-eligibility`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Resume course learning
 */
export const resumeCourseLearning = createAsyncThunk(
  'enrollments/resumeCourseLearning',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/resume`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);
