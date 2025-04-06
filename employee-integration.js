/**
 * Integration between LMS module and Employee module
 * Handles synchronization of employee data, skills, and learning requirements
 */
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import models
const EmployeeSkill = require('../backend/models/EmployeeSkill');
const Skill = require('../backend/models/Skill');
const Course = require('../backend/models/Course');
const Enrollment = require('../backend/models/Enrollment');
const LearningPath = require('../backend/models/LearningPath');

// Configuration
const config = {
  employeeApiEndpoint: process.env.EMPLOYEE_API_ENDPOINT || 'http://localhost:5001/api/employees',
  syncInterval: process.env.SYNC_INTERVAL || 3600000, // Default: every hour
  apiKey: process.env.INTEGRATION_API_KEY
};

/**
 * Sync employee data from Employee module to LMS module
 * This ensures that all employees are available for training assignments
 */
const syncEmployeeData = async () => {
  try {
    console.log('Starting employee data synchronization...');
    
    // Fetch all employees from Employee module
    const response = await axios.get(`${config.employeeApiEndpoint}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    const employees = response.data.data;
    console.log(`Fetched ${employees.length} employees for synchronization`);
    
    // Process each employee
    for (const employee of employees) {
      // Check for required training based on role and department
      await assignRequiredTraining(employee);
      
      // Update employee skills from Employee module
      await syncEmployeeSkills(employee);
    }
    
    console.log('Employee data synchronization completed successfully');
  } catch (error) {
    console.error('Error synchronizing employee data:', error.message);
  }
};

/**
 * Assign required training to employee based on role and department
 */
const assignRequiredTraining = async (employee) => {
  try {
    // Find courses required for employee's role
    const requiredCourses = await Course.find({
      requiredForRoles: { $in: [employee.role] },
      isPublished: true
    });
    
    // Find courses required for employee's department
    const departmentCourses = await Course.find({
      requiredForDepartments: { $in: [employee.department] },
      isPublished: true
    });
    
    // Combine all required courses (removing duplicates)
    const allRequiredCourses = [...new Set([
      ...requiredCourses.map(course => course._id.toString()),
      ...departmentCourses.map(course => course._id.toString())
    ])].map(id => mongoose.Types.ObjectId(id));
    
    // Get employee's existing enrollments
    const existingEnrollments = await Enrollment.find({
      user: employee._id,
      course: { $in: allRequiredCourses }
    });
    
    // Determine which required courses the employee is not enrolled in
    const existingCourseIds = existingEnrollments.map(
      enrollment => enrollment.course.toString()
    );
    
    const coursesToEnroll = allRequiredCourses.filter(
      courseId => !existingCourseIds.includes(courseId.toString())
    );
    
    // Enroll employee in required courses
    for (const courseId of coursesToEnroll) {
      const course = await Course.findById(courseId);
      
      if (course) {
        // Set due date (30 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        
        // Create enrollment
        await Enrollment.create({
          user: employee._id,
          course: courseId,
          status: 'Not Started',
          isRequired: true,
          requiredBy: requiredCourses.some(c => c._id.toString() === courseId.toString()) ? 'Role' : 'Department',
          dueDate
        });
        
        console.log(`Enrolled employee ${employee.name} in required course: ${course.title}`);
        
        // Increment course enrollment count
        await Course.findByIdAndUpdate(
          courseId,
          { $inc: { enrollmentCount: 1 } }
        );
      }
    }
    
    console.log(`Required training assignment completed for employee: ${employee.name}`);
  } catch (error) {
    console.error(`Error assigning required training for employee ${employee.name}:`, error.message);
  }
};

/**
 * Sync employee skills from Employee module to LMS
 */
const syncEmployeeSkills = async (employee) => {
  try {
    // Fetch employee skills from Employee module
    const response = await axios.get(`${config.employeeApiEndpoint}/${employee._id}/skills`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    const employeeSkills = response.data.data;
    
    // Process each skill
    for (const skillData of employeeSkills) {
      // Check if skill exists in LMS, create if not
      let skill = await Skill.findOne({ name: skillData.name });
      
      if (!skill) {
        skill = await Skill.create({
          name: skillData.name,
          category: skillData.category || 'Other',
          description: skillData.description || `${skillData.name} skill`
        });
        
        console.log(`Created new skill in LMS: ${skill.name}`);
      }
      
      // Update or create employee skill mapping
      const employeeSkillExisting = await EmployeeSkill.findOne({
        employee: employee._id,
        skill: skill._id
      });
      
      if (employeeSkillExisting) {
        // Update existing skill level
        await EmployeeSkill.findByIdAndUpdate(
          employeeSkillExisting._id,
          {
            proficiencyLevel: skillData.level || 1,
            lastAssessed: skillData.lastAssessed || new Date(),
            source: 'Employee Module'
          }
        );
      } else {
        // Create new employee skill mapping
        await EmployeeSkill.create({
          employee: employee._id,
          skill: skill._id,
          proficiencyLevel: skillData.level || 1,
          lastAssessed: skillData.lastAssessed || new Date(),
          source: 'Employee Module'
        });
      }
    }
    
    console.log(`Employee skills synchronized for: ${employee.name}`);
  } catch (error) {
    console.error(`Error synchronizing skills for employee ${employee.name}:`, error.message);
  }
};

/**
 * Update employee skills in Employee module when completed learning in LMS
 */
const updateEmployeeSkillsOnLearningCompletion = async (userId, courseId) => {
  try {
    // Get the course with skills taught
    const course = await Course.findById(courseId).populate('skillsTaught');
    
    if (!course || !course.skillsTaught || course.skillsTaught.length === 0) {
      return; // No skills to update
    }
    
    // For each skill taught in the course
    for (const skill of course.skillsTaught) {
      // Check if employee already has this skill
      let employeeSkill = await EmployeeSkill.findOne({
        employee: userId,
        skill: skill._id
      });
      
      if (employeeSkill) {
        // Increase proficiency level by 1 (max 5)
        const newLevel = Math.min(employeeSkill.proficiencyLevel + 1, 5);
        
        await EmployeeSkill.findByIdAndUpdate(
          employeeSkill._id,
          {
            proficiencyLevel: newLevel,
            lastAssessed: new Date(),
            source: 'LMS Course Completion'
          }
        );
      } else {
        // Create new skill entry for employee
        await EmployeeSkill.create({
          employee: userId,
          skill: skill._id,
          proficiencyLevel: 1,
          lastAssessed: new Date(),
          source: 'LMS Course Completion'
        });
      }
      
      // Sync the updated skill back to Employee module
      await syncSkillToEmployeeModule(userId, skill._id);
    }
    
    console.log(`Updated employee skills after course completion: User ID ${userId}, Course ID ${courseId}`);
  } catch (error) {
    console.error(`Error updating employee skills on learning completion:`, error.message);
  }
};

/**
 * Sync a specific skill to Employee module
 */
const syncSkillToEmployeeModule = async (employeeId, skillId) => {
  try {
    const employeeSkill = await EmployeeSkill.findOne({
      employee: employeeId,
      skill: skillId
    }).populate('skill');
    
    if (!employeeSkill) return;
    
    // Send updated skill to Employee module
    await axios.post(
      `${config.employeeApiEndpoint}/${employeeId}/skills`,
      {
        name: employeeSkill.skill.name,
        level: employeeSkill.proficiencyLevel,
        source: 'LMS',
        lastAssessed: employeeSkill.lastAssessed
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Skill "${employeeSkill.skill.name}" synchronized to Employee module for employee ${employeeId}`);
  } catch (error) {
    console.error(`Error syncing skill to Employee module:`, error.message);
  }
};

// Set up the synchronization interval
const startEmployeeSync = () => {
  console.log(`Setting up employee data sync every ${config.syncInterval / 1000} seconds`);
  
  // Initial sync
  syncEmployeeData();
  
  // Regular sync
  setInterval(syncEmployeeData, config.syncInterval);
};

module.exports = {
  startEmployeeSync,
  syncEmployeeData,
  updateEmployeeSkillsOnLearningCompletion
};
