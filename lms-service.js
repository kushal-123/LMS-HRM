import axios from 'axios';

// Create an axios instance
const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to every request if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Courses API
const getCourses = async (params = {}) => {
  const response = await API.get('/courses', { params });
  return response.data;
};

const getCourseById = async (id) => {
  const response = await API.get(`/courses/${id}`);
  return response.data;
};

const createCourse = async (courseData) => {
  const response = await API.post('/courses', courseData);
  return response.data;
};

const updateCourse = async (id, courseData) => {
  const response = await API.put(`/courses/${id}`, courseData);
  return response.data;
};

const deleteCourse = async (id) => {
  const response = await API.delete(`/courses/${id}`);
  return response.data;
};

// Modules API
const getModulesByCourse = async (courseId) => {
  const response = await API.get(`/courses/${courseId}/modules`);
  return response.data;
};

const createModule = async (courseId, moduleData) => {
  const response = await API.post(`/courses/${courseId}/modules`, moduleData);
  return response.data;
};

const updateModule = async (moduleId, moduleData) => {
  const response = await API.put(`/modules/${moduleId}`, moduleData);
  return response.data;
};

const deleteModule = async (moduleId) => {
  const response = await API.delete(`/modules/${moduleId}`);
  return response.data;
};

// Content API
const getContentByModule = async (moduleId) => {
  const response = await API.get(`/modules/${moduleId}/content`);
  return response.data;
};

const createContent = async (moduleId, contentData) => {
  const response = await API.post(`/modules/${moduleId}/content`, contentData);
  return response.data;
};

const updateContent = async (contentId, contentData) => {
  const response = await API.put(`/content/${contentId}`, contentData);
  return response.data;
};

const deleteContent = async (contentId) => {
  const response = await API.delete(`/content/${contentId}`);
  return response.data;
};

// Enrollment API
const enrollInCourse = async (courseId) => {
  const response = await API.post('/enrollments', { courseId });
  return response.data;
};

const getUserEnrollments = async (params = {}) => {
  const response = await API.get('/enrollments', { params });
  return response.data;
};

const getEnrollmentDetails = async (enrollmentId) => {
  const response = await API.get(`/enrollments/${enrollmentId}`);
  return response.data;
};

const updateEnrollmentProgress = async (enrollmentId, progressData) => {
  const response = await API.put(`/enrollments/${enrollmentId}/progress`, progressData);
  return response.data;
};

const submitAssignment = async (enrollmentId, contentId, submissionData) => {
  const response = await API.post(`/enrollments/${enrollmentId}/assignments/${contentId}`, submissionData);
  return response.data;
};

// Learning Paths API
const getLearningPaths = async (params = {}) => {
  const response = await API.get('/learning-paths', { params });
  return response.data;
};

const getLearningPathById = async (id) => {
  const response = await API.get(`/learning-paths/${id}`);
  return response.data;
};

const enrollInLearningPath = async (learningPathId) => {
  const response = await API.post('/learning-paths/enroll', { learningPathId });
  return response.data;
};

// File Upload
const uploadFile = async (file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const response = await API.post('/content/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// Certificates
const getUserCertificates = async () => {
  const response = await API.get('/enrollments/certificates');
  return response.data;
};

const downloadCertificate = async (certificateId) => {
  const response = await API.get(`/enrollments/certificates/${certificateId}/download`, {
    responseType: 'blob'
  });
  
  return response.data;
};

const lmsService = {
  // Courses
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  
  // Modules
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule,
  
  // Content
  getContentByModule,
  createContent,
  updateContent,
  deleteContent,
  
  // Enrollments
  enrollInCourse,
  getUserEnrollments,
  getEnrollmentDetails,
  updateEnrollmentProgress,
  submitAssignment,
  
  // Learning Paths
  getLearningPaths,
  getLearningPathById,
  enrollInLearningPath,
  
  // File Upload
  uploadFile,
  
  // Certificates
  getUserCertificates,
  downloadCertificate
};

export default lmsService;
