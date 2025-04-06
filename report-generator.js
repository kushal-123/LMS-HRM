import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  TextField,
  CircularProgress,
  Box,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import FilterListIcon from '@mui/icons-material/FilterList';

import { fetchReportData } from '../../redux/thunks/analyticsThunks';
import { formatDate, formatCurrency, formatPercentage } from '../../utils/formatters';
import { validateDateRange } from '../../utils/validators';
import { LearningEffectivenessChart } from '../analytics/LearningEffectivenessChart';
import { SkillGapAnalysisChart } from '../analytics/SkillGapAnalysisChart';
import { DepartmentComplianceReport } from '../analytics/DepartmentComplianceReport';

const ReportGenerator = () => {
  const dispatch = useDispatch();
  const { reportData, loading, error } = useSelector((state) => state.analytics);
  const { departments, courses } = useSelector((state) => state.courses);
  
  const [reportType, setReportType] = useState('course-completion');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });
  const [department, setDepartment] = useState('all');
  const [format, setFormat] = useState('pdf');
  const [filters, setFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  const reportTypes = [
    { value: 'course-completion', label: 'Course Completion', icon: <BarChartIcon /> },
    { value: 'learner-engagement', label: 'Learner Engagement', icon: <PieChartIcon /> },
    { value: 'skill-gap-analysis', label: 'Skill Gap Analysis', icon: <TableChartIcon /> },
    { value: 'compliance-tracking', label: 'Compliance Tracking', icon: <BarChartIcon /> },
    { value: 'learning-effectiveness', label: 'Learning Effectiveness', icon: <PieChartIcon /> },
    { value: 'department-performance', label: 'Department Performance', icon: <TableChartIcon /> },
  ];
  
  useEffect(() => {
    // Reset filters when report type changes
    setFilters({});
  }, [reportType]);
  
  const handleGenerateReport = () => {
    // Validate date range
    if (!validateDateRange(dateRange.startDate, dateRange.endDate)) {
      return;
    }
    
    setGeneratingReport(true);
    
    // Fetch report data
    dispatch(fetchReportData({
      reportType,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      department,
      filters
    })).then(() => {
      setGeneratingReport(false);
    });
  };
  
  const handleExportReport = () => {
    // Logic to export report in selected format
    console.log(`Exporting report as ${format}`);
    
    // API call to export report
    fetch('/api/analytics/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType,
        dateRange,
        department,
        filters,
        format
      }),
    })
    .then(response => response.blob())
    .then(blob => {
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${formatDate(new Date(), 'YYYY-MM-DD')}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  };
  
  const handleAddFilter = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  
  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };
  
  const renderChart = () => {
    if (!reportData) return null;
    
    switch (reportType) {
      case 'learning-effectiveness':
        return <LearningEffectivenessChart data={reportData} />;
      case 'skill-gap-analysis':
        return <SkillGapAnalysisChart data={reportData} />;
      case 'compliance-tracking':
        return <DepartmentComplianceReport data={reportData} />;
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              Select a report type and generate report to view data.
            </Typography>
          </Box>
        );
    }
  };
  
  const renderAdvancedFilters = () => {
    if (!showAdvancedFilters) return null;
    
    // Render different filter options based on report type
    switch (reportType) {
      case 'course-completion':
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  value={filters.courseId || ''}
                  label="Course"
                  onChange={(e) => handleAddFilter('courseId', e.target.value)}
                >
                  <MenuItem value="">All Courses</MenuItem>
                  {courses && courses.map((course) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Completion Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Completion Status"
                  onChange={(e) => handleAddFilter('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="not-started">Not Started</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 'skill-gap-analysis':
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Skill Category</InputLabel>
                <Select
                  value={filters.skillCategory || ''}
                  label="Skill Category"
                  onChange={(e) => handleAddFilter('skillCategory', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="technical">Technical</MenuItem>
                  <MenuItem value="soft-skills">Soft Skills</MenuItem>
                  <MenuItem value="leadership">Leadership</MenuItem>
                  <MenuItem value="compliance">Compliance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Proficiency Level</InputLabel>
                <Select
                  value={filters.proficiencyLevel || ''}
                  label="Proficiency Level"
                  onChange={(e) => handleAddFilter('proficiencyLevel', e.target.value)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Report Generator
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              label="Report Type"
              onChange={(e) => setReportType(e.target.value)}
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={department}
              label="Department"
              onChange={(e) => setDepartment(e.target.value)}
            >
              <MenuItem value="all">All Departments</MenuItem>
              {departments && departments.map((dept) => (
                <MenuItem key={dept._id} value={dept._id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(newValue) => {
                setDateRange({
                  ...dateRange,
                  startDate: newValue
                });
              }}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(newValue) => {
                setDateRange({
                  ...dateRange,
                  endDate: newValue
                });
              }}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </Button>
          
          {renderAdvancedFilters()}
          
          {Object.keys(filters).length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(filters).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  onDelete={() => handleRemoveFilter(key)}
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={format}
              label="Export Format"
              onChange={(e) => setFormat(e.target.value)}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateReport}
            disabled={loading || generatingReport}
            sx={{ flex: 1 }}
          >
            {loading || generatingReport ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Generate Report'
            )}
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportReport}
            disabled={!reportData || loading || generatingReport}
            sx={{ flex: 1 }}
          >
            Export
          </Button>
        </Grid>
      </Grid>
      
      {error && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}
      
      <Box sx={{ mt: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderChart()
        )}
      </Box>
    </Card>
  );
};

export default ReportGenerator;
