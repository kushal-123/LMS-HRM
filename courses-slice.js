import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  courses: [],
  course: null,
  recommendedCourses: [],
  loading: false,
  success: false,
  error: null,
  message: '',
  pagination: {
    page: 1,
    pages: 1,
    total: 0
  }
};

export const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    resetCoursesState: (state) => {
      state.success = false;
      state.error = null;
      state.message = '';
    },
    
    setCoursesLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setCoursesSuccess: (state, action) => {
      state.success = action.payload;
    },
    
    setCoursesError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    setCourses: (state, action) => {
      state.courses = action.payload.data;
      state.pagination = action.payload.pagination;
      state.loading = false;
      state.error = null;
    },
    
    setCourse: (state, action) => {
      state.course = action.payload;
      state.loading = false;
      state.error = null;
    },
    
    setRecommendedCourses: (state, action) => {
      state.recommendedCourses = action.payload;
      state.loading = false;
      state.error = null;
    },
    
    addCourse: (state, action) => {
      state.courses.unshift(action.payload);
      state.success = true;
      state.loading = false;
      state.error = null;
      state.message = 'Course created successfully';
    },
    
    updateCourseState: (state, action) => {
      state.courses = state.courses.map(course => 
        course._id === action.payload._id ? action.payload : course
      );
      
      if (state.course && state.course._id === action.payload._id) {
        state.course = action.payload;
      }
      
      state.success = true;
      state.loading = false;
      state.error = null;
      state.message = 'Course updated successfully';
    },
    
    removeCourse: (state, action) => {
      state.courses = state.courses.filter(
        course => course._id !== action.payload
      );
      state.success = true;
      state.loading = false;
      state.error = null;
      state.message = 'Course deleted successfully';
    },
    
    setCourseModules: (state, action) => {
      if (state.course) {
        state.course.modules = action.payload;
      }
    },
    
    addCourseModule: (state, action) => {
      if (state.course) {
        state.course.modules.push(action.payload);
        // Sort modules by order
        state.course.modules.sort((a, b) => a.order - b.order);
      }
    },
    
    updateCourseModule: (state, action) => {
      if (state.course) {
        state.course.modules = state.course.modules.map(module => 
          module._id === action.payload._id ? action.payload : module
        );
        // Sort modules by order
        state.course.modules.sort((a, b) => a.order - b.order);
      }
    },
    
    removeCourseModule: (state, action) => {
      if (state.course) {
        state.course.modules = state.course.modules.filter(
          module => module._id !== action.payload
        );
      }
    }
  }
});

export const {
  resetCoursesState,
  setCoursesLoading,
  setCoursesSuccess,
  setCoursesError,
  setCourses,
  setCourse,
  setRecommendedCourses,
  addCourse,
  updateCourseState,
  removeCourse,
  setCourseModules,
  addCourseModule,
  updateCourseModule,
  removeCourseModule
} = coursesSlice.actions;

export default coursesSlice.reducer;
