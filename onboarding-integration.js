/**
 * Integration between LMS module and Onboarding module
 * Handles new employee training, role-specific learning paths, 
 * and onboarding progress tracking
 */
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import models
const Course = require('../backend/models/Course');
const Enrollment = require('../backend/models/Enrollment');
const LearningPath = require('../backend/models/LearningPath');

// Configuration
const config = {
  onboardingApiEndpoint: process.env.ONBOARDING_API_ENDPOINT || 'http://localhost:5003/api/onboarding',
  syncInterval: process.env.ONBOARDING_SYNC_INTERVAL || 3600000, // Default: every hour
  apiKey: process.env.INTEGRATION_API_KEY
};

/**
 * Initialize the onboarding integration
 */
const initialize = () => {
  console.log('Initializing Onboarding integration...');
  
  // Set up listeners for new employee events
  setupNewEmployeeListeners();
  
  // Set up regular synchronization
  setInterval(syncOnboardingProgress, config.syncInterval);
  
  console.log('Onboarding integration initialized successfully');
};

/**
 * Set up webhooks or listeners for new employee events
 */
const setupNewEmployeeListeners = () => {
  // This would typically be implemented using a message queue or webhooks
  // For this implementation, we'll use a simple interval check
  
  setInterval(checkForNewEmployees, 900000); // Check every 15 minutes
};

/**
 * Check for newly onboarded employees
 */
const checkForNewEmployees = async () => {
  try {
    // Get timestamp for 24 hours ago
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Fetch new employees from Onboarding module
    const response = await axios.get(
      `${config.onboardingApiEndpoint}/employees/new`,
      {
        params: { since: yesterday.toISOString() },
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      }
    );
    
    const newEmployees = response.data.data;
    
    if (newEmployees && newEmployees.length > 0) {
      console.log(`Found ${newEmployees.length} newly onboarded employees`);
      
      // Process each new employee
      for (const employee of newEmployees) {
        await assignOnboardingTraining(employee);
      }
    }
  } catch (error) {
    console.error('Error checking for new employees:', error.message);
  }
};

/**
 * Assign onboarding training to a new employee
 */
const assignOnboardingTraining = async (employee) => {
  try {
    console.log(`Assigning onboarding training for employee: ${employee.name}`);
    
    // 1. Assign company-wide onboarding courses
    await assignCompanyOnboardingCourses(employee);
    
    // 2. Assign department-specific onboarding courses
    if (employee.department) {
      await assignDepartmentOnboardingCourses(employee);
    }
    
    // 3. Assign role-specific onboarding courses
    if (employee.role) {
      await assignRoleOnboardingCourses(employee);
    }
    
    // 4. Assign role-specific learning path if available
    if (employee.role) {
      await assignRoleLearningPath(employee);
    }
    
    // 5. Notify the Onboarding module about assigned training
    await notifyOnboardingModule(employee);
    
    console.log(`Onboarding training assigned successfully for: ${employee.name}`);
  } catch (error) {
    console.error(`Error assigning onboarding training for ${employee.name}:`, error.message);
  }
};

/**
 * Assign company-wide onboarding courses
 */
const assignCompanyOnboardingCourses = async (employee) => {
  try {
    // Find company onboarding courses
    const companyOnboardingCourses = await Course.find({
      category: 'Onboarding',
      requiredForRoles: { $in: ['All'] },
      isPublished: true
    });
    
    // Enroll employee in each course
    for (const course of companyOnboardingCourses) {
      // Set due date (14 days from now for onboarding courses)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      
      // Create enrollment
      await Enrollment.create({
        user: employee._id,
        course: course._id,
        status: 'Not Started',
        isRequired: true,
        requiredBy: 'Onboarding',
        dueDate
      });
      
      // Increment course enrollment count
      await Course.findByIdAndUpdate(
        course._id,
        { $inc: { enrollmentCount: 1 } }
      );
      
      console.log(`Enrolled ${employee.name} in company onboarding course: ${course.title}`);
    }
  } catch (error) {
    console.error(`Error assigning company onboarding courses for ${employee.name}:`, error.message);
  }
};

/**
 * Assign department-specific onboarding courses
 */
const assignDepartmentOnboardingCourses = async (employee) => {
  try {
    // Find department onboarding courses
    const departmentOnboardingCourses = await Course.find({
      category: 'Onboarding',
      requiredForDepartments: { $in: [employee.department] },
      isPublished: true
    });
    
    // Enroll employee in each course
    for (const course of departmentOnboardingCourses) {
      // Set due date (21 days from now for department courses)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 21);
      
      // Create enrollment
      await Enrollment.create({
        user: employee._id,
        course: course._id,
        status: 'Not Started',
        isRequired: true,
        requiredBy: 'Department Onboarding',
        dueDate
      });
      
      // Increment course enrollment count
      await Course.findByIdAndUpdate(
        course._id,
        { $inc: { enrollmentCount: 1 } }
      );
      
      console.log(`Enrolled ${employee.name} in department onboarding course: ${course.title}`);
    }
  } catch (error) {
    console.error(`Error assigning department onboarding courses for ${employee.name}:`, error.message);
  }
};

/**
 * Assign role-specific onboarding courses
 */
const assignRoleOnboardingCourses = async (employee) => {
  try {
    // Find role onboarding courses
    const roleOnboardingCourses = await Course.find({
      category: 'Onboarding',
      requiredForRoles: { $in: [employee.role] },
      isPublished: true
    });
    
    // Enroll employee in each course
    for (const course of roleOnboardingCourses) {
      // Set due date (30 days from now for role-specific courses)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Create enrollment
      await Enrollment.create({
        user: employee._id,
        course: course._id,
        status: 'Not Started',
        isRequired: true,
        requiredBy: 'Role Onboarding',
        dueDate
      });
      
      // Increment course enrollment count
      await Course.findByIdAndUpdate(
        course._id,
        { $inc: { enrollmentCount: 1 } }
      );
      
      console.log(`Enrolled ${employee.name} in role onboarding course: ${course.title}`);
    }
  } catch (error) {
    console.error(`Error assigning role onboarding courses for ${employee.name}:`, error.message);
  }
};

/**
 * Assign role-specific learning path
 */
const assignRoleLearningPath = async (employee) => {
  try {
    // Find learning path for this role
    const learningPath = await LearningPath.findOne({
      role: employee.role,
      isActive: true
    });
    
    if (!learningPath) {
      console.log(`No specific learning path found for role: ${employee.role}`);
      return;
    }
    
    // Enroll employee in the learning path
    await axios.post(
      `${config.onboardingApiEndpoint}/employees/${employee._id}/learning-path`,
      {
        learningPathId: learningPath._id,
        learningPathName: learningPath.name,
        estimatedCompletionDays: learningPath.estimatedCompletionDays || 90,
        courseCount: learningPath.courses.length
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Assigned learning path "${learningPath.name}" to ${employee.name}`);
    
    // Enroll in all courses in the learning path
    for (let i = 0; i < learningPath.courses.length; i++) {
      const courseId = learningPath.courses[i];
      
      // Get the course details
      const course = await Course.findById(courseId);
      
      if (!course) continue;
      
      // Calculate staggered due dates (first course due soon, later courses due later)
      const dueDate = new Date();
      // Add 14 days for the first course, plus 14 for each subsequent course
      dueDate.setDate(dueDate.getDate() + 14 + (i * 14));
      
      // Create enrollment
      await Enrollment.create({
        user: employee._id,
        course: course._id,
        status: 'Not Started',
        isRequired: true,
        requiredBy: 'Learning Path',
        dueDate
      });
      
      // Increment course enrollment count
      await Course.findByIdAndUpdate(
        course._id,
        { $inc: { enrollmentCount: 1 } }
      );
      
      console.log(`Enrolled ${employee.name} in learning path course: ${course.title}`);
    }
  } catch (error) {
    console.error(`Error assigning learning path for ${employee.name}:`, error.message);
  }
};

/**
 * Notify the Onboarding module about assigned training
 */
const notifyOnboardingModule = async (employee) => {
  try {
    // Get the count of assigned courses
    const enrollmentCount = await Enrollment.countDocuments({
      user: employee._id,
      requiredBy: { $in: ['Onboarding', 'Department Onboarding', 'Role Onboarding', 'Learning Path'] }
    });
    
    // Send the notification
    await axios.post(
      `${config.onboardingApiEndpoint}/employees/${employee._id}/training-assigned`,
      {
        assignedCourseCount: enrollmentCount,
        lmsUrl: process.env.LMS_URL || 'http://localhost:3000/lms'
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Onboarding module notified about training for ${employee.name}`);
  } catch (error) {
    console.error(`Error notifying onboarding module for ${employee.name}:`, error.message);
  }
};

/**
 * Sync onboarding progress with Onboarding module
 */
const syncOnboardingProgress = async () => {
  try {
    console.log('Syncing onboarding training progress...');
    
    // Get active onboarding employees from Onboarding module
    const response = await axios.get(
      `${config.onboardingApiEndpoint}/employees/active-onboarding`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      }
    );
    
    const onboardingEmployees = response.data.data;
    
    if (!onboardingEmployees || onboardingEmployees.length === 0) {
      console.log('No active onboarding employees found');
      return;
    }
    
    console.log(`Found ${onboardingEmployees.length} active onboarding employees`);
    
    // Process each onboarding employee
    for (const employee of onboardingEmployees) {
      await updateEmployeeOnboardingProgress(employee);
    }
    
    console.log('Onboarding progress sync completed successfully');
  } catch (error) {
    console.error('Error syncing onboarding progress:', error.message);
  }
};

/**
 * Update onboarding progress for an employee
 */
const updateEmployeeOnboardingProgress = async (employee) => {
  try {
    // Get all onboarding enrollments for this employee
    const enrollments = await Enrollment.find({
      user: employee._id,
      requiredBy: { $in: ['Onboarding', 'Department Onboarding', 'Role Onboarding', 'Learning Path'] }
    }).populate('course');
    
    if (enrollments.length === 0) {
      console.log(`No onboarding enrollments found for: ${employee.name}`);
      return;
    }
    
    // Calculate progress statistics
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'Completed').length;
    const inProgressCourses = enrollments.filter(e => e.status === 'In Progress').length;
    const notStartedCourses = enrollments.filter(e => e.status === 'Not Started').length;
    
    const overallProgress = Math.round((completedCourses / totalCourses) * 100);
    
    // Calculate category progress
    const categories = {};
    
    enrollments.forEach(enrollment => {
      const category = enrollment.course.category;
      
      if (!categories[category]) {
        categories[category] = {
          total: 0,
          completed: 0
        };
      }
      
      categories[category].total++;
      
      if (enrollment.status === 'Completed') {
        categories[category].completed++;
      }
    });
    
    const categoryProgress = Object.keys(categories).map(category => ({
      category,
      progress: Math.round((categories[category].completed / categories[category].total) * 100)
    }));
    
    // Send progress update to Onboarding module
    await axios.post(
      `${config.onboardingApiEndpoint}/employees/${employee._id}/training-progress`,
      {
        totalAssignedCourses: totalCourses,
        completedCourses,
        inProgressCourses,
        notStartedCourses,
        overallProgress,
        categoryProgress,
        lastUpdated: new Date()
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Updated onboarding progress for ${employee.name}: ${overallProgress}%`);
  } catch (error) {
    console.error(`Error updating onboarding progress for ${employee.name}:`, error.message);
  }
};

module.exports = {
  initialize,
  assignOnboardingTraining,
  syncOnboardingProgress
};
