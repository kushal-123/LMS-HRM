import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Card, CardContent, Typography, Box, Paper, Tabs, Tab, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';

// Analytics components
import LearningEffectivenessChart from './LearningEffectivenessChart';
import SkillGapAnalysisChart from './SkillGapAnalysisChart';
import CareerPathPredictionChart from './CareerPathPredictionChart';
import DepartmentComplianceReport from './DepartmentComplianceReport';

// Actions
import { 
  getLearningEffectivenessData, 
  getSkillGapData, 
  getComplianceData, 
  getCareerPathData 
} from '../../redux/thunks/analyticsThunks';

// Styles
import '../../styles/analytics.css';

// Panel component for tab content
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { 
    learningEffectiveness, 
    skillGap, 
    compliance, 
    careerPath, 
    loading 
  } = useSelector(state => state.analytics);
  
  // State for filters and tabs
  const [selectedTab, setSelectedTab] = useState(0);
  const [department, setDepartment] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 180)), // 6 months ago
    endDate: new Date()
  });
  
  // Fetch data on component mount
  useEffect(() => {
    dispatch(getLearningEffectivenessData({ 
      department, 
      startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
      endDate: format(dateRange.endDate, 'yyyy-MM-dd')
    }));
    
    dispatch(getComplianceData({ department }));
    
    // Only load these for all-department view initially to save resources
    if (department === 'all') {
      dispatch(getSkillGapData());
      dispatch(getCareerPathData());
    }
  }, [dispatch]); // Empty dependency array ensures it only runs once

  // Handle filter changes
  const handleDepartmentChange = (e) => {
    const newDepartment = e.target.value;
    setDepartment(newDepartment);
    
    // Refresh data with new department filter
    dispatch(getLearningEffectivenessData({ 
      department: newDepartment, 
      startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
      endDate: format(dateRange.endDate, 'yyyy-MM-dd')
    }));
    
    dispatch(getComplianceData({ department: newDepartment }));
    
    if (newDepartment !== 'all') {
      dispatch(getSkillGapData({ department: newDepartment }));
      dispatch(getCareerPathData({ department: newDepartment }));
    } else {
      dispatch(getSkillGapData());
      dispatch(getCareerPathData());
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = (newValue, type) => {
    const newDateRange = { ...dateRange };
    
    if (type === 'start') {
      newDateRange.startDate = newValue;
    } else {
      newDateRange.endDate = newValue;
    }
    
    setDateRange(newDateRange);
    
    // Only refresh learning effectiveness data since it's the only time-based chart
    dispatch(getLearningEffectivenessData({ 
      department, 
      startDate: format(newDateRange.startDate, 'yyyy-MM-dd'),
      endDate: format(newDateRange.endDate, 'yyyy-MM-dd')
    }));
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    
    // Load data for the selected tab if it hasn't been loaded yet
    switch(newValue) {
      case 0: // Learning Effectiveness
        dispatch(getLearningEffectivenessData({ 
          department, 
          startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
          endDate: format(dateRange.endDate, 'yyyy-MM-dd')
        }));
        break;
      case 1: // Skill Gap Analysis
        dispatch(getSkillGapData({ department }));
        break;
      case 2: // Compliance
        dispatch(getComplianceData({ department }));
        break;
      case 3: // Career Path
        dispatch(getCareerPathData({ department }));
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="analytics-dashboard">
      <Typography variant="h4" gutterBottom className="dashboard-title">
        Learning Analytics Dashboard
      </Typography>
      
      {/* Filters */}
      <Paper className="filters-container">
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="department-select-label">Department</InputLabel>
              <Select
                labelId="department-select-label"
                id="department-select"
                value={department}
                label="Department"
                onChange={handleDepartmentChange}
              >
                <MenuItem value="all">All Departments</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="HR">Human Resources</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Customer Support">Customer Support</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(newValue) => handleDateRangeChange(newValue, 'start')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(newValue) => handleDateRangeChange(newValue, 'end')}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDate={dateRange.startDate}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Analytics Tabs */}
      <Paper className="analytics-tabs-container">
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Learning Effectiveness" />
          <Tab label="Skill Gap Analysis" />
          <Tab label="Compliance Tracking" />
          <Tab label="Career Path Predictions" />
        </Tabs>
        
        {/* Tab Panels */}
        <TabPanel value={selectedTab} index={0}>
          <LearningEffectivenessChart 
            data={learningEffectiveness} 
            loading={loading} 
            dateRange={dateRange} 
          />
        </TabPanel>
        
        <TabPanel value={selectedTab} index={1}>
          <SkillGapAnalysisChart 
            data={skillGap} 
            loading={loading} 
            department={department} 
          />
        </TabPanel>
        
        <TabPanel value={selectedTab} index={2}>
          <DepartmentComplianceReport 
            data={compliance} 
            loading={loading} 
            department={department} 
          />
        </TabPanel>
        
        <TabPanel value={selectedTab} index={3}>
          <CareerPathPredictionChart 
            data={careerPath} 
            loading={loading} 
            department={department} 
          />
        </TabPanel>
      </Paper>
      
      {/* Summary Cards */}
      <Grid container spacing={3} className="summary-cards">
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overall Learning Effectiveness
              </Typography>
              <Typography variant="h4">
                {loading ? 'Loading...' : `${calculateEffectivenessScore(learningEffectiveness)}%`}
              </Typography>
              <Typography color="textSecondary">
                vs target of 75%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Skill Gap Reduction
              </Typography>
              <Typography variant="h4">
                {loading ? 'Loading...' : `${calculateSkillGapReduction(skillGap)}%`}
              </Typography>
              <Typography color="textSecondary">
                vs previous quarter
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Compliance Rate
              </Typography>
              <Typography variant="h4">
                {loading ? 'Loading...' : `${calculateComplianceRate(compliance)}%`}
              </Typography>
              <Typography color="textSecondary">
                vs target of 95%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Learner Engagement
              </Typography>
              <Typography variant="h4">
                {loading ? 'Loading...' : calculateEngagementScore(learningEffectiveness)}
              </Typography>
              <Typography color="textSecondary">
                Score out of 10
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

// Helper functions for calculating summary metrics
const calculateEffectivenessScore = (data) => {
  if (!data || !data.length) return 'N/A';
  
  // For simplicity, we're using the last data point's score
  const latestData = data[data.length - 1];
  return latestData?.effectivenessScore || 0;
};

const calculateSkillGapReduction = (data) => {
  if (!data || !data.currentSkillLevels || !data.targetSkillLevels) return 'N/A';
  
  // Calculate the average gap reduction from previous data
  if (data.previousSkillLevels) {
    const currentGap = calculateAverageGap(data.currentSkillLevels, data.targetSkillLevels);
    const previousGap = calculateAverageGap(data.previousSkillLevels, data.targetSkillLevels);
    
    // If gap was reduced, calculate percentage
    if (previousGap > currentGap) {
      return Math.round((1 - (currentGap / previousGap)) * 100);
    } else {
      return 0;
    }
  }
  
  return 'N/A';
};

const calculateAverageGap = (current, target) => {
  if (!current || !target) return 0;
  
  let totalGap = 0;
  let count = 0;
  
  // Iterate through skills
  Object.keys(target).forEach(skill => {
    if (current[skill] !== undefined) {
      totalGap += Math.max(0, target[skill] - current[skill]);
      count++;
    }
  });
  
  return count > 0 ? totalGap / count : 0;
};

const calculateComplianceRate = (data) => {
  if (!data || !data.departments) return 'N/A';
  
  // Calculate average compliance across departments
  let totalCompliance = 0;
  let totalDepts = 0;
  
  data.departments.forEach(dept => {
    if (dept.complianceRate !== undefined) {
      totalCompliance += dept.complianceRate;
      totalDepts++;
    }
  });
  
  return totalDepts > 0 ? Math.round(totalCompliance / totalDepts) : 0;
};

const calculateEngagementScore = (data) => {
  if (!data || !data.length) return 'N/A';
  
  // Calculate average engagement across all data points
  let totalEngagement = 0;
  
  data.forEach(point => {
    if (point.engagementScore !== undefined) {
      totalEngagement += point.engagementScore;
    }
  });
  
  const averageEngagement = data.length > 0 ? (totalEngagement / data.length) : 0;
  return (averageEngagement / 10).toFixed(1); // Scale to 0-10
};

export default AnalyticsDashboard;
