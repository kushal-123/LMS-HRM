/**
 * analytics-helpers.js - Helper functions for analytics calculations and visualizations
 */

/**
 * Calculate completion rate from enrollment and completion data
 * @param {number} completions - Number of completions
 * @param {number} enrollments - Number of enrollments
 * @returns {number} - Completion rate as percentage
 */
export const calculateCompletionRate = (completions, enrollments) => {
  if (!enrollments || enrollments === 0) return 0;
  return (completions / enrollments) * 100;
};

/**
 * Calculate average time to completion
 * @param {Array} completionData - Array of completion records with startDate and endDate
 * @returns {number} - Average time to completion in days
 */
export const calculateAverageCompletionTime = (completionData) => {
  if (!completionData || !completionData.length) return 0;
  
  const totalDays = completionData.reduce((sum, record) => {
    const start = new Date(record.startDate);
    const end = new Date(record.endDate);
    const days = (end - start) / (1000 * 60 * 60 * 24); // Convert ms to days
    return sum + days;
  }, 0);
  
  return totalDays / completionData.length;
};

/**
 * Calculate engagement score based on various metrics
 * @param {Object} engagementData - Object containing engagement metrics
 * @param {number} engagementData.logins - Number of logins
 * @param {number} engagementData.pageViews - Number of page views
 * @param {number} engagementData.timeSpent - Time spent in minutes
 * @param {number} engagementData.interactions - Number of interactions (clicks, etc.)
 * @param {number} engagementData.completedActivities - Number of completed activities
 * @param {Object} weights - Weight for each metric (default: equal weights)
 * @returns {number} - Engagement score (0-100)
 */
export const calculateEngagementScore = (
  engagementData,
  weights = {
    logins: 0.2,
    pageViews: 0.1,
    timeSpent: 0.3,
    interactions: 0.2,
    completedActivities: 0.2
  }
) => {
  if (!engagementData) return 0;
  
  // Normalize each metric to a 0-100 scale based on expected maximums
  const normalizedData = {
    logins: Math.min(engagementData.logins / 30, 1) * 100, // Max 30 logins
    pageViews: Math.min(engagementData.pageViews / 500, 1) * 100, // Max 500 page views
    timeSpent: Math.min(engagementData.timeSpent / 1000, 1) * 100, // Max 1000 minutes
    interactions: Math.min(engagementData.interactions / 1000, 1) * 100, // Max 1000 interactions
    completedActivities: Math.min(engagementData.completedActivities / 50, 1) * 100 // Max 50 activities
  };
  
  // Calculate weighted score
  let score = 0;
  let totalWeight = 0;
  
  for (const metric in weights) {
    if (normalizedData.hasOwnProperty(metric)) {
      score += normalizedData[metric] * weights[metric];
      totalWeight += weights[metric];
    }
  }
  
  // Adjust for total weight
  if (totalWeight > 0) {
    score = score / totalWeight;
  }
  
  return Math.round(score);
};

/**
 * Calculate skill gap between required and actual skills
 * @param {Array} requiredSkills - Array of required skills with level
 * @param {Array} actualSkills - Array of actual skills with level
 * @returns {Object} - Skill gap analysis results
 */
export const calculateSkillGap = (requiredSkills, actualSkills) => {
  if (!requiredSkills || !actualSkills) return { gaps: [], totalGap: 0, averageGap: 0 };
  
  // Create a map of actual skills for easy lookup
  const actualSkillsMap = actualSkills.reduce((map, skill) => {
    map[skill.id] = skill.level || 0;
    return map;
  }, {});
  
  // Calculate gap for each required skill
  const gaps = requiredSkills.map(requiredSkill => {
    const actualLevel = actualSkillsMap[requiredSkill.id] || 0;
    const gap = requiredSkill.level - actualLevel;
    
    return {
      skillId: requiredSkill.id,
      skillName: requiredSkill.name,
      requiredLevel: requiredSkill.level,
      actualLevel,
      gap: Math.max(0, gap) // Gap can't be negative
    };
  });
  
  // Calculate total and average gap
  const totalGap = gaps.reduce((sum, item) => sum + item.gap, 0);
  const averageGap = totalGap / gaps.length || 0;
  
  return {
    gaps,
    totalGap,
    averageGap
  };
};

/**
 * Calculate learning effectiveness score based on test scores and feedback
 * @param {Array} assessmentResults - Array of assessment results
 * @param {Array} feedbackScores - Array of feedback scores (1-5)
 * @param {Object} weights - Weights for assessment and feedback (default: 70/30)
 * @returns {number} - Learning effectiveness score (0-100)
 */
export const calculateLearningEffectiveness = (
  assessmentResults,
  feedbackScores,
  weights = { assessment: 0.7, feedback: 0.3 }
) => {
  if (!assessmentResults || !assessmentResults.length) return 0;
  
  // Calculate average assessment score
  const avgAssessmentScore = assessmentResults.reduce(
    (sum, result) => sum + result.score,
    0
  ) / assessmentResults.length;
  
  // Calculate average feedback score and convert to percentage
  let avgFeedbackScore = 0;
  if (feedbackScores && feedbackScores.length > 0) {
    avgFeedbackScore = (feedbackScores.reduce(
      (sum, score) => sum + score,
      0
    ) / feedbackScores.length) * 20; // Convert 1-5 to percentage (0-100)
  }
  
  // Calculate weighted effectiveness score
  const effectivenessScore = (
    avgAssessmentScore * weights.assessment +
    avgFeedbackScore * weights.feedback
  );
  
  return Math.round(effectivenessScore);
};

/**
 * Group data by a specific field for analytics
 * @param {Array} data - The data array to group
 * @param {string} field - The field to group by
 * @returns {Object} - Grouped data object
 */
export const groupDataByField = (data, field) => {
  if (!data || !Array.isArray(data) || !field) return {};
  
  return data.reduce((groups, item) => {
    const key = item[field];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

/**
 * Aggregate data by a field and calculate stats
 * @param {Array} data - The data array to aggregate
 * @param {string} groupField - The field to group by
 * @param {string} valueField - The field to calculate stats on
 * @returns {Array} - Aggregated data with stats
 */
export const aggregateData = (data, groupField, valueField) => {
  if (!data || !Array.isArray(data) || !groupField || !valueField) return [];
  
  const grouped = groupDataByField(data, groupField);
  
  return Object.keys(grouped).map(key => {
    const values = grouped[key].map(item => item[valueField] || 0);
    const sum = values.reduce((total, value) => total + value, 0);
    const count = values.length;
    
    return {
      key,
      count,
      sum,
      average: count > 0 ? sum / count : 0,
      min: count > 0 ? Math.min(...values) : 0,
      max: count > 0 ? Math.max(...values) : 0
    };
  });
};

/**
 * Calculate retention rates from user activity data
 * @param {Array} userData - Array of user activity records
 * @param {string} startDateField - Field name for start date
 * @param {string} lastActivityField - Field name for last activity date
 * @param {number} periodDays - Period in days to check retention (default: 30)
 * @returns {Object} - Retention analysis results
 */
export const calculateRetention = (
  userData,
  startDateField,
  lastActivityField,
  periodDays = 30
) => {
  if (!userData || !Array.isArray(userData)) return { rate: 0, retained: 0, total: 0 };
  
  const now = new Date();
  const periodInMs = periodDays * 24 * 60 * 60 * 1000;
  
  // Filter users who started more than periodDays ago
  const eligibleUsers = userData.filter(user => {
    const startDate = new Date(user[startDateField]);
    return (now - startDate) >= periodInMs;
  });
  
  if (eligibleUsers.length === 0) {
    return { rate: 0, retained: 0, total: 0 };
  }
  
  // Count retained users (active within the last periodDays)
  const retainedUsers = eligibleUsers.filter(user => {
    const lastActivity = new Date(user[lastActivityField]);
    return (now - lastActivity) <= periodInMs;
  });
  
  return {
    rate: (retainedUsers.length / eligibleUsers.length) * 100,
    retained: retainedUsers.length,
    total: eligibleUsers.length
  };
};

/**
 * Calculate compliance rate for required courses
 * @param {Array} requiredCourses - Array of required courses
 * @param {Array} completedCourses - Array of completed courses
 * @returns {Object} - Compliance analysis results
 */
export const calculateComplianceRate = (requiredCourses, completedCourses) => {
  if (!requiredCourses || !completedCourses) return { rate: 0, completed: 0, total: 0 };
  
  // Create a map of completed courses for easy lookup
  const completedCoursesMap = completedCourses.reduce((map, course) => {
    map[course.id] = true;
    return map;
  }, {});
  
  // Count completed required courses
  const completedRequiredCourses = requiredCourses.filter(course => {
    return completedCoursesMap[course.id];
  });
  
  return {
    rate: (completedRequiredCourses.length / requiredCourses.length) * 100,
    completed: completedRequiredCourses.length,
    total: requiredCourses.length
  };
};

/**
 * Generate color array for charts based on a base color
 * @param {number} count - Number of colors needed
 * @param {string} baseColor - Base color in hex format (default: '#3f51b5')
 * @param {string} type - Type of color scheme: 'sequential', 'diverging', 'random' (default: 'sequential')
 * @returns {Array} - Array of hex color codes
 */
export const generateChartColors = (count, baseColor = '#3f51b5', type = 'sequential') => {
  if (count <= 0) return [];
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  // Helper function to convert RGB to hex
  const rgbToHex = (r, g, b) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };
  
  const rgb = hexToRgb(baseColor);
  
  switch (type) {
    case 'sequential':
      // Generate lighter to darker variations of the base color
      return Array.from({ length: count }, (_, i) => {
        const factor = 0.5 + (i / (count - 1)) * 0.5;
        return rgbToHex(
          Math.round(rgb.r * factor),
          Math.round(rgb.g * factor),
          Math.round(rgb.b * factor)
        );
      });
    
    case 'diverging':
      // Generate diverging colors from red to base color to green
      return Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1);
        if (t < 0.5) {
          // Red to base color
          const factor = t * 2;
          return rgbToHex(
            Math.round(255 - (255 - rgb.r) * factor),
            Math.round(0 + rgb.g * factor),
            Math.round(0 + rgb.b * factor)
          );
        } else {
          // Base color to green
          const factor = (t - 0.5) * 2;
          return rgbToHex(
            Math.round(rgb.r * (1 - factor)),
            Math.round(rgb.g + (100 - rgb.g) * factor),
            Math.round(rgb.b * (1 - factor))
          );
        }
      });
    
    case 'random':
      // Generate random colors, ensuring they're visually distinct
      const colors = [baseColor];
      while (colors.length < count) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const color = rgbToHex(r, g, b);
        
        // Ensure the color is visually distinct from existing colors
        const isDistinct = colors.every(existingColor => {
          const existing = hexToRgb(existingColor);
          const distance = Math.sqrt(
            Math.pow(r - existing.r, 2) +
            Math.pow(g - existing.g, 2) +
            Math.pow(b - existing.b, 2)
          );
          return distance > 100; // Minimum distance for distinctness
        });
        
        if (isDistinct) {
          colors.push(color);
        }
      }
      return colors;
    
    default:
      return Array(count).fill(baseColor);
  }
};

/**
 * Format data for time series charts
 * @param {Array} data - Raw data array
 * @param {string} dateField - Field name for date
 * @param {string} valueField - Field name for value
 * @param {string} interval - Time interval: 'day', 'week', 'month', 'year' (default: 'day')
 * @returns {Array} - Formatted time series data
 */
export const formatTimeSeriesData = (
  data,
  dateField,
  valueField,
  interval = 'day'
) => {
  if (!data || !Array.isArray(data) || !dateField || !valueField) return [];
  
  // Group data by date interval
  const groupedData = data.reduce((result, item) => {
    const date = new Date(item[dateField]);
    
    if (isNaN(date.getTime())) {
      return result;
    }
    
    let key;
    
    switch (interval) {
      case 'day':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      
      case 'week':
        // Get the first day of the week (Sunday)
        const day = date.getDay();
        const diff = date.getDate() - day;
        const weekStart = new Date(date);
        weekStart.setDate(diff);
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        break;
      
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      
      case 'year':
        key = `${date.getFullYear()}`;
        break;
      
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    if (!result[key]) {
      result[key] = {
        date: key,
        count: 0,
        total: 0,
        values: []
      };
    }
    
    const value = parseFloat(item[valueField] || 0);
    
    result[key].count++;
    result[key].total += value;
    result[key].values.push(value);
    
    return result;
  }, {});
  
  // Convert the grouped data to an array and calculate averages
  return Object.values(groupedData)
    .map(group => ({
      date: group.date,
      value: group.total,
      average: group.total / group.count,
      count: group.count,
      min: Math.min(...group.values),
      max: Math.max(...group.values)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Process completion funnel data to track drop-offs at each stage
 * @param {Array} stages - Array of stage names
 * @param {Array} userData - Array of user data with progress information
 * @param {Function} progressCheck - Function to check if a user has completed a stage
 * @returns {Array} - Funnel data with counts and percentages
 */
export const processFunnelData = (stages, userData, progressCheck) => {
  if (!stages || !Array.isArray(stages) || !userData || !Array.isArray(userData)) {
    return [];
  }
  
  const totalUsers = userData.length;
  let previousCount = totalUsers;
  
  return stages.map((stage, index) => {
    const completedCount = userData.filter(user => progressCheck(user, stage)).length;
    const percentage = totalUsers > 0 ? (completedCount / totalUsers) * 100 : 0;
    const dropOffCount = index === 0 ? totalUsers - completedCount : previousCount - completedCount;
    const dropOffPercentage = index === 0 
      ? ((totalUsers - completedCount) / totalUsers) * 100 
      : ((previousCount - completedCount) / previousCount) * 100;
    
    previousCount = completedCount;
    
    return {
      stage,
      count: completedCount,
      percentage,
      dropOffCount,
      dropOffPercentage
    };
  });
};

/**
 * Calculate the correlation coefficient between two variables
 * @param {Array} xValues - Array of x values
 * @param {Array} yValues - Array of y values
 * @returns {number} - Pearson correlation coefficient (-1 to 1)
 */
export const calculateCorrelation = (xValues, yValues) => {
  if (!xValues || !yValues || xValues.length !== yValues.length || xValues.length === 0) {
    return 0;
  }
  
  const n = xValues.length;
  
  // Calculate means
  const xMean = xValues.reduce((sum, value) => sum + value, 0) / n;
  const yMean = yValues.reduce((sum, value) => sum + value, 0) / n;
  
  // Calculate deviations
  const xDeviation = xValues.map(value => value - xMean);
  const yDeviation = yValues.map(value => value - yMean);
  
  // Calculate sum of squared deviations
  const xSumSquaredDeviation = xDeviation.reduce((sum, deviation) => sum + Math.pow(deviation, 2), 0);
  const ySumSquaredDeviation = yDeviation.reduce((sum, deviation) => sum + Math.pow(deviation, 2), 0);
  
  // Calculate sum of products of deviations
  let sumProductDeviations = 0;
  for (let i = 0; i < n; i++) {
    sumProductDeviations += xDeviation[i] * yDeviation[i];
  }
  
  // Calculate correlation coefficient
  const correlationCoefficient = sumProductDeviations / Math.sqrt(xSumSquaredDeviation * ySumSquaredDeviation);
  
  return correlationCoefficient;
};

/**
 * Format data for a radar chart (skill assessment)
 * @param {Array} skills - Array of skills with scores
 * @param {Object} options - Chart options
 * @param {Array} options.levels - Array of level values (default: [0, 20, 40, 60, 80, 100])
 * @param {number} options.maxValue - Maximum value (default: 100)
 * @returns {Object} - Formatted radar chart data
 */
export const formatRadarChartData = (skills, options = {}) => {
  if (!skills || !Array.isArray(skills)) return { axes: [], levels: [] };
  
  const defaultOptions = {
    levels: [0, 20, 40, 60, 80, 100],
    maxValue: 100
  };
  
  const chartOptions = { ...defaultOptions, ...options };
  
  // Format axes
  const axes = skills.map(skill => ({
    axis: skill.name,
    value: skill.score / chartOptions.maxValue
  }));
  
  // Format levels
  const levels = chartOptions.levels.map(level => ({
    level,
    levelValue: level / chartOptions.maxValue
  }));
  
  return {
    axes,
    levels
  };
};

/**
 * Calculate weighted score based on weights and scores
 * @param {Object} scores - Object with score values by category
 * @param {Object} weights - Object with weights by category
 * @returns {number} - Weighted score
 */
export const calculateWeightedScore = (scores, weights) => {
  if (!scores || !weights) return 0;
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const category in weights) {
    if (scores.hasOwnProperty(category)) {
      weightedSum += scores[category] * weights[category];
      totalWeight += weights[category];
    }
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

/**
 * Calculate percentile ranking
 * @param {number} value - The value to find percentile for
 * @param {Array} dataSet - Array of all values
 * @returns {number} - Percentile rank (0-100)
 */
export const calculatePercentile = (value, dataSet) => {
  if (!value || !dataSet || !Array.isArray(dataSet) || dataSet.length === 0) return 0;
  
  const sortedData = [...dataSet].sort((a, b) => a - b);
  const position = sortedData.findIndex(item => item >= value);
  
  if (position === -1) return 100; // Value is greater than all items
  
  return (position / sortedData.length) * 100;
};

/**
 * Generate data for a normal distribution chart
 * @param {number} mean - Mean value
 * @param {number} standardDeviation - Standard deviation
 * @param {number} pointCount - Number of points to generate (default: 100)
 * @param {number} rangeMultiplier - Range multiplier (default: 3)
 * @returns {Array} - Array of points for the normal distribution curve
 */
export const generateNormalDistribution = (
  mean,
  standardDeviation,
  pointCount = 100,
  rangeMultiplier = 3
) => {
  if (standardDeviation <= 0) return [];
  
  const points = [];
  const min = mean - (standardDeviation * rangeMultiplier);
  const max = mean + (standardDeviation * rangeMultiplier);
  const step = (max - min) / (pointCount - 1);
  
  for (let i = 0; i < pointCount; i++) {
    const x = min + (step * i);
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(standardDeviation, 2));
    const y = (1 / (standardDeviation * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    
    points.push({ x, y });
  }
  
  return points;
};

/**
 * Calculate moving average for time series data
 * @param {Array} data - Array of data points with value property
 * @param {number} windowSize - Size of the moving average window (default: 7)
 * @returns {Array} - Array of data points with moving average
 */
export const calculateMovingAverage = (data, windowSize = 7) => {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  
  // Make a copy of the original data
  const result = [...data];
  
  for (let i = 0; i < data.length; i++) {
    // Determine window range (handle edge cases)
    const windowStart = Math.max(0, i - Math.floor(windowSize / 2));
    const windowEnd = Math.min(data.length - 1, i + Math.floor(windowSize / 2));
    const actualWindowSize = windowEnd - windowStart + 1;
    
    // Calculate sum of values in the window
    let sum = 0;
    for (let j = windowStart; j <= windowEnd; j++) {
      sum += data[j].value;
    }
    
    // Calculate average
    result[i].movingAverage = sum / actualWindowSize;
  }
  
  return result;
};

export default {
  calculateCompletionRate,
  calculateAverageCompletionTime,
  calculateEngagementScore,
  calculateSkillGap,
  calculateLearningEffectiveness,
  groupDataByField,
  aggregateData,
  calculateRetention,
  calculateComplianceRate,
  generateChartColors,
  formatTimeSeriesData,
  processFunnelData,
  calculateCorrelation,
  formatRadarChartData,
  calculateWeightedScore,
  calculatePercentile,
  generateNormalDistribution,
  calculateMovingAverage
};
