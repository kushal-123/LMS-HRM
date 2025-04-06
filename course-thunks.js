import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/courses';

// Helper function to handle API errors
const handleApiError = (error, rejectWithValue) => {
  const errorMessage = error.response && error.response.data.message
    ? error.response.data.message
    : error.message;
  return rejectWithValue(errorMessage);
};

/**
 * Fetch all courses with optional filtering, sorting, and pagination
 */
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async ({ page = 1, limit = 10, search = '', filters = {}, sort = 'newest' }, { rejectWithValue }) => {
    try {
      let query = `?page=${page}&limit=${limit}`;
      
      if (search) {
        query += `&search=${search}`;
      }
      
      if (sort) {
        query += `&sort=${sort}`;
      }
      
      // Add filters to query
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          query += `&${key}=${filters[key]}`;
        }
      });
      
      const response = await axios.get(`${API_URL}${query}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch a single course by ID
 */
export const fetchCourseById = createAsyncThunk(
  'courses/fetchCourseById',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${courseId}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Create a new course
 */
export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, courseData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Update a course
 */
export const updateCourse = createAsyncThunk(
  'courses/updateCourse',
  async ({ courseId, courseData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${courseId}`, courseData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Delete a course
 */
export const deleteCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${courseId}`);
      return courseId;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Publish a course
 */
export const publishCourse = createAsyncThunk(
  'courses/publishCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${courseId}/publish`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Unpublish a course
 */
export const unpublishCourse = createAsyncThunk(
  'courses/unpublishCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${courseId}/unpublish`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Create a new module within a course
 */
export const createModule = createAsyncThunk(
  'courses/createModule',
  async ({ courseId, moduleData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${courseId}/modules`, moduleData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Update a module
 */
export const updateModule = createAsyncThunk(
  'courses/updateModule',
  async ({ courseId, moduleId, moduleData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${courseId}/modules/${moduleId}`, moduleData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Delete a module
 */
export const deleteModule = createAsyncThunk(
  'courses/deleteModule',
  async ({ courseId, moduleId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${courseId}/modules/${moduleId}`);
      return { courseId, moduleId };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Reorder modules within a course
 */
export const reorderModules = createAsyncThunk(
  'courses/reorderModules',
  async ({ courseId, moduleIds }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${courseId}/modules/reorder`, { order: moduleIds });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch all courses for an instructor
 */
export const fetchInstructorCourses = createAsyncThunk(
  'courses/fetchInstructorCourses',
  async ({ page = 1, limit = 10, status = '' }, { rejectWithValue }) => {
    try {
      let query = `?page=${page}&limit=${limit}`;
      
      if (status) {
        query += `&status=${status}`;
      }
      
      const response = await axios.get(`${API_URL}/instructor${query}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch featured courses
 */
export const fetchFeaturedCourses = createAsyncThunk(
  'courses/fetchFeaturedCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/featured`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch recommended courses for a user
 */
export const fetchRecommendedCourses = createAsyncThunk(
  'courses/fetchRecommendedCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/recommended`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch popular courses
 */
export const fetchPopularCourses = createAsyncThunk(
  'courses/fetchPopularCourses',
  async ({ limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/popular?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch course categories
 */
export const fetchCourseCategories = createAsyncThunk(
  'courses/fetchCourseCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Add a review to a course
 */
export const addCourseReview = createAsyncThunk(
  'courses/addCourseReview',
  async ({ courseId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${courseId}/reviews`, reviewData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch reviews for a course
 */
export const fetchCourseReviews = createAsyncThunk(
  'courses/fetchCourseReviews',
  async ({ courseId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${courseId}/reviews?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Clone a course
 */
export const cloneCourse = createAsyncThunk(
  'courses/cloneCourse',
  async ({ courseId, newTitle }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${courseId}/clone`, { title: newTitle });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Add content to a module
 */
export const addModuleContent = createAsyncThunk(
  'courses/addModuleContent',
  async ({ courseId, moduleId, contentData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${courseId}/modules/${moduleId}/content`, contentData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Update content in a module
 */
export const updateModuleContent = createAsyncThunk(
  'courses/updateModuleContent',
  async ({ courseId, moduleId, contentId, contentData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/${courseId}/modules/${moduleId}/content/${contentId}`,
        contentData
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Delete content from a module
 */
export const deleteModuleContent = createAsyncThunk(
  'courses/deleteModuleContent',
  async ({ courseId, moduleId, contentId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${courseId}/modules/${moduleId}/content/${contentId}`);
      return { courseId, moduleId, contentId };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Reorder content within a module
 */
export const reorderModuleContent = createAsyncThunk(
  'courses/reorderModuleContent',
  async ({ courseId, moduleId, contentIds }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/${courseId}/modules/${moduleId}/content/reorder`,
        { order: contentIds }
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Upload course image
 */
export const uploadCourseImage = createAsyncThunk(
  'courses/uploadCourseImage',
  async ({ courseId, imageFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await axios.post(`${API_URL}/${courseId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Generate course certificate template
 */
export const generateCertificateTemplate = createAsyncThunk(
  'courses/generateCertificateTemplate',
  async ({ courseId, templateData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${courseId}/certificate-template`, templateData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch course student list
 */
export const fetchCourseStudents = createAsyncThunk(
  'courses/fetchCourseStudents',
  async ({ courseId, page = 1, limit = 10, search = '' }, { rejectWithValue }) => {
    try {
      let query = `?page=${page}&limit=${limit}`;
      
      if (search) {
        query += `&search=${search}`;
      }
      
      const response = await axios.get(`${API_URL}/${courseId}/students${query}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Export course content
 */
export const exportCourse = createAsyncThunk(
  'courses/exportCourse',
  async ({ courseId, format = 'json' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${courseId}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `course-${courseId}.${format}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      return { courseId, format };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Import course from file
 */
export const importCourse = createAsyncThunk(
  'courses/importCourse',
  async ({ courseFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('courseFile', courseFile);
      
      const response = await axios.post(`${API_URL}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Fetch course analytics
 */
export const fetchCourseAnalytics = createAsyncThunk(
  'courses/fetchCourseAnalytics',
  async ({ courseId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${courseId}/analytics`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Add prerequisite course
 */
export const addPrerequisite = createAsyncThunk(
  'courses/addPrerequisite',
  async ({ courseId, prerequisiteId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${courseId}/prerequisites`, {
        prerequisiteId
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Remove prerequisite course
 */
export const removePrerequisite = createAsyncThunk(
  'courses/removePrerequisite',
  async ({ courseId, prerequisiteId }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${courseId}/prerequisites/${prerequisiteId}`);
      return { courseId, prerequisiteId };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Add course to learning path
 */
export const addCourseToLearningPath = createAsyncThunk(
  'courses/addCourseToLearningPath',
  async ({ courseId, learningPathId, order }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/learning-paths/${learningPathId}/courses`, {
        courseId,
        order
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Bulk enroll students
 */
export const bulkEnrollStudents = createAsyncThunk(
  'courses/bulkEnrollStudents',
  async ({ courseId, studentIds }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/${courseId}/bulk-enroll`, {
        studentIds
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

/**
 * Update course settings
 */
export const updateCourseSettings = createAsyncThunk(
  'courses/updateCourseSettings',
  async ({ courseId, settings }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${courseId}/settings`, settings);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);
