import { createSlice } from '@reduxjs/toolkit';
import { 
  enrollInCourse, 
  getEnrollments, 
  getEnrollmentById, 
  updateEnrollment, 
  cancelEnrollment, 
  getEnrollmentProgress,
  updateEnrollmentProgress,
  getCompletedCourses,
  getInProgressCourses,
  getCertificates,
  downloadCertificate
} from '../thunks/enrollmentThunks';

const initialState = {
  enrollments: [],
  currentEnrollment: null,
  completedCourses: [],
  inProgressCourses: [],
  certificates: [],
  currentCertificate: null,
  totalCount: 0,
  loading: false,
  creating: false,
  updating: false,
  cancelling: false,
  error: null,
  successMessage: null
};

const enrollmentsSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {
    clearEnrollmentErrors: (state) => {
      state.error = null;
    },
    clearEnrollmentSuccess: (state) => {
      state.successMessage = null;
    },
    resetEnrollmentState: (state) => {
      state.currentEnrollment = null;
      state.currentCertificate = null;
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get enrollments
      .addCase(getEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch enrollments';
      })
      
      // Get enrollment by ID
      .addCase(getEnrollmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEnrollmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEnrollment = action.payload;
      })
      .addCase(getEnrollmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch enrollment details';
      })
      
      // Enroll in course
      .addCase(enrollInCourse.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.creating = false;
        state.enrollments = [...state.enrollments, action.payload];
        state.inProgressCourses = [...state.inProgressCourses, action.payload];
        state.successMessage = 'Successfully enrolled in the course';
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || 'Failed to enroll in course';
      })
      
      // Update enrollment
      .addCase(updateEnrollment.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateEnrollment.fulfilled, (state, action) => {
        state.updating = false;
        state.enrollments = state.enrollments.map(enrollment => 
          enrollment._id === action.payload._id ? action.payload : enrollment
        );
        if (state.currentEnrollment && state.currentEnrollment._id === action.payload._id) {
          state.currentEnrollment = action.payload;
        }
        state.successMessage = 'Enrollment updated successfully';
      })
      .addCase(updateEnrollment.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || 'Failed to update enrollment';
      })
      
      // Cancel enrollment
      .addCase(cancelEnrollment.pending, (state) => {
        state.cancelling = true;
        state.error = null;
      })
      .addCase(cancelEnrollment.fulfilled, (state, action) => {
        state.cancelling = false;
        state.enrollments = state.enrollments.filter(
          enrollment => enrollment._id !== action.payload
        );
        state.inProgressCourses = state.inProgressCourses.filter(
          course => course._id !== action.payload
        );
        state.currentEnrollment = null;
        state.successMessage = 'Enrollment cancelled successfully';
      })
      .addCase(cancelEnrollment.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload || 'Failed to cancel enrollment';
      })
      
      // Get enrollment progress
      .addCase(getEnrollmentProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEnrollmentProgress.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentEnrollment && state.currentEnrollment._id === action.payload.enrollmentId) {
          state.currentEnrollment = {
            ...state.currentEnrollment,
            progress: action.payload.progress,
            moduleProgress: action.payload.moduleProgress
          };
        }
      })
      .addCase(getEnrollmentProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch enrollment progress';
      })
      
      // Update enrollment progress
      .addCase(updateEnrollmentProgress.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateEnrollmentProgress.fulfilled, (state, action) => {
        state.updating = false;
        if (state.currentEnrollment && state.currentEnrollment._id === action.payload.enrollmentId) {
          state.currentEnrollment = {
            ...state.currentEnrollment,
            progress: action.payload.progress,
            moduleProgress: action.payload.moduleProgress
          };
        }
        
        // Update the enrollment in the enrollments list
        state.enrollments = state.enrollments.map(enrollment => {
          if (enrollment._id === action.payload.enrollmentId) {
            return {
              ...enrollment,
              progress: action.payload.progress
            };
          }
          return enrollment;
        });
        
        // Check if course is completed and move it between lists
        if (action.payload.progress >= 100) {
          const completedCourse = state.inProgressCourses.find(
            course => course._id === action.payload.courseId
          );
          
          if (completedCourse) {
            state.inProgressCourses = state.inProgressCourses.filter(
              course => course._id !== action.payload.courseId
            );
            state.completedCourses = [...state.completedCourses, {
              ...completedCourse,
              completionDate: new Date().toISOString(),
              progress: 100
            }];
          }
        }
      })
      .addCase(updateEnrollmentProgress.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || 'Failed to update enrollment progress';
      })
      
      // Get completed courses
      .addCase(getCompletedCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCompletedCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.completedCourses = action.payload;
      })
      .addCase(getCompletedCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch completed courses';
      })
      
      // Get in progress courses
      .addCase(getInProgressCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInProgressCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.inProgressCourses = action.payload;
      })
      .addCase(getInProgressCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch in-progress courses';
      })
      
      // Get certificates
      .addCase(getCertificates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCertificates.fulfilled, (state, action) => {
        state.loading = false;
        state.certificates = action.payload;
      })
      .addCase(getCertificates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch certificates';
      })
      
      // Download certificate
      .addCase(downloadCertificate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadCertificate.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCertificate = action.payload;
      })
      .addCase(downloadCertificate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to download certificate';
      });
  }
});

export const { clearEnrollmentErrors, clearEnrollmentSuccess, resetEnrollmentState } = enrollmentsSlice.actions;

export default enrollmentsSlice.reducer;
