import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  ToggleButtonGroup, 
  ToggleButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { format } from 'date-fns';

const LearningEffectivenessChart = ({ data, loading, dateRange }) => {
  const [chartView, setChartView] = useState('effectiveness');
  
  const handleChartViewChange = (event, newView) => {
    if (newView !== null) {
      setChartView(newView);
    }
  };
  
  // If loading or no data
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!data || !data.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography variant="h6" color="textSecondary">
          No data available for the selected date range
        </Typography>
      </Box>
    );
  }
  
  // Format data for charts
  const formatChartData = () => {
    return data.map(item => ({
      date: format(new Date(item.date), 'MMM dd, yyyy'),
      effectivenessScore: item.effectivenessScore,
      engagementScore: item.engagementScore * 10, // Scale to 0-100 for chart
      skillDevelopment: item.skillDevelopment,
      performanceImpact: item.performanceImpact
    }));
  };
  
  // Format category data for bar chart
  const formatCategoryData = () => {
    // Aggregate all categories across all data points
    const categoryMap = {};
    
    data.forEach(item => {
      item.categoryBreakdown.forEach(category => {
        if (!categoryMap[category.category]) {
          categoryMap[category.category] = {
            category: category.category,
            completionCount: 0,
            uniqueCourseCount: 0
          };
        }
        
        categoryMap[category.category].completionCount += category.completionCount;
        categoryMap[category.category].uniqueCourseCount += category.uniqueCourseCount;
      });
    });
    
    return Object.values(categoryMap);
  };
  
  // Calculate total completions across all data
  const calculateTotalCompletions = () => {
    let total = 0;
    data.forEach(item => {
      total += item.totalCompletions;
    });
    return total;
  };
  
  // Calculate average metrics
  const calculateAverages = () => {
    let totalEffectiveness = 0;
    let totalEngagement = 0;
    let totalSkillsCount = 0;
    
    data.forEach(item => {
      totalEffectiveness += item.effectivenessScore;
      totalEngagement += item.engagementScore;
      totalSkillsCount += item.skillDevelopment.uniqueSkillsCount;
    });
    
    return {
      avgEffectiveness: Math.round(totalEffectiveness / data.length),
      avgEngagement: (totalEngagement / data.length).toFixed(1),
      avgSkillsPerEmployee: (data.reduce((sum, item) => sum + item.skillDevelopment.averageSkillsPerEmployee, 0) / data.length).toFixed(1),
      totalUniqueSkills: totalSkillsCount
    };
  };
  
  // Prepare chart data
  const chartData = formatChartData();
  const categoryData = formatCategoryData();
  const totalCompletions = calculateTotalCompletions();
  const averages = calculateAverages();
  
  // Line chart colors
  const effectivenessColor = '#4a6cf7';
  const engagementColor = '#f7c948';
  
  // Bar chart colors
  const categoryColors = [
    '#4a6cf7', '#f7c948', '#6cb670', '#f45b5b', '#786efa', 
    '#42b3d5', '#f79e48', '#9d50bb', '#ff756b', '#3f9d91'
  ];
  
  return (
    <div className="learning-effectiveness-container">
      {/* Chart Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Learning Effectiveness Analysis
        </Typography>
        
        <ToggleButtonGroup
          value={chartView}
          exclusive
          onChange={handleChartViewChange}
          aria-label="chart view"
          size="small"
        >
          <ToggleButton value="effectiveness" aria-label="effectiveness">
            Effectiveness Trend
          </ToggleButton>
          <ToggleButton value="categories" aria-label="categories">
            Category Breakdown
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Date Range Display */}
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        Date Range: {format(dateRange.startDate, 'MMM dd, yyyy')} - {format(dateRange.endDate, 'MMM dd, yyyy')}
      </Typography>
      
      {/* Line Chart or Bar Chart based on selected view */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <ResponsiveContainer width="100%" height={400}>
          {chartView === 'effectiveness' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="effectivenessScore"
                name="Effectiveness Score"
                stroke={effectivenessColor}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engagementScore"
                name="Engagement Score"
                stroke={engagementColor}
                strokeWidth={2}
              />
            </LineChart>
          ) : (
            <BarChart data={categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completionCount" name="Course Completions" fill="#4a6cf7">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                ))}
              </Bar>
              <Bar dataKey="uniqueCourseCount" name="Unique Courses" fill="#f7c948">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[(index + 3) % categoryColors.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </Paper>
      
      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Effectiveness Score
              </Typography>
              <Typography variant="h4">
                {averages.avgEffectiveness}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Target: 75%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Engagement Score
              </Typography>
              <Typography variant="h4">
                {averages.avgEngagement}/10
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Target: 7.5/10
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Course Completions
              </Typography>
              <Typography variant="h4">
                {totalCompletions}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In selected period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Skills Per Employee
              </Typography>
              <Typography variant="h4">
                {averages.avgSkillsPerEmployee}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                From learning activities
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Insights Section */}
      {chartView === 'effectiveness' && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Key Insights
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Effectiveness Trend
              </Typography>
              <Typography variant="body2" paragraph>
                {averages.avgEffectiveness > 75 ? 
                  'Learning effectiveness is above target, indicating successful learning transfer to job performance.' :
                  'Learning effectiveness is below target. Consider enhancing practical application in courses.'}
              </Typography>
              
              <Typography variant="subtitle1" fontWeight="bold">
                Engagement Correlation
              </Typography>
              <Typography variant="body2">
                {averages.avgEngagement > 7.5 ?
                  'High engagement scores correlate with improved effectiveness, showing learner motivation.' :
                  'Engagement could be improved. Consider interactive elements and real-world applications.'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Skills Development
              </Typography>
              <Typography variant="body2" paragraph>
                Employees gain an average of {averages.avgSkillsPerEmployee} new skills through completed courses.
                {averages.avgSkillsPerEmployee > 3 ?
                  ' This is an excellent rate of skill acquisition.' :
                  ' Consider expanding skill coverage in learning offerings.'}
              </Typography>
              
              <Typography variant="subtitle1" fontWeight="bold">
                Performance Impact
              </Typography>
              <Typography variant="body2">
                {data[data.length - 1].performanceImpact.performanceCorrelation === 'Positive' ?
                  'Learning activities show positive correlation with performance metrics.' :
                  'The correlation between learning and performance metrics could be strengthened.'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {chartView === 'categories' && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Category Analysis
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Top Categories
              </Typography>
              <Typography variant="body2" paragraph>
                {categoryData.sort((a, b) => b.completionCount - a.completionCount)[0]?.category || 'N/A'} has the highest completion rate, 
                showing strong learner interest in this area. 
                {categoryData.length > 1 ? 
                  ` ${categoryData.sort((a, b) => b.uniqueCourseCount - a.uniqueCourseCount)[0]?.category || 'N/A'} has the most unique courses completed.` : 
                  ''}
              </Typography>
              
              <Typography variant="subtitle1" fontWeight="bold">
                Course Variety
              </Typography>
              <Typography variant="body2">
                {categoryData.reduce((total, cat) => total + cat.uniqueCourseCount, 0)} unique courses were completed across {categoryData.length} categories, 
                {categoryData.reduce((total, cat) => total + cat.uniqueCourseCount, 0) > 20 ? 
                  ' showing excellent breadth in learning content.' : 
                  ' suggesting opportunity to expand content variety.'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">
                Improvement Areas
              </Typography>
              <Typography variant="body2" paragraph>
                {categoryData.sort((a, b) => a.completionCount - b.completionCount)[0]?.category || 'N/A'} shows the lowest engagement, 
                which may indicate need for more relevant content or improved course design in this area.
              </Typography>
              
              <Typography variant="subtitle1" fontWeight="bold">
                Recommendations
              </Typography>
              <Typography variant="body2">
                {categoryData.sort((a, b) => a.completionCount - b.completionCount)[0]?.category || 'Low-performing categories'} could 
                benefit from additional interactive content and real-world applications to boost engagement and completion rates.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </div>
  );
};

LearningEffectivenessChart.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  dateRange: PropTypes.object
};

export default LearningEffectivenessChart;
