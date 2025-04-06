import { createSlice } from '@reduxjs/toolkit';
import {
  fetchWebinars,
  fetchWebinarById,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  registerForWebinar,
  cancelWebinarRegistration,
  fetchUserWebinars,
  fetchUpcomingWebinars,
  fetchPastWebinars,
  checkIntoWebinar,
  recordWebinarAttendance,
  fetchWebinarAttendees,
  fetchWebinarAnalytics,
  updateWebinarMaterials,
  fetchWebinarRecordings,
  sendWebinarReminders
} from '../thunks/webinarThunks';

const initialState = {
  webinars: [],
  currentWebinar: null,
  userWebinars: {
    registered: [],
    attended: [],
    hosted: []
  },
  upcomingWebinars: [],
  pastWebinars: [],
  popular: [],
  attendees: [],
  recordings: [],
  analytics: null,
  totalCount: 0,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  registering: false,
  error: null,
  successMessage: null
};

const webinarSlice = createSlice({
  name: 'webinars',
  initialState,
  reducers: {
    clearWebinarErrors: (state) => {
      state.error = null;
    },
    clearWebinarSuccess: (state) => {
      state.successMessage = null;
    },
    resetWebinarState: (state) => {
      state.currentWebinar = null;
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch webinars
      .addCase(fetchWebinars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebinars.fulfilled, (state, action) => {
        state.loading = false;
        state.webinars = action.payload.data;
        state.totalCount = action.payload.totalCount;
        
        // Extract popular webinars (example: sort by registrations)
        if (action.payload.data.length > 0) {
          const sortedWebinars = [...action.payload.data].sort(
            (a, b) => b.registrations.length - a.registrations.length
          );
          state.popular = sortedWebinars.slice(0, 5); // Top 5 popular webinars
        }
      })
      .addCase(fetchWebinars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch webinars';
      })
      
      // Fetch webinar by ID
      .addCase(fetchWebinarById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebinarById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWebinar = action.payload;
      })
      .addCase(fetchWebinarById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch webinar details';
      })
      
      // Create webinar
      .addCase(createWebinar.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createWebinar.fulfilled, (state, action) => {
        state.creating = false;
        state.webinars = [...state.webinars, action.payload];
        state.successMessage = 'Webinar created successfully';
      })
      .addCase(createWebinar.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || 'Failed to create webinar';
      })
      
      // Update webinar
      .addCase(updateWebinar.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateWebinar.fulfilled, (state, action) => {
        state.updating = false;
        state.webinars = state.webinars.map(webinar => 
          webinar._id === action.payload._id ? action.payload : webinar
        );
        
        if (state.currentWebinar && state.currentWebinar._id === action.payload._id) {
          state.currentWebinar = action.payload;
        }
        
        state.successMessage = 'Webinar updated successfully';
      })
      .addCase(updateWebinar.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || 'Failed to update webinar';
      })
      
      // Delete webinar
      .addCase(deleteWebinar.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteWebinar.fulfilled, (state, action) => {
        state.deleting = false;
        state.webinars = state.webinars.filter(webinar => webinar._id !== action.payload);
        state.currentWebinar = null;
        state.successMessage = 'Webinar deleted successfully';
      })
      .addCase(deleteWebinar.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || 'Failed to delete webinar';
      })
      
      // Register for webinar
      .addCase(registerForWebinar.pending, (state) => {
        state.registering = true;
        state.error = null;
      })
      .addCase(registerForWebinar.fulfilled, (state, action) => {
        state.registering = false;
        
        // Update webinar registrations
        if (state.currentWebinar && state.currentWebinar._id === action.payload.webinarId) {
          state.currentWebinar = {
            ...state.currentWebinar,
            registrations: [...state.currentWebinar.registrations, action.payload]
          };
        }
        
        // Update webinars list
        state.webinars = state.webinars.map(webinar => {
          if (webinar._id === action.payload.webinarId) {
            return {
              ...webinar,
              registrations: [...webinar.registrations, action.payload]
            };
          }
          return webinar;
        });
        
        // Update user's registered webinars
        state.userWebinars.registered = [
          ...state.userWebinars.registered,
          {
            ...state.webinars.find(w => w._id === action.payload.webinarId),
            registration: action.payload
          }
        ];
        
        state.successMessage = 'Successfully registered for webinar';
      })
      .addCase(registerForWebinar.rejected, (state, action) => {
        state.registering = false;
        state.error = action.payload || 'Failed to register for webinar';
      })
      
      // Cancel webinar registration
      .addCase(cancelWebinarRegistration.pending, (state) => {
        state.registering = true;
        state.error = null;
      })
      .addCase(cancelWebinarRegistration.fulfilled, (state, action) => {
        state.registering = false;
        
        // Update webinar registrations
        if (state.currentWebinar && state.currentWebinar._id === action.payload.webinarId) {
          state.currentWebinar = {
            ...state.currentWebinar,
            registrations: state.currentWebinar.registrations.filter(
              reg => reg._id !== action.payload.registrationId
            )
          };
        }
        
        // Update webinars list
        state.webinars = state.webinars.map(webinar => {
          if (webinar._id === action.payload.webinarId) {
            return {
              ...webinar,
              registrations: webinar.registrations.filter(
                reg => reg._id !== action.payload.registrationId
              )
            };
          }
          return webinar;
        });
        
        // Update user's registered webinars
        state.userWebinars.registered = state.userWebinars.registered.filter(
          webinar => !(webinar._id === action.payload.webinarId)
        );
        
        state.successMessage = 'Registration cancelled successfully';
      })
      .addCase(cancelWebinarRegistration.rejected, (state, action) => {
        state.registering = false;
        state.error = action.payload || 'Failed to cancel registration';
      })
      
      // Fetch user webinars
      .addCase(fetchUserWebinars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserWebinars.fulfilled, (state, action) => {
        state.loading = false;
        state.userWebinars = action.payload;
      })
      .addCase(fetchUserWebinars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user webinars';
      })
      
      // Fetch upcoming webinars
      .addCase(fetchUpcomingWebinars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingWebinars.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingWebinars = action.payload;
      })
      .addCase(fetchUpcomingWebinars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch upcoming webinars';
      })
      
      // Fetch past webinars
      .addCase(fetchPastWebinars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPastWebinars.fulfilled, (state, action) => {
        state.loading = false;
        state.pastWebinars = action.payload;
      })
      .addCase(fetchPastWebinars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch past webinars';
      })
      
      // Check into webinar
      .addCase(checkIntoWebinar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkIntoWebinar.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update attendees list if current webinar
        if (state.currentWebinar && state.currentWebinar._id === action.payload.webinarId) {
          if (state.currentWebinar.attendees) {
            state.currentWebinar = {
              ...state.currentWebinar,
              attendees: [...state.currentWebinar.attendees, action.payload]
            };
          }
        }
        
        state.successMessage = 'Successfully checked into webinar';
      })
      .addCase(checkIntoWebinar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to check into webinar';
      })
      
      // Record webinar attendance
      .addCase(recordWebinarAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordWebinarAttendance.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update user's attended webinars
        if (!state.userWebinars.attended.some(w => w._id === action.payload.webinarId)) {
          const webinar = state.webinars.find(w => w._id === action.payload.webinarId);
          if (webinar) {
            state.userWebinars.attended = [
              ...state.userWebinars.attended,
              {
                ...webinar,
                attendance: action.payload
              }
            ];
          }
        }
      })
      .addCase(recordWebinarAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to record attendance';
      })
      
      // Fetch webinar attendees
      .addCase(fetchWebinarAttendees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebinarAttendees.fulfilled, (state, action) => {
        state.loading = false;
        state.attendees = action.payload;
      })
      .addCase(fetchWebinarAttendees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch webinar attendees';
      })
      
      // Fetch webinar analytics
      .addCase(fetchWebinarAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebinarAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchWebinarAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch webinar analytics';
      })
      
      // Update webinar materials
      .addCase(updateWebinarMaterials.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateWebinarMaterials.fulfilled, (state, action) => {
        state.updating = false;
        
        // Update webinar in state
        if (state.currentWebinar && state.currentWebinar._id === action.payload.webinarId) {
          state.currentWebinar = {
            ...state.currentWebinar,
            materials: action.payload.materials
          };
        }
        
        // Update webinars list
        state.webinars = state.webinars.map(webinar => {
          if (webinar._id === action.payload.webinarId) {
            return {
              ...webinar,
              materials: action.payload.materials
            };
          }
          return webinar;
        });
        
        state.successMessage = 'Webinar materials updated successfully';
      })
      .addCase(updateWebinarMaterials.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || 'Failed to update webinar materials';
      })
      
      // Fetch webinar recordings
      .addCase(fetchWebinarRecordings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWebinarRecordings.fulfilled, (state, action) => {
        state.loading = false;
        state.recordings = action.payload;
      })
      .addCase(fetchWebinarRecordings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch webinar recordings';
      })
      
      // Send webinar reminders
      .addCase(sendWebinarReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendWebinarReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = `Reminders sent to ${action.payload.count} registrants`;
      })
      .addCase(sendWebinarReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send webinar reminders';
      });
  }
});

export const { clearWebinarErrors, clearWebinarSuccess, resetWebinarState } = webinarSlice.actions;

export default webinarSlice.reducer;
