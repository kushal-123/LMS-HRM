import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  LineChart,
  Line
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  Warning, 
  CheckCircle, 
  Error,
  RemoveRedEye,
  EmailOutlined
} from '@mui/icons-material';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ 
        backgroundColor: 'white', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px' 
      }}>
        <p className="label" style={{ margin: 0 }}>{`${label}`}</p>
        <p style={{ margin: 0 }}>{`Compliance Rate: ${payload[0].value}%`}</p>
        <p style={{ margin: 0, fontSize: '12px' }}>{`Required Courses: ${payload[0].payload.requiredCourseCount}`}</p>
        <p style={{ margin: 0, fontSize: '12px' }}>{`Employees: ${payload[0].payload.employeeCount}`}</p>
      </div>
    );
  }

  return null;
};

const ComplianceStatusChip = ({ value }) => {
  if (value >= 90) {
    return <Chip icon={<CheckCircle />} label="Compliant" color="success" size="small" />;
  } else if (value >= 75) {
    return <Chip icon={<Warning />} label="Warning" color="warning" size="small" />;
  } else {
    return <Chip icon={<Error />} label="Non-Compliant" color="error" size="small" />;
  }
};

const DepartmentComplianceReport = ({ data, loading, department }) => {
  const [chartView, setChartView] = useState('departments');
  const [courseView, setCourseView] = useState('compliance');
  
  const handleChartViewChange = (event, newView) => {
    if (newView !== null) {
      setChartView(newView);
    }
  };
  
  const handleCourseViewChange = (event, newView) => {
    if (newView !== null) {
      setCourseView(newView);
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
  
  if (!data || !data.departments || data.departments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography variant="h6" color="textSecondary">
          No compliance data available
        </Typography>
      </Box>
    );
  }
  
  // Check if we have department-specific or all departments data
  const isDepartmentSpecific = department !== 'all';
  
  // Process data based on whether we're showing one department or all
  const processDepartmentData = () => {
    if (isDepartmentSpecific) {
      // Filter for specific department
      const deptData = data.departments.find(d => d.name === department);
      
      if (!deptData) {
        return [];
      }
      
      return [deptData];
    }
    
    // Return all departments, sorted by compliance rate
    return [...data.departments].sort((a, b) => a.complianceRate - b.complianceRate);
  };
  
  // Process course compliance data
  const processCourseData = () => {
    let courseData = [];
    
    if (isDepartmentSpecific) {
      // Get courses for specific department
      const deptData = data.departments.find(d => d.name === department);
      courseData = deptData?.courses || [];
    } else {
      // Aggregate all courses across departments
      const courseMap = {};
      
      data.departments.forEach(dept => {
        if (dept.courses) {
          dept.courses.forEach(course => {
            if (!courseMap[course.id]) {
              courseMap[course.id] = {
                id: course.id,
                title: course.title,
                complianceRate: 0,
                requiredFor: [],
                dueDates: []
              };
            }
            
            // Add department to required list
            courseMap[course.id].requiredFor.push(dept.name);
            
            // Add weighted compliance to average later
            courseMap[course.id].complianceRate += (course.complianceRate * dept.employeeCount);
            
            // Add due date if exists
            if (course.dueDate) {
              courseMap[course.id].dueDates.push(course.dueDate);
            }
          });
        }
      });
      
      // Calculate final compliance rates
      Object.keys(courseMap).forEach(id => {
        const totalEmployees = courseMap[id].requiredFor.reduce((sum, deptName) => {
          const dept = data.departments.find(d => d.name === deptName);
          return sum + (dept?.employeeCount || 0);
        }, 0);
        
        courseMap[id].complianceRate = totalEmployees > 0 
          ? Math.round(courseMap[id].complianceRate / totalEmployees) 
          : 0;
        
        // Get earliest due date if multiple exist
        if (courseMap[id].dueDates.length > 0) {
          courseMap[id].dueDate = new Date(Math.min(...courseMap[id].dueDates.map(d => new Date(d))));
        }
      });
      
      courseData = Object.values(courseMap);
    }
    
    // Sort courses by compliance rate or due date
    if (courseView === 'compliance') {
      return courseData.sort((a, b) => a.complianceRate - b.complianceRate);
    } else {
      // Sort by due date, putting courses with due dates first
      return courseData.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (a.dueDate) {
          return -1;
        } else if (b.dueDate) {
          return 1;
        }
        return 0;
      });
    }
  };
  
  // Calculate overall compliance
  const calculateOverallCompliance = () => {
    let totalEmployees = 0;
    let weightedComplianceSum = 0;
    
    data.departments.forEach(dept => {
      totalEmployees += dept.employeeCount;
      weightedComplianceSum += (dept.complianceRate * dept.employeeCount);
    });
    
    return totalEmployees > 0 ? Math.round(weightedComplianceSum / totalEmployees) : 0;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate days until due
  const calculateDaysUntil = (dateString) => {
    if (!dateString) return null;
    
    const dueDate = new Date(dateString);
    const today = new Date();
    
    // Reset time portion for accurate day calculation
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Prepare data for charts
  const departmentData = processDepartmentData();
  const courseData = processCourseData();
  const overallCompliance = calculateOverallCompliance();
  
  // Non-compliant departments (less than 75%)
  const nonCompliantDepts = data.departments.filter(d => d.complianceRate < 75);
  
  // Urgent courses (due within 30 days and compliance < 90%)
  const urgentCourses = courseData.filter(c => {
    const daysUntil = calculateDaysUntil(c.dueDate);
    return daysUntil !== null && daysUntil <= 30 && c.complianceRate < 90;
  });
  
  // Chart colors
  const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE'];
  const getColorByCompliance = (rate) => {
    if (rate < 75) return '#FF8042';
    if (rate < 90) return '#FFBB28';
    return '#00C49F';
  };
  
  // Trends data - simplified for this implementation
  const trendData = data.trends || [
    { month: 'Jan', compliance: 78 },
    { month: 'Feb', compliance: 82 },
    { month: 'Mar', compliance: 85 },
    { month: 'Apr', compliance: 82 },
    { month: 'May', compliance: 86 },
    { month: 'Jun', compliance: overallCompliance }
  ];
  
  return (
    <div className="compliance-report-container">
      {/* Chart Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          {isDepartmentSpecific ? `${department} Compliance Report` : 'Department Compliance Report'}
        </Typography>
        
        <ToggleButtonGroup
          value={chartView}
          exclusive
          onChange={handleChartViewChange}
          aria-label="chart view"
          size="small"
        >
          <ToggleButton value="departments" aria-label="departments">
            Departments
          </ToggleButton>
          <ToggleButton value="courses" aria-label="courses">
            Courses
          </ToggleButton>
          <ToggleButton value="trends" aria-label="trends">
            Trends
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Overall compliance status */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Overall Compliance Rate
          </Typography>
          <Typography variant="h3">
            {isDepartmentSpecific ? departmentData[0]?.complianceRate || 0 : overallCompliance}%
          </Typography>
          <Box mt={1} display="flex" alignItems="center" gap={1}>
            <ComplianceStatusChip value={isDepartmentSpecific ? departmentData[0]?.complianceRate || 0 : overallCompliance} />
            <Typography variant="body2" color="textSecondary">
              Target: 95%
            </Typography>
          </Box>
        </Box>
        
        <Box width="60%" marginLeft={4}>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(100, isDepartmentSpecific ? departmentData[0]?.complianceRate || 0 : overallCompliance)} 
            sx={{ 
              height: 20, 
              borderRadius: 2,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getColorByCompliance(isDepartmentSpecific ? departmentData[0]?.complianceRate || 0 : overallCompliance)
              }
            }}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption">0%</Typography>
            <Typography variant="caption">50%</Typography>
            <Typography variant="caption">100%</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Main Chart Area */}
      {chartView === 'departments' && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom align="center">
            Department Compliance Overview
          </Typography>
          
          {isDepartmentSpecific ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
              <Typography variant="h6" color="textSecondary">
                Showing data for {department} only
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={departmentData}
                margin={{ top: 20, right: 30, left: 30, bottom: 70 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150} 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="complianceRate" name="Compliance Rate">
                  {departmentData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColorByCompliance(entry.complianceRate)} 
                    />
                  ))}
                  <LabelList dataKey="complianceRate" position="right" formatter={(value) => `${value}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      )}
      
      {chartView === 'courses' && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              Required Course Compliance
            </Typography>
            
            <ToggleButtonGroup
              value={courseView}
              exclusive
              onChange={handleCourseViewChange}
              aria-label="course view"
              size="small"
            >
              <ToggleButton value="compliance" aria-label="compliance">
                By Compliance
              </ToggleButton>
              <ToggleButton value="due" aria-label="due">
                By Due Date
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Course Title</TableCell>
                  <TableCell align="center">Compliance</TableCell>
                  <TableCell align="center">Due Date</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courseData.map((course) => {
                  const daysUntil = calculateDaysUntil(course.dueDate);
                  return (
                    <TableRow 
                      key={course.id}
                      sx={{ 
                        backgroundColor: daysUntil !== null && daysUntil <= 14 && course.complianceRate < 90
                          ? 'rgba(255, 235, 235, 0.5)'
                          : 'inherit'
                      }}
                    >
                      <TableCell component="th" scope="row">
                        {course.title}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <Box width="80px" mr={1}>
                            <LinearProgress 
                              variant="determinate" 
                              value={course.complianceRate} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 5,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getColorByCompliance(course.complianceRate)
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="body2">
                            {course.complianceRate}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {course.dueDate ? (
                          <Box>
                            {formatDate(course.dueDate)}
                            {daysUntil !== null && daysUntil <= 30 && (
                              <Typography 
                                variant="caption" 
                                display="block"
                                color={daysUntil <= 7 ? 'error' : daysUntil <= 14 ? 'warning.main' : 'text.secondary'}
                              >
                                {daysUntil <= 0 ? 'Overdue!' : `${daysUntil} days left`}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          'Not set'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <ComplianceStatusChip value={course.complianceRate} />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center">
                          <IconButton size="small" title="View Details">
                            <RemoveRedEye fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Send Reminder">
                            <EmailOutlined fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {chartView === 'trends' && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom align="center">
            Compliance Trend (Last 6 Months)
          </Typography>
          
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={trendData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[50, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="compliance" 
                name="Compliance Rate %" 
                stroke="#4a6cf7" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}
      
      {/* Summary Cards */}
      <Grid container spacing={3}>
        {nonCompliantDepts.length > 0 && (
          <Grid item xs={12}>
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small">
                  View All
                </Button>
              }
            >
              <Typography variant="subtitle2">
                {nonCompliantDepts.length} {nonCompliantDepts.length === 1 ? 'department' : 'departments'} below 75% compliance threshold
              </Typography>
            </Alert>
          </Grid>
        )}
        
        {urgentCourses.length > 0 && (
          <Grid item xs={12}>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small">
                  Send Reminders
                </Button>
              }
            >
              <Typography variant="subtitle2">
                {urgentCourses.length} {urgentCourses.length === 1 ? 'course' : 'courses'} with upcoming deadlines need attention
              </Typography>
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Status Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography color="text.secondary" variant="body2">
                      Compliant
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {data.departments.filter(d => d.complianceRate >= 90).length}
                    </Typography>
                    <Typography variant="caption">
                      Departments
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography color="text.secondary" variant="body2">
                      Warning
                    </Typography>
                    <Typography variant="h5" color="warning.main">
                      {data.departments.filter(d => d.complianceRate >= 75 && d.complianceRate < 90).length}
                    </Typography>
                    <Typography variant="caption">
                      Departments
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography color="text.secondary" variant="body2">
                      Non-Compliant
                    </Typography>
                    <Typography variant="h5" color="error.main">
                      {data.departments.filter(d => d.complianceRate < 75).length}
                    </Typography>
                    <Typography variant="caption">
                      Departments
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box mt={3}>
                <Typography variant="body2" paragraph>
                  {data.departments.filter(d => d.complianceRate >= 90).length > data.departments.length / 2 ? (
                    <span>Overall compliance is improving with the majority of departments meeting targets.</span>
                  ) : (
                    <span>Compliance challenges persist with several departments below target thresholds.</span>
                  )}
                </Typography>
                <Typography variant="body2">
                  Target compliance rate: <strong>95%</strong> for all departments.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Action Recommendations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box>
                {nonCompliantDepts.length > 0 ? (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                      <Warning fontSize="small" color="warning" sx={{ mr: 1 }} />
                      Priority Departments
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Focus on {nonCompliantDepts.slice(0, 2).map(d => d.name).join(', ')}
                      {nonCompliantDepts.length > 2 ? ` and ${nonCompliantDepts.length - 2} others` : ''} 
                      which are below 75% compliance.
                    </Typography>
                  </Box>
                ) : (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      All departments above critical threshold
                    </Typography>
                  </Box>
                )}
                
                {urgentCourses.length > 0 ? (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                      <Error fontSize="small" color="error" sx={{ mr: 1 }} />
                      Urgent Course Compliance
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Send reminders for {urgentCourses[0].title}
                      {urgentCourses.length > 1 ? ` and ${urgentCourses.length - 1} other courses` : ''}
                      with upcoming deadlines and low compliance.
                    </Typography>
                  </Box>
                ) : (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      No urgent course deadlines
                    </Typography>
                  </Box>
                )}
                
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommended Actions
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ul style={{ paddingLeft: '20px', margin: '0' }}>
                      {nonCompliantDepts.length > 0 && (
                        <li>Schedule compliance review meetings with department heads</li>
                      )}
                      {urgentCourses.length > 0 && (
                        <li>Send targeted reminder emails for critical courses</li>
                      )}
                      <li>Update compliance dashboard for management review</li>
                      {overallCompliance < 85 && (
                        <li>Consider extending deadlines for complex courses</li>
                      )}
                    </ul>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

DepartmentComplianceReport.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool,
  department: PropTypes.string
};

export default DepartmentComplianceReport;
