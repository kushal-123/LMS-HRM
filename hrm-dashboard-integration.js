/**
 * Main integration file between the LMS module and the HRM Dashboard
 * Provides data and widgets for the main HRM dashboard
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../backend/config/middleware');

// Import models
const Course = require('../backend/models/Course');
const Enrollment = require('../backend/models/Enrollment');
const Webinar = require('../backend/models/Webinar');
const DepartmentCompliance = require('../backend/models/DepartmentCompliance');
const LearningEffectiveness = require('../backend/models/LearningEffectiveness');

// Import integrations
const employeeIntegration = require('./employee-integration');
const onboardingIntegration = require('./onboarding-integration');
const performanceIntegration = require('./performance-integration');

/**
 * Initialize all integrations with the HRM system
 */
const initializeIntegrations = () => {
  // Start employee data synchronization
  employeeIntegration.startEmployeeSync();
  
  // Initialize onboarding integration
  onboardingIntegration.initialize();
  
  // Initialize performance integration
  performanceIntegration.initialize();
  
  console.log('All HRM integrations initialized successfully');
};

/**
 * Get learning overview data for HRM dashboard
 * @route   GET /api/hrm-integration/dashboard/learning-overview
 * @access  Private/Admin, Manager
 */
router.get(
  '/dashboard/learning-overview',
  [protect, authorize(['admin', 'manager'])],
  async (req, res) => {
    try {
      // Get overall statistics
      const totalCourses = await Course.countDocuments({ isPublished: true });
      const totalEnrollments = await Enrollment.countDocuments();
      const completedEnrollments = await Enrollment.countDocuments({ status: 'Completed' });
      const inProgressEnrollments = await Enrollment.countDocuments({ status: 'In Progress' });
      const notStartedEnrollments = await Enrollment.countDocuments({ status: 'Not Started' });
      
      // Calculate completion rate
      const completionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100) 
        : 0;
      
      // Get top courses by enrollment
      const topCourses = await Course.find({ isPublished: true })
        .sort({ enrollmentCount: -1 })
        .limit(5)
        .select('title enrollmentCount');
      
      // Get department compliances
      const departmentCompliance = await DepartmentCompliance.find()
        .sort({ complianceRate: 1 }) // Ascending to highlight lowest compliance first
        .limit(5);
      
      return res.status(200).json({
        success: true,
        data: {
          totalCourses,
          totalEnrollments,
          enrollmentStatus: {
            completed: completedEnrollments,
            inProgress: inProgressEnrollments,
            notStarted: notStartedEnrollments
          },
          completionRate,
          topCourses,
          departmentCompliance
        }
      });
    } catch (error) {
      console.error('Error generating learning overview:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

/**
 * Get upcoming training events for HRM dashboard
 * @route   GET /api/hrm-integration/dashboard/upcoming-training
 * @access  Private/Admin, Manager
 */
router.get(
  '/dashboard/upcoming-training',
  [protect, authorize(['admin', 'manager'])],
  async (req, res) => {
    try {
      // Get upcoming webinars
      const currentDate = new Date();
      const upcomingWebinars = await Webinar.find({
        startDate: { $gt: currentDate }
      })
        .sort({ startDate: 1 })
        .limit(5)
        .select('title description startDate type registrations');
      
      // Get recently published courses
      const recentCourses = await Course.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title description category level thumbnail');
      
      return res.status(200).json({
        success: true,
        data: {
          upcomingWebinars,
          recentCourses
        }
      });
    } catch (error) {
      console.error('Error fetching upcoming training:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

/**
 * Get learning effectiveness data for HRM dashboard
 * @route   GET /api/hrm-integration/dashboard/learning-effectiveness
 * @access  Private/Admin, Manager
 */
router.get(
  '/dashboard/learning-effectiveness',
  [protect, authorize(['admin', 'manager'])],
  async (req, res) => {
    try {
      // Get learning effectiveness metrics from the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const learningEffectiveness = await LearningEffectiveness.find({
        date: { $gte: sixMonthsAgo }
      })
        .sort({ date: 1 });
      
      return res.status(200).json({
        success: true,
        data: learningEffectiveness
      });
    } catch (error) {
      console.error('Error fetching learning effectiveness:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

/**
 * Generate HRM dashboard widgets
 * @route   GET /api/hrm-integration/dashboard/widgets
 * @access  Private/Admin, Manager
 */
router.get(
  '/dashboard/widgets',
  [protect, authorize(['admin', 'manager'])],
  async (req, res) => {
    try {
      // Prepare widgets data
      const widgets = [
        {
          id: 'lms-overview',
          title: 'Learning Overview',
          type: 'stats',
          priority: 2,
          refreshInterval: 3600, // in seconds
          endpoint: '/api/hrm-integration/dashboard/learning-overview',
          size: 'medium',
          permissions: ['admin', 'manager', 'hr']
        },
        {
          id: 'upcoming-training',
          title: 'Upcoming Training',
          type: 'list',
          priority: 3,
          refreshInterval: 3600, // in seconds
          endpoint: '/api/hrm-integration/dashboard/upcoming-training',
          size: 'small',
          permissions: ['admin', 'manager', 'hr', 'employee']
        },
        {
          id: 'department-compliance',
          title: 'Department Compliance',
          type: 'chart',
          chartType: 'bar',
          priority: 1,
          refreshInterval: 86400, // in seconds (daily)
          endpoint: '/api/hrm-integration/dashboard/department-compliance',
          size: 'medium',
          permissions: ['admin', 'manager']
        },
        {
          id: 'learning-effectiveness',
          title: 'Learning Effectiveness',
          type: 'chart',
          chartType: 'line',
          priority: 4,
          refreshInterval: 86400, // in seconds (daily)
          endpoint: '/api/hrm-integration/dashboard/learning-effectiveness',
          size: 'large',
          permissions: ['admin', 'manager', 'hr']
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: widgets
      });
    } catch (error) {
      console.error('Error generating dashboard widgets:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

module.exports = {
  router,
  initializeIntegrations
};
