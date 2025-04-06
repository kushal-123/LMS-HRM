import { createSlice } from '@reduxjs/toolkit';
import {
  fetchDashboardAnalytics,
  fetchCourseAnalytics,
  fetchUserAnalytics,
  fetchLearningPathAnalytics,
  fetchEnrollmentAnalytics,
  fetchCompletionRateAnalytics,
  fetchEngagementAnalytics,
  fetchRevenueAnalytics,
  fetchSkillGapAnalytics,
  fetchLearningEffectivenessAnalytics,
  fetchComplianceAnalytics,
  fetchContentPopularityAnalytics,
  generateReport,
  exportAnalyticsData
} from '../thunks/analyticsThunks';

const initialState = {
  dashboard: {
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    completionRate: 0,
    activeUsers: 0,
    revenueData: [],
    popularCourses: [],
    recentActivities: [],
    enrollmentTrend: []
  },
  courseAnalytics: {
    enrollmentCount: 0,
    completionRate: 0,
    averageRating: 0,
    averageCompletionTime: 0,
    contentEngagement: [],
    studentPerformance: [],
    feedbackSummary: {},
    userDemographics: {}
  },
  userAnalytics: {
    completedCourses: 0,
    inProgressCourses: 0,
    totalTimeSpent: 0,
    learningPathProgress: [],
    skillsAcquired: [],
    certificatesEarned: 0,
    engagementScore: 0,
    activityTimeline: []
  },
  learningPathAnalytics: {
    enrollmentCount: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    stepCompletionRates: [],
    popularPaths: []
  },
  enrollmentAnalytics: {
    totalEnrollments: 0,
    enrollmentTrends: [],
    completionTrends: [],
    departmentDistribution: [],
    courseDistribution: []
  },
  completionRates: {
    overall: 0,
    byDepartment: [],
    byCourse: [],
    byLearningPath: [],
    trends: []
  },
  engagementAnalytics: {
    activeUsersCount: 0,
    averageSessionTime: 0,
    engagementByContent: [],
    engagementByDay: [],
    mostEngagedUsers: []
  },
  revenueAnalytics: {
    totalRevenue: 0,
    revenueByMonth: [],
    revenueByDepartment: [],
    revenueByCourse: [],
    projectedRevenue: 0
  },
  skillGapAnalytics: {
    organizationSkillMap: {},
    departmentSkillGaps: [],
    topSkillGaps: [],
    skillTrends: []
  },
  learningEffectiveness: {
    overallScore: 0,
    byDepartment: [],
    byCourse: [],
    performanceImpact: {},
    feedbackCorrelation: {}
  },
  complianceAnalytics: {
    overallComplianceRate: 0,
    departmentCompliance: [],
    upcomingDeadlines: [],
    riskAreas: []
  },
  contentPopularity: {
    topCourses: [],
    topContent: [],
    contentTypeDistribution: [],
    ratingDistribution: []
  },
  reportData: null,
  exportData: null,
  loading: false,
  error: null,
  reportLoading: false,
  reportError: null,
  exportLoading: false,
  exportError: null
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsErrors: (state) => {
      state.error = null;
      state.reportError = null;
      state.exportError = null;
    },
    resetReportData: (state) => {
      state.reportData = null;
    },
    resetExportData: (state) => {
      state.exportData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Analytics
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch dashboard analytics';
      })
      
      // Course Analytics
      .addCase(fetchCourseAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.courseAnalytics = action.payload;
      })
      .addCase(fetchCourseAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch course analytics';
      })
      
      // User Analytics
      .addCase(fetchUserAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.userAnalytics = action.payload;
      })
      .addCase(fetchUserAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user analytics';
      })
      
      // Learning Path Analytics
      .addCase(fetchLearningPathAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLearningPathAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.learningPathAnalytics = action.payload;
      })
      .addCase(fetchLearningPathAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch learning path analytics';
      })
      
      // Enrollment Analytics
      .addCase(fetchEnrollmentAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnrollmentAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollmentAnalytics = action.payload;
      })
      .addCase(fetchEnrollmentAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch enrollment analytics';
      })
      
      // Completion Rate Analytics
      .addCase(fetchCompletionRateAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompletionRateAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.completionRates = action.payload;
      })
      .addCase(fetchCompletionRateAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch completion rate analytics';
      })
      
      // Engagement Analytics
      .addCase(fetchEngagementAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEngagementAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.engagementAnalytics = action.payload;
      })
      .addCase(fetchEngagementAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch engagement analytics';
      })
      
      // Revenue Analytics
      .addCase(fetchRevenueAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueAnalytics = action.payload;
      })
      .addCase(fetchRevenueAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch revenue analytics';
      })
      
      // Skill Gap Analytics
      .addCase(fetchSkillGapAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkillGapAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.skillGapAnalytics = action.payload;
      })
      .addCase(fetchSkillGapAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch skill gap analytics';
      })
      
      // Learning Effectiveness Analytics
      .addCase(fetchLearningEffectivenessAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLearningEffectivenessAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.learningEffectiveness = action.payload;
      })
      .addCase(fetchLearningEffectivenessAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch learning effectiveness analytics';
      })
      
      // Compliance Analytics
      .addCase(fetchComplianceAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.complianceAnalytics = action.payload;
      })
      .addCase(fetchComplianceAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch compliance analytics';
      })
      
      // Content Popularity Analytics
      .addCase(fetchContentPopularityAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContentPopularityAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.contentPopularity = action.payload;
      })
      .addCase(fetchContentPopularityAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch content popularity analytics';
      })
      
      // Generate Report
      .addCase(generateReport.pending, (state) => {
        state.reportLoading = true;
        state.reportError = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.reportData = action.payload;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.reportError = action.payload || 'Failed to generate report';
      })
      
      // Export Analytics Data
      .addCase(exportAnalyticsData.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportAnalyticsData.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.exportData = action.payload;
      })
      .addCase(exportAnalyticsData.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload || 'Failed to export analytics data';
      });
  }
});

export const { clearAnalyticsErrors, resetReportData, resetExportData } = analyticsSlice.actions;

export default analyticsSlice.reducer;
