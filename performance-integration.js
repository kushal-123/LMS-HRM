/**
 * Integration between LMS module and Performance module
 * Handles learning effectiveness, skill development, and performance correlations
 */
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import models
const Course = require('../backend/models/Course');
const Enrollment = require('../backend/models/Enrollment');
const LearningEffectiveness = require('../backend/models/LearningEffectiveness');
const EmployeeSkill = require('../backend/models/EmployeeSkill');
const Skill = require('../backend/models/Skill');

// Configuration
const config = {
  performanceApiEndpoint: process.env.PERFORMANCE_API_ENDPOINT || 'http://localhost:5002/api/performance',
  syncInterval: process.env.PERFORMANCE_SYNC_INTERVAL || 86400000, // Default: once per day
  apiKey: process.env.INTEGRATION_API_KEY
};

/**
 * Initialize the performance integration
 */
const initialize = () => {
  console.log('Initializing Performance integration...');
  
  // Set up regular synchronization
  setInterval(syncLearningEffectiveness, config.syncInterval);
  
  // Initial sync
  syncLearningEffectiveness();
  
  console.log('Performance integration initialized successfully');
};

/**
 * Sync learning effectiveness data with Performance module
 */
const syncLearningEffectiveness = async () => {
  try {
    console.log('Starting learning effectiveness synchronization...');
    
    // Calculate learning effectiveness for each department
    const departments = await getActiveDepartments();
    
    for (const department of departments) {
      // Get all completed courses for employees in this department
      const completedEnrollments = await getCompletedEnrollmentsByDepartment(department);
      
      if (completedEnrollments.length === 0) continue;
      
      // Get performance data for this department
      const performanceData = await getPerformanceDataForDepartment(department);
      
      if (!performanceData) continue;
      
      // Calculate learning effectiveness metrics
      const effectivenessMetrics = calculateEffectiveness(
        completedEnrollments,
        performanceData
      );
      
      // Save learning effectiveness data
      await saveLearningEffectiveness(department, effectivenessMetrics);
      
      // Send data to performance module
      await sendLearningMetricsToPerformanceModule(department, effectivenessMetrics);
    }
    
    console.log('Learning effectiveness synchronization completed successfully');
  } catch (error) {
    console.error('Error syncing learning effectiveness:', error.message);
  }
};

/**
 * Get list of active departments
 */
const getActiveDepartments = async () => {
  try {
    // Fetch departments from Performance module
    const response = await axios.get(`${config.performanceApiEndpoint}/departments`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    return response.data.data.map(dept => dept.name);
  } catch (error) {
    console.error('Error fetching departments:', error.message);
    return [];
  }
};

/**
 * Get completed enrollments for a specific department
 */
const getCompletedEnrollmentsByDepartment = async (department) => {
  try {
    // First get users from this department
    const response = await axios.get(`${config.performanceApiEndpoint}/employees`, {
      params: { department },
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    const employees = response.data.data;
    
    if (!employees || employees.length === 0) {
      return [];
    }
    
    const employeeIds = employees.map(emp => emp._id);
    
    // Get completed enrollments for these employees
    const completedEnrollments = await Enrollment.find({
      user: { $in: employeeIds },
      status: 'Completed',
      // Only include enrollments completed in the last 6 months
      updatedAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
    }).populate({
      path: 'course',
      select: 'title category skillsTaught'
    }).populate({
      path: 'user',
      select: 'name email department role'
    });
    
    return completedEnrollments;
  } catch (error) {
    console.error(`Error fetching completed enrollments for ${department}:`, error.message);
    return [];
  }
};

/**
 * Get performance data for a department
 */
const getPerformanceDataForDepartment = async (department) => {
  try {
    const response = await axios.get(`${config.performanceApiEndpoint}/metrics/department/${department}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching performance data for ${department}:`, error.message);
    return null;
  }
};

/**
 * Calculate learning effectiveness based on completed enrollments and performance data
 */
const calculateEffectiveness = (completedEnrollments, performanceData) => {
  // Group enrollments by course category
  const categoryCounts = {};
  const categoryCourses = {};
  
  completedEnrollments.forEach(enrollment => {
    const category = enrollment.course.category;
    
    if (!categoryCounts[category]) {
      categoryCounts[category] = 0;
      categoryCourses[category] = new Set();
    }
    
    categoryCounts[category]++;
    categoryCourses[category].add(enrollment.course._id.toString());
  });
  
  // Calculate metrics by category
  const categoryMetrics = Object.keys(categoryCounts).map(category => {
    return {
      category,
      completionCount: categoryCounts[category],
      uniqueCourseCount: categoryCourses[category].size
    };
  });
  
  // Calculate impact on performance metrics
  const skillDevelopmentRate = calculateSkillDevelopmentRate(completedEnrollments);
  
  // Correlate with performance metrics
  const performanceImpact = calculatePerformanceImpact(completedEnrollments, performanceData);
  
  return {
    date: new Date(),
    totalCompletions: completedEnrollments.length,
    categoryMetrics,
    skillDevelopmentRate,
    performanceImpact
  };
};

/**
 * Calculate skill development rate from completed enrollments
 */
const calculateSkillDevelopmentRate = (completedEnrollments) => {
  // For simplicity, we'll estimate based on number of unique skills taught
  const allSkills = new Set();
  
  completedEnrollments.forEach(enrollment => {
    if (enrollment.course.skillsTaught && enrollment.course.skillsTaught.length > 0) {
      enrollment.course.skillsTaught.forEach(skill => {
        allSkills.add(skill.toString());
      });
    }
  });
  
  return {
    uniqueSkillsCount: allSkills.size,
    averageSkillsPerEmployee: allSkills.size / (new Set(completedEnrollments.map(e => e.user._id.toString()))).size
  };
};

/**
 * Calculate impact on performance based on completed trainings
 */
const calculatePerformanceImpact = (completedEnrollments, performanceData) => {
  // This is a simplified model - in a real system, you would use more sophisticated analysis
  
  // Group employees by their completed course count
  const employeeTrainingCounts = {};
  
  completedEnrollments.forEach(enrollment => {
    const userId = enrollment.user._id.toString();
    
    if (!employeeTrainingCounts[userId]) {
      employeeTrainingCounts[userId] = 0;
    }
    
    employeeTrainingCounts[userId]++;
  });
  
  // Categorize employees by training activity
  const highTrainingCount = Object.keys(employeeTrainingCounts).filter(
    userId => employeeTrainingCounts[userId] >= 3
  ).length;
  
  const mediumTrainingCount = Object.keys(employeeTrainingCounts).filter(
    userId => employeeTrainingCounts[userId] >= 1 && employeeTrainingCounts[userId] < 3
  ).length;
  
  const lowTrainingCount = Object.keys(employeeTrainingCounts).filter(
    userId => employeeTrainingCounts[userId] < 1
  ).length;
  
  // Compare with performance metrics (if available)
  let performanceCorrelation = 'Unknown';
  
  if (performanceData && performanceData.averageScore) {
    performanceCorrelation = performanceData.averageScore >= 7 ? 'Positive' : 
      (performanceData.averageScore >= 5 ? 'Neutral' : 'Negative');
  }
  
  return {
    highTrainingGroup: highTrainingCount,
    mediumTrainingGroup: mediumTrainingCount,
    lowTrainingGroup: lowTrainingCount,
    performanceCorrelation
  };
};

/**
 * Save learning effectiveness data to the database
 */
const saveLearningEffectiveness = async (department, metrics) => {
  try {
    await LearningEffectiveness.create({
      department,
      date: metrics.date,
      totalCompletions: metrics.totalCompletions,
      categoryBreakdown: metrics.categoryMetrics.map(cm => ({
        category: cm.category,
        completionCount: cm.completionCount,
        uniqueCourseCount: cm.uniqueCourseCount
      })),
      skillDevelopment: {
        uniqueSkillsCount: metrics.skillDevelopmentRate.uniqueSkillsCount,
        averageSkillsPerEmployee: metrics.skillDevelopmentRate.averageSkillsPerEmployee
      },
      performanceImpact: {
        highTrainingGroup: metrics.performanceImpact.highTrainingGroup,
        mediumTrainingGroup: metrics.performanceImpact.mediumTrainingGroup,
        lowTrainingGroup: metrics.performanceImpact.lowTrainingGroup,
        performanceCorrelation: metrics.performanceImpact.performanceCorrelation
      }
    });
    
    console.log(`Saved learning effectiveness data for ${department}`);
  } catch (error) {
    console.error(`Error saving learning effectiveness for ${department}:`, error.message);
  }
};

/**
 * Send learning metrics to Performance module
 */
const sendLearningMetricsToPerformanceModule = async (department, metrics) => {
  try {
    await axios.post(
      `${config.performanceApiEndpoint}/metrics/learning`,
      {
        department,
        date: metrics.date,
        learningMetrics: {
          totalCompletions: metrics.totalCompletions,
          uniqueSkills: metrics.skillDevelopmentRate.uniqueSkillsCount,
          categoryBreakdown: metrics.categoryMetrics.reduce((obj, item) => {
            obj[item.category] = item.completionCount;
            return obj;
          }, {})
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Learning metrics sent to Performance module for ${department}`);
  } catch (error) {
    console.error(`Error sending metrics to Performance module for ${department}:`, error.message);
  }
};

/**
 * Process course completion for performance insights
 * Called when a user completes a course
 */
const processCourseCompletionForPerformance = async (userId, courseId) => {
  try {
    // Get user details
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'Completed'
    }).populate('user').populate('course');
    
    if (!enrollment) return;
    
    // Send completion to Performance module for tracking
    await axios.post(
      `${config.performanceApiEndpoint}/training/completion`,
      {
        employeeId: userId,
        courseId: courseId,
        courseName: enrollment.course.title,
        courseCategory: enrollment.course.category,
        completionDate: enrollment.updatedAt,
        skills: enrollment.course.skillsTaught || []
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Course completion sent to Performance module for user ${userId}`);
  } catch (error) {
    console.error(`Error processing course completion for Performance module:`, error.message);
  }
};

module.exports = {
  initialize,
  syncLearningEffectiveness,
  processCourseCompletionForPerformance
};
