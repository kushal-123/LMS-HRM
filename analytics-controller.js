const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const LearningEffectiveness = require('../models/LearningEffectiveness');
const DepartmentCompliance = require('../models/DepartmentCompliance');
const EmployeeSkill = require('../models/EmployeeSkill');
const Skill = require('../models/Skill');
const CareerPath = require('../models/CareerPath');
const User = require('../models/User');
const Badge = require('../models/Badge');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

// @desc    Get learning effectiveness data
// @route   GET /api/analytics/effectiveness
// @access  Private/Admin/Manager
const getLearningEffectiveness = asyncHandler(async (req, res) => {
  const { department, startDate, endDate } = req.query;
  
  // Build query object
  const query = {};
  
  if (department && department !== 'all') {
    query.department = department;
  }
  
  // Filter by date range
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Get learning effectiveness data
  const learningEffectiveness = await LearningEffectiveness.find(query)
    .sort({ date: 1 })
    .select('-__v');
  
  // Format data for frontend
  const formattedData = learningEffectiveness.map(item => ({
    date: item.date,
    department: item.department,
    totalCompletions: item.totalCompletions,
    effectivenessScore: calculateEffectivenessScore(item),
    engagementScore: calculateEngagementScore(item),
    skillDevelopment: item.skillDevelopment,
    performanceImpact: item.performanceImpact,
    categoryBreakdown: item.categoryBreakdown
  }));
  
  res.status(200).json({
    success: true,
    count: formattedData.length,
    data: formattedData
  });
});

// Helper function to calculate effectiveness score
const calculateEffectivenessScore = (data) => {
  // Calculate weighted effectiveness score based on multiple factors
  let effectivenessScore = 0;
  
  // Factor 1: Skill development (40%)
  const skillFactor = Math.min(data.skillDevelopment.averageSkillsPerEmployee / 5, 1) * 40;
  
  // Factor 2: Performance correlation (30%)
  let performanceFactor = 0;
  if (data.performanceImpact.performanceCorrelation === 'Positive') {
    performanceFactor = 30;
  } else if (data.performanceImpact.performanceCorrelation === 'Neutral') {
    performanceFactor = 15;
  }
  
  // Factor 3: Course completion distribution (30%)
  const highTrainingRatio = data.performanceImpact.highTrainingGroup / 
    (data.performanceImpact.highTrainingGroup + 
     data.performanceImpact.mediumTrainingGroup + 
     data.performanceImpact.lowTrainingGroup);
     
  const completionFactor = Math.min(highTrainingRatio * 2, 1) * 30;
  
  // Calculate total score
  effectivenessScore = Math.round(skillFactor + performanceFactor + completionFactor);
  
  return effectivenessScore;
};

// Helper function to calculate engagement score
const calculateEngagementScore = (data) => {
  // Simple engagement score calculation (0-10 scale)
  // Based on ratio of high training group
  const totalGroups = data.performanceImpact.highTrainingGroup + 
                      data.performanceImpact.mediumTrainingGroup + 
                      data.performanceImpact.lowTrainingGroup;
                      
  if (totalGroups === 0) return 0;
  
  const highRatio = data.performanceImpact.highTrainingGroup / totalGroups;
  const mediumRatio = data.performanceImpact.mediumTrainingGroup / totalGroups;
  
  // Weighted calculation (high group valued more)
  const score = (highRatio * 10) + (mediumRatio * 5);
  
  return Math.min(Math.round(score * 10) / 10, 10);
};

// @desc    Get skill gap analysis data
// @route   GET /api/analytics/skill-gap
// @access  Private/Admin/Manager
const getSkillGapAnalysis = asyncHandler(async (req, res) => {
  const { department } = req.query;
  
  // Get all skills
  const skills = await Skill.find().select('name category');
  
  // Build filter for employees
  const employeeFilter = {};
  if (department && department !== 'all') {
    employeeFilter.department = department;
  }
  
  // Get employees
  const employees = await User.find(employeeFilter).select('_id name department role');
  
  if (employees.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        currentSkillLevels: {},
        targetSkillLevels: {},
        skillCategories: {}
      }
    });
  }
  
  // Get employee IDs
  const employeeIds = employees.map(emp => emp._id);
  
  // Get all employee skills
  const employeeSkills = await EmployeeSkill.find({ 
    employee: { $in: employeeIds } 
  }).populate('skill');
  
  // Get previous skill levels (3 months ago)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const previousEmployeeSkills = await EmployeeSkill.find({ 
    employee: { $in: employeeIds },
    lastAssessed: { $lte: threeMonthsAgo }
  }).populate('skill');
  
  // Calculate current skill levels
  const currentSkillLevels = {};
  const previousSkillLevels = {};
  const skillCategories = {};
  
  // Process current skills
  employeeSkills.forEach(empSkill => {
    if (empSkill.skill) {
      const skillName = empSkill.skill.name;
      
      if (!currentSkillLevels[skillName]) {
        currentSkillLevels[skillName] = [];
      }
      
      currentSkillLevels[skillName].push(empSkill.proficiencyLevel);
      
      // Store skill category
      skillCategories[skillName] = empSkill.skill.category || 'General';
    }
  });
  
  // Process previous skills
  previousEmployeeSkills.forEach(empSkill => {
    if (empSkill.skill) {
      const skillName = empSkill.skill.name;
      
      if (!previousSkillLevels[skillName]) {
        previousSkillLevels[skillName] = [];
      }
      
      previousSkillLevels[skillName].push(empSkill.proficiencyLevel);
    }
  });
  
  // Calculate average skill levels
  const averageCurrentSkills = {};
  const averagePreviousSkills = {};
  
  Object.keys(currentSkillLevels).forEach(skill => {
    averageCurrentSkills[skill] = currentSkillLevels[skill].reduce((a, b) => a + b, 0) / currentSkillLevels[skill].length;
  });
  
  Object.keys(previousSkillLevels).forEach(skill => {
    averagePreviousSkills[skill] = previousSkillLevels[skill].reduce((a, b) => a + b, 0) / previousSkillLevels[skill].length;
  });
  
  // Get target skill levels based on roles
  const targetSkillLevels = await getTargetSkillLevels(department);
  
  res.status(200).json({
    success: true,
    data: {
      currentSkillLevels: averageCurrentSkills,
      previousSkillLevels: averagePreviousSkills,
      targetSkillLevels,
      skillCategories
    }
  });
});

// Helper function to get target skill levels
const getTargetSkillLevels = async (department) => {
  // In a real implementation, this would be based on role requirements
  // For this implementation, we'll use a simplistic approach
  
  const skills = await Skill.find().select('name category');
  const targetLevels = {};
  
  skills.forEach(skill => {
    // Set default target level to 3 (out of 5)
    targetLevels[skill.name] = 3;
    
    // Adjust based on skill category (just an example logic)
    if (skill.category === 'Technical') {
      targetLevels[skill.name] = 4;
    } else if (skill.category === 'Leadership') {
      targetLevels[skill.name] = 3.5;
    }
    
    // Department-specific adjustments (example)
    if (department === 'Engineering' && skill.category === 'Technical') {
      targetLevels[skill.name] = 4.5;
    } else if (department === 'Sales' && skill.category === 'Communication') {
      targetLevels[skill.name] = 4.5;
    }
  });
  
  return targetLevels;
};

// @desc    Get department compliance data
// @route   GET /api/analytics/compliance
// @access  Private/Admin/Manager
const getDepartmentCompliance = asyncHandler(async (req, res) => {
  const { department } = req.query;
  
  // Build query object
  const query = {};
  
  if (department && department !== 'all') {
    query.name = department;
  }
  
  // Get compliance data
  const complianceData = await DepartmentCompliance.find(query)
    .populate('courses.course', 'title category')
    .sort({ complianceRate: 1 });
  
  // Format data for frontend
  const formattedData = {
    departments: complianceData.map(dept => ({
      name: dept.name,
      complianceRate: dept.complianceRate,
      employeeCount: dept.employeeCount,
      requiredCourseCount: dept.requiredCourseCount,
      courses: dept.courses.map(course => ({
        id: course.course ? course.course._id : 'unknown',
        title: course.course ? course.course.title : 'Unknown Course',
        complianceRate: course.complianceRate,
        dueDate: course.dueDate
      }))
    }))
  };
  
  // Add trend data if available (simulated for this implementation)
  formattedData.trends = [
    { month: 'Jan', compliance: 78 },
    { month: 'Feb', compliance: 82 },
    { month: 'Mar', compliance: 85 },
    { month: 'Apr', compliance: 82 },
    { month: 'May', compliance: 86 },
    { month: 'Jun', compliance: 89 }
  ];
  
  res.status(200).json({
    success: true,
    data: formattedData
  });
});

// @desc    Get career path prediction data
// @route   GET /api/analytics/career-path
// @access  Private/Admin/Manager
const getCareerPathPredictions = asyncHandler(async (req, res) => {
  const { department, userId } = req.query;
  
  // Build query object
  const query = {};
  
  if (userId) {
    // Individual career path analysis
    query.employee = userId;
  } else if (department && department !== 'all') {
    // Department-level analysis
    query.department = department;
  }
  
  // Get career paths
  const careerPaths = await CareerPath.find(query)
    .populate('employee', 'name department role')
    .populate('currentRole', 'title level')
    .populate('potentialPaths.role', 'title level')
    .populate('recommendedCourses', 'title category level')
    .select('-__v');
  
  // Format data for frontend
  const formattedData = careerPaths.map(path => ({
    employeeId: path.employee._id,
    employeeName: path.employee.name,
    department: path.employee.department,
    currentRole: path.currentRole ? {
      id: path.currentRole._id,
      title: path.currentRole.title,
      level: path.currentRole.level
    } : null,
    skillGapScore: path.skillGapScore,
    potentialPaths: path.potentialPaths.map(potential => ({
      role: potential.role ? {
        id: potential.role._id,
        title: potential.role.title,
        level: potential.role.level
      } : null,
      matchScore: potential.matchScore,
      requiredSkills: potential.requiredSkills,
      timeToReady: potential.timeToReady
    })),
    recommendedCourses: path.recommendedCourses.map(course => ({
      id: course._id,
      title: course.title,
      category: course.category,
      level: course.level
    }))
  }));
  
  // Additional department-level stats if no specific user requested
  let departmentStats = null;
  
  if (!userId && formattedData.length > 0) {
    // Calculate average values
    const totalEmployees = formattedData.length;
    let totalPaths = 0;
    let totalGapScore = 0;
    
    formattedData.forEach(emp => {
      totalPaths += emp.potentialPaths.length;
      totalGapScore += emp.skillGapScore;
    });
    
    departmentStats = {
      employeeCount: totalEmployees,
      averagePaths: totalEmployees > 0 ? totalPaths / totalEmployees : 0,
      averageGapScore: totalEmployees > 0 ? totalGapScore / totalEmployees : 0,
      mostCommonNextRole: getMostCommonNextRole(formattedData)
    };
  }
  
  res.status(200).json({
    success: true,
    count: formattedData.length,
    departmentStats,
    data: formattedData
  });
});

// Helper function to find most common next role
const getMostCommonNextRole = (data) => {
  const roleCount = {};
  let maxCount = 0;
  let mostCommonRole = null;
  
  data.forEach(emp => {
    if (emp.potentialPaths.length > 0) {
      // Get top path (highest match score)
      const topPath = emp.potentialPaths.reduce((max, path) => 
        path.matchScore > max.matchScore ? path : max, 
        emp.potentialPaths[0]
      );
      
      if (topPath && topPath.role) {
        const roleTitle = topPath.role.title;
        roleCount[roleTitle] = (roleCount[roleTitle] || 0) + 1;
        
        if (roleCount[roleTitle] > maxCount) {
          maxCount = roleCount[roleTitle];
          mostCommonRole = topPath.role;
        }
      }
    }
  });
  
  return mostCommonRole;
};

// @desc    Get user learning metrics
// @route   GET /api/analytics/user/:userId
// @access  Private/Admin/Manager/Self
const getUserLearningMetrics = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  
  // Check if user has permission (admin, manager, or self)
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    req.user.id !== userId
  ) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this user\'s data'
    });
  }
  
  // Get user enrollments
  const enrollments = await Enrollment.find({ user: userId })
    .populate('course', 'title category level duration')
    .populate('completedModules.module')
    .populate('badgesEarned')
    .select('-__v');
  
  // Get employee skills
  const employeeSkills = await EmployeeSkill.find({ employee: userId })
    .populate('skill', 'name category')
    .select('-__v');
  
  // Calculate metrics
  const completedCourses = enrollments.filter(e => e.status === 'Completed');
  const inProgressCourses = enrollments.filter(e => e.status === 'In Progress');
  const notStartedCourses = enrollments.filter(e => e.status === 'Not Started');
  
  // Calculate total learning time
  let totalLearningTimeMinutes = 0;
  completedCourses.forEach(enrollment => {
    if (enrollment.course && enrollment.course.duration) {
      totalLearningTimeMinutes += enrollment.course.duration;
    }
  });
  
  inProgressCourses.forEach(enrollment => {
    if (enrollment.course && enrollment.course.duration) {
      totalLearningTimeMinutes += (enrollment.course.duration * (enrollment.progressPercentage / 100));
    }
  });
  
  // Calculate completion by category
  const categoryCompletions = {};
  completedCourses.forEach(enrollment => {
    if (enrollment.course && enrollment.course.category) {
      const category = enrollment.course.category;
      categoryCompletions[category] = (categoryCompletions[category] || 0) + 1;
    }
  });
  
  // Get badges
  const badges = enrollments.reduce((acc, enrollment) => {
    if (enrollment.badgesEarned && enrollment.badgesEarned.length > 0) {
      acc.push(...enrollment.badgesEarned);
    }
    return acc;
  }, []);
  
  // Format data for frontend
  const userData = {
    enrollmentStats: {
      total: enrollments.length,
      completed: completedCourses.length,
      inProgress: inProgressCourses.length,
      notStarted: notStartedCourses.length,
      completionRate: enrollments.length > 0 ? 
        Math.round((completedCourses.length / enrollments.length) * 100) : 0
    },
    learningTime: {
      totalMinutes: Math.round(totalLearningTimeMinutes),
      totalHours: Math.round(totalLearningTimeMinutes / 60 * 10) / 10
    },
    categoryDistribution: Object.keys(categoryCompletions).map(category => ({
      category,
      count: categoryCompletions[category]
    })),
    skills: employeeSkills.map(skill => ({
      id: skill.skill._id,
      name: skill.skill.name,
      category: skill.skill.category,
      level: skill.proficiencyLevel,
      lastAssessed: skill.lastAssessed
    })),
    badges: badges.map(badge => ({
      id: badge._id,
      name: badge.name,
      description: badge.description,
      imageUrl: badge.imageUrl,
      category: badge.badgeType
    })),
    recentActivity: getRecentActivity(enrollments)
  };
  
  res.status(200).json({
    success: true,
    data: userData
  });
});

// Helper function to get recent activity
const getRecentActivity = (enrollments) => {
  const activities = [];
  
  // Process course completions
  enrollments.forEach(enrollment => {
    if (enrollment.status === 'Completed') {
      activities.push({
        type: 'course_completion',
        date: enrollment.updatedAt,
        courseId: enrollment.course._id,
        courseTitle: enrollment.course.title
      });
    }
    
    // Process module completions
    enrollment.completedModules.forEach(module => {
      activities.push({
        type: 'module_completion',
        date: module.completedOn,
        courseId: enrollment.course._id,
        courseTitle: enrollment.course.title,
        moduleId: module.module._id,
        moduleTitle: module.module.title
      });
    });
    
    // Process badge earnings
    if (enrollment.badgesEarned && enrollment.badgesEarned.length > 0) {
      enrollment.badgesEarned.forEach(badge => {
        activities.push({
          type: 'badge_earned',
          date: enrollment.updatedAt, // Approximate
          badgeId: badge._id,
          badgeName: badge.name,
          courseId: enrollment.course._id,
          courseTitle: enrollment.course.title
        });
      });
    }
  });
  
  // Sort by date (most recent first) and limit to 10
  return activities
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
};

// @desc    Get course completion statistics
// @route   GET /api/analytics/courses/:courseId
// @access  Private/Admin/Instructor
const getCourseCompletionStats = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  
  // Get course details
  const course = await Course.findById(courseId);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      error: 'Course not found'
    });
  }
  
  // Get all enrollments for this course
  const enrollments = await Enrollment.find({ course: courseId })
    .populate('user', 'name department role')
    .populate('completedModules.module')
    .select('-__v');
  
  // Calculate completion statistics
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.status === 'Completed').length;
  const inProgressEnrollments = enrollments.filter(e => e.status === 'In Progress').length;
  const notStartedEnrollments = enrollments.filter(e => e.status === 'Not Started').length;
  
  // Calculate average completion time (in days)
  let totalCompletionDays = 0;
  let completionsWithTime = 0;
  
  enrollments.forEach(enrollment => {
    if (enrollment.status === 'Completed' && enrollment.enrollmentDate) {
      const enrollmentDate = new Date(enrollment.enrollmentDate);
      const completionDate = new Date(enrollment.updatedAt);
      const diffTime = Math.abs(completionDate - enrollmentDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      totalCompletionDays += diffDays;
      completionsWithTime++;
    }
  });
  
  const avgCompletionDays = completionsWithTime > 0 ?
    Math.round((totalCompletionDays / completionsWithTime) * 10) / 10 : null;
  
  // Department breakdown
  const departmentBreakdown = {};
  
  enrollments.forEach(enrollment => {
    if (enrollment.user && enrollment.user.department) {
      const dept = enrollment.user.department;
      
      if (!departmentBreakdown[dept]) {
        departmentBreakdown[dept] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0
        };
      }
      
      departmentBreakdown[dept].total++;
      
      if (enrollment.status === 'Completed') {
        departmentBreakdown[dept].completed++;
      } else if (enrollment.status === 'In Progress') {
        departmentBreakdown[dept].inProgress++;
      } else {
        departmentBreakdown[dept].notStarted++;
      }
    }
  });
  
  // Format department data
  const departmentStats = Object.keys(departmentBreakdown).map(dept => ({
    department: dept,
    enrollments: departmentBreakdown[dept].total,
    completed: departmentBreakdown[dept].completed,
    completionRate: departmentBreakdown[dept].total > 0 ?
      Math.round((departmentBreakdown[dept].completed / departmentBreakdown[dept].total) * 100) : 0
  }));
  
  // Module completion breakdown
  const moduleCompletions = {};
  course.modules.forEach(moduleId => {
    moduleCompletions[moduleId] = {
      completed: 0,
      totalEnrollments
    };
  });
  
  enrollments.forEach(enrollment => {
    enrollment.completedModules.forEach(module => {
      const moduleId = module.module._id.toString();
      if (moduleCompletions[moduleId]) {
        moduleCompletions[moduleId].completed++;
      }
    });
  });
  
  // Format module data
  const moduleStats = Object.keys(moduleCompletions).map(moduleId => ({
    moduleId,
    completions: moduleCompletions[moduleId].completed,
    completionRate: totalEnrollments > 0 ?
      Math.round((moduleCompletions[moduleId].completed / totalEnrollments) * 100) : 0
  }));
  
  // Format data for frontend
  const courseStats = {
    courseId: course._id,
    title: course.title,
    enrollmentStats: {
      total: totalEnrollments,
      completed: completedEnrollments,
      inProgress: inProgressEnrollments,
      notStarted: notStartedEnrollments,
      completionRate: totalEnrollments > 0 ?
        Math.round((completedEnrollments / totalEnrollments) * 100) : 0
    },
    averageCompletionDays: avgCompletionDays,
    departmentBreakdown: departmentStats,
    moduleCompletion: moduleStats
  };
  
  res.status(200).json({
    success: true,
    data: courseStats
  });
});

// @desc    Get overall analytics for the organization
// @route   GET /api/analytics/overall
// @access  Private/Admin
const getOverallAnalytics = asyncHandler(async (req, res) => {
  // Get counts from database
  const totalUsers = await User.countDocuments({ isActive: true });
  const totalCourses = await Course.countDocuments({ isPublished: true });
  const totalEnrollments = await Enrollment.countDocuments();
  const completedEnrollments = await Enrollment.countDocuments({ status: 'Completed' });
  
  // Get department statistics
  const departments = await User.distinct('department');
  const departmentStats = [];
  
  for (const dept of departments) {
    if (!dept) continue; // Skip undefined department
    
    const deptUsers = await User.countDocuments({ department: dept, isActive: true });
    const deptEnrollments = await Enrollment.find()
      .populate('user', 'department')
      .exec();
    
    const deptEnrollmentsFiltered = deptEnrollments.filter(e => 
      e.user && e.user.department === dept
    );
    
    const deptCompleted = deptEnrollmentsFiltered.filter(e => e.status === 'Completed').length;
    
    departmentStats.push({
      department: dept,
      userCount: deptUsers,
      enrollmentCount: deptEnrollmentsFiltered.length,
      completionRate: deptEnrollmentsFiltered.length > 0 ?
        Math.round((deptCompleted / deptEnrollmentsFiltered.length) * 100) : 0
    });
  }
  
  // Get course category distribution
  const categories = await Course.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const categoryDistribution = categories.map(cat => ({
    category: cat._id || 'Uncategorized',
    count: cat.count
  }));
  
  // Get monthly enrollment trends (last 6 months)
  const monthlyTrends = await getMonthlyEnrollmentTrends();
  
  // Format data for frontend
  const overallStats = {
    userStats: {
      total: totalUsers
    },
    courseStats: {
      total: totalCourses,
      categoryDistribution
    },
    enrollmentStats: {
      total: totalEnrollments,
      completed: completedEnrollments,
      completionRate: totalEnrollments > 0 ?
        Math.round((completedEnrollments / totalEnrollments) * 100) : 0
    },
    departmentStats,
    monthlyTrends
  };
  
  res.status(200).json({
    success: true,
    data: overallStats
  });
});

// Helper function to get monthly enrollment trends
const getMonthlyEnrollmentTrends = async () => {
  const trends = [];
  const now = new Date();
  
  // Get data for last 6 months
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const enrollments = await Enrollment.countDocuments({
      enrollmentDate: { $gte: month, $lte: monthEnd }
    });
    
    const completions = await Enrollment.countDocuments({
      updatedAt: { $gte: month, $lte: monthEnd },
      status: 'Completed'
    });
    
    trends.push({
      month: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
      enrollments,
      completions
    });
  }
  
  return trends;
};

// @desc    Export analytics report
// @route   GET /api/analytics/export/:reportType
// @access  Private/Admin/Manager
const exportAnalyticsReport = asyncHandler(async (req, res) => {
  const { reportType } = req.params;
  const { format = 'csv', department } = req.query;
  
  // Prepare report data based on type
  let reportData = [];
  let fields = [];
  let filename = '';
  
  switch (reportType) {
    case 'effectiveness':
      reportData = await prepareEffectivenessReport(department);
      fields = ['date', 'department', 'effectivenessScore', 'engagementScore', 'totalCompletions'];
      filename = 'learning_effectiveness_report';
      break;
      
    case 'compliance':
      reportData = await prepareComplianceReport(department);
      fields = ['department', 'complianceRate', 'employeeCount', 'requiredCourseCount'];
      filename = 'compliance_report';
      break;
      
    case 'course-completion':
      reportData = await prepareCourseCompletionReport(req.query.courseId);
      fields = ['userName', 'department', 'role', 'status', 'progressPercentage', 'enrollmentDate', 'completionDate'];
      filename = 'course_completion_report';
      break;
      
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid report type'
      });
  }
  
  // Generate report based on format
  if (format === 'csv') {
    // CSV export
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(reportData);
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}_${Date.now()}.csv`);
    
    // Send CSV data
    res.status(200).send(csv);
  } else if (format === 'json') {
    // JSON export
    res.status(200).json({
      success: true,
      data: reportData
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Unsupported export format'
    });
  }
});

// Helper function to prepare effectiveness report data
const prepareEffectivenessReport = async (department) => {
  // Build query object
  const query = {};
  
  if (department && department !== 'all') {
    query.department = department;
  }
  
  // Get learning effectiveness data
  const effectivenessData = await LearningEffectiveness.find(query)
    .sort({ date: 1 })
    .select('-__v');
  
  // Format data for report
  return effectivenessData.map(item => ({
    date: item.date.toISOString().split('T')[0],
    department: item.department,
    effectivenessScore: calculateEffectivenessScore(item),
    engagementScore: calculateEngagementScore(item),
    totalCompletions: item.totalCompletions,
    uniqueSkillsCount: item.skillDevelopment.uniqueSkillsCount,
    averageSkillsPerEmployee: item.skillDevelopment.averageSkillsPerEmployee
  }));
};

// Helper function to prepare compliance report data
const prepareComplianceReport = async (department) => {
  // Build query object
  const query = {};
  
  if (department && department !== 'all') {
    query.name = department;
  }
  
  // Get compliance data
  const complianceData = await DepartmentCompliance.find(query)
    .populate('courses.course', 'title category')
    .sort({ name: 1 });
  
  // Format data for report
  let reportData = [];
  
  complianceData.forEach(dept => {
    // Department summary row
    reportData.push({
      department: dept.name,
      complianceRate: dept.complianceRate,
      employeeCount: dept.employeeCount,
      requiredCourseCount: dept.requiredCourseCount
    });
    
    // Add course details if available
    dept.courses.forEach(course => {
      reportData.push({
        department: dept.name,
        course: course.course ? course.course.title : 'Unknown Course',
        courseCategory: course.course ? course.course.category : 'Unknown',
        courseComplianceRate: course.complianceRate,
        dueDate: course.dueDate ? course.dueDate.toISOString().split('T')[0] : 'Not set'
      });
    });
  });
  
  return reportData;
};

// Helper function to prepare course completion report data
const prepareCourseCompletionReport = async (courseId) => {
  if (!courseId) {
    return [];
  }
  
  // Get course details
  const course = await Course.findById(courseId);
  
  if (!course) {
    return [];
  }
  
  // Get all enrollments for this course
  const enrollments = await Enrollment.find({ course: courseId })
    .populate('user', 'name department role')
    .sort({ updatedAt: -1 });
  
  // Format data for report
  return enrollments.map(enrollment => ({
    userName: enrollment.user ? enrollment.user.name : 'Unknown User',
    department: enrollment.user ? enrollment.user.department : 'Unknown',
    role: enrollment.user ? enrollment.user.role : 'Unknown',
    status: enrollment.status,
    progressPercentage: enrollment.progressPercentage,
    enrollmentDate: enrollment.enrollmentDate ? enrollment.enrollmentDate.toISOString().split('T')[0] : 'Unknown',
    completionDate: enrollment.status === 'Completed' ? enrollment.updatedAt.toISOString().split('T')[0] : '',
    certificateIssued: enrollment.certificateIssued ? 'Yes' : 'No'
  }));
};

module.exports = {
  getLearningEffectiveness,
  getSkillGapAnalysis,
  getDepartmentCompliance,
  getCareerPathPredictions,
  getUserLearningMetrics,
  getCourseCompletionStats,
  getOverallAnalytics,
  exportAnalyticsReport
};
