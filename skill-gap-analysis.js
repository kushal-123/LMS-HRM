import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';

const SkillGapAnalysisChart = ({ data, loading, department }) => {
  const [chartView, setChartView] = useState('radar');
  const [skillCategory, setSkillCategory] = useState('all');
  
  const handleChartViewChange = (event, newView) => {
    if (newView !== null) {
      setChartView(newView);
    }
  };
  
  const handleCategoryChange = (event) => {
    setSkillCategory(event.target.value);
  };
  
  // If loading or no data
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!data || !data.currentSkillLevels || !data.targetSkillLevels) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography variant="h6" color="textSecondary">
          No skill gap data available for {department === 'all' ? 'all departments' : department}
        </Typography>
      </Box>
    );
  }
  
  // Process data for charts
  const processChartData = () => {
    const result = [];
    const categories = new Set();
    const skillCategories = {};
    
    // Gather all skills and their categories
    Object.keys(data.targetSkillLevels).forEach(skill => {
      const category = data.skillCategories?.[skill] || 'Uncategorized';
      categories.add(category);
      skillCategories[skill] = category;
    });
    
    // Process each skill into chart format
    Object.keys(data.targetSkillLevels).forEach(skill => {
      const category = skillCategories[skill];
      
      // Filter by selected category if not "all"
      if (skillCategory !== 'all' && category !== skillCategory) {
        return;
      }
      
      result.push({
        skill,
        category,
        current: data.currentSkillLevels[skill] || 0,
        target: data.targetSkillLevels[skill] || 0,
        gap: Math.max(0, (data.targetSkillLevels[skill] || 0) - (data.currentSkillLevels[skill] || 0)),
        previous: data.previousSkillLevels?.[skill] || 0
      });
    });
    
    // Sort by gap size (descending)
    return result.sort((a, b) => b.gap - a.gap);
  };
  
  // Calculate statistics
  const calculateStats = (chartData) => {
    const totalSkills = chartData.length;
    const skillsWithGap = chartData.filter(item => item.gap > 0).length;
    const totalGapPoints = chartData.reduce((sum, item) => sum + item.gap, 0);
    const avgGap = totalSkills > 0 ? (totalGapPoints / totalSkills).toFixed(1) : 0;
    
    // Calculate improvement if previous data exists
    let improvementRate = 'N/A';
    if (data.previousSkillLevels) {
      let improvedSkills = 0;
      chartData.forEach(item => {
        if (item.current > item.previous) {
          improvedSkills++;
        }
      });
      
      improvementRate = totalSkills > 0 ? Math.round((improvedSkills / totalSkills) * 100) : 0;
    }
    
    // Top skill gaps
    const topGaps = chartData.slice(0, 5);
    
    // Skills with no gap
    const noGapSkills = chartData.filter(item => item.gap === 0);
    
    return {
      totalSkills,
      skillsWithGap,
      avgGap,
      improvementRate,
      topGaps,
      noGapSkills
    };
  };
  
  // Format data for radar chart
  const formatRadarData = (chartData) => {
    // Limit to top 8 skills for radar clarity
    return chartData.slice(0, 8).map(item => ({
      skill: item.skill,
      current: item.current,
      target: item.target
    }));
  };
  
  // Get unique skill categories
  const getSkillCategories = () => {
    const categories = new Set();
    
    Object.keys(data.targetSkillLevels).forEach(skill => {
      const category = data.skillCategories?.[skill] || 'Uncategorized';
      categories.add(category);
    });
    
    return Array.from(categories);
  };
  
  const chartData = processChartData();
  const stats = calculateStats(chartData);
  const radarData = formatRadarData(chartData);
  const skillCategories = getSkillCategories();
  
  // Bar chart colors
  const gapColor = '#f45b5b';
  const currentColor = '#4a6cf7';
  const targetColor = '#f7c948';
  
  return (
    <div className="skill-gap-container">
      {/* Chart Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Skill Gap Analysis
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" style={{ minWidth: 150 }}>
            <InputLabel id="skill-category-label">Skill Category</InputLabel>
            <Select
              labelId="skill-category-label"
              id="skill-category"
              value={skillCategory}
              label="Skill Category"
              onChange={handleCategoryChange}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {skillCategories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <ToggleButtonGroup
            value={chartView}
            exclusive
            onChange={handleChartViewChange}
            aria-label="chart view"
            size="small"
          >
            <ToggleButton value="radar" aria-label="radar">
              Radar View
            </ToggleButton>
            <ToggleButton value="bar" aria-label="bar">
              Gap View
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      {/* Department info */}
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        Department: {department === 'all' ? 'All Departments' : department}
      </Typography>
      
      {/* Main Chart */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <ResponsiveContainer width="100%" height={400}>
          {chartView === 'radar' ? (
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={30} domain={[0, 5]} />
              <Radar
                name="Current Level"
                dataKey="current"
                stroke={currentColor}
                fill={currentColor}
                fillOpacity={0.6}
              />
              <Radar
                name="Target Level"
                dataKey="target"
                stroke={targetColor}
                fill={targetColor}
                fillOpacity={0.6}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          ) : (
            <BarChart
              data={chartData.slice(0, 10)} // Show top 10 gaps
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" domain={[0, 5]} />
              <YAxis type="category" dataKey="skill" width={100} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" name="Current Level" fill={currentColor} />
              <Bar dataKey="target" name="Target Level" fill={targetColor} />
              <Bar dataKey="gap" name="Skill Gap" fill={gapColor} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Paper>
      
      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Skills Analyzed
              </Typography>
              <Typography variant="h4">
                {stats.totalSkills}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {skillCategory === 'all' ? 'Across all categories' : `In ${skillCategory}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Skills with Gap
              </Typography>
              <Typography variant="h4">
                {stats.skillsWithGap} ({stats.totalSkills ? Math.round((stats.skillsWithGap / stats.totalSkills) * 100) : 0}%)
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Need development focus
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Gap Size
              </Typography>
              <Typography variant="h4">
                {stats.avgGap}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                On scale of 0-5
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Skills Improved
              </Typography>
              <Typography variant="h4">
                {stats.improvementRate === 'N/A' ? 'N/A' : `${stats.improvementRate}%`}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Since last assessment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Top Gaps and Recommendations */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Top Skill Gaps
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List dense>
              {stats.topGaps.map((item, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight={index < 3 ? 'bold' : 'normal'}>
                          {item.skill}
                        </Typography>
                        <Typography>
                          Gap: <span style={{ color: gapColor, fontWeight: 'bold' }}>{item.gap.toFixed(1)}</span>
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="body2">
                          Current: {item.current.toFixed(1)}
                        </Typography>
                        <Typography variant="body2">
                          Target: {item.target.toFixed(1)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Development Focus
              </Typography>
              <Typography variant="body2" paragraph>
                {stats.topGaps.length > 0 ? (
                  <>
                    Prioritize training for <strong>{stats.topGaps[0]?.skill}</strong> and <strong>{stats.topGaps[1]?.skill}</strong>, 
                    which show the largest skill gaps. Consider specialized workshops or mentoring programs.
                  </>
                ) : (
                  'No significant skill gaps identified at this time.'
                )}
              </Typography>
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Suggested Learning Paths
              </Typography>
              <Typography variant="body2" paragraph>
                Based on identified gaps, recommend:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {stats.topGaps.slice(0, 3).map((item, index) => (
                  <Chip 
                    key={index} 
                    label={`${item.skill} Development`} 
                    color="primary" 
                    variant="outlined" 
                  />
                ))}
                {stats.topGaps.length > 0 && (
                  <Chip 
                    label={`${skillCategory === 'all' ? 'Cross-functional' : skillCategory} Skills Bundle`} 
                    color="secondary" 
                    variant="outlined" 
                  />
                )}
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Areas of Strength
              </Typography>
              <Typography variant="body2">
                {stats.noGapSkills.length > 0 ? (
                  <>
                    Team shows proficiency in {stats.noGapSkills.slice(0, 3).map(item => item.skill).join(', ')}
                    {stats.noGapSkills.length > 3 ? ` and ${stats.noGapSkills.length - 3} more areas` : ''}.
                    Consider leveraging these strengths for peer mentoring.
                  </>
                ) : (
                  'No skills currently at or above target levels. Focus on overall skill development.'
                )}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

SkillGapAnalysisChart.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool,
  department: PropTypes.string
};

export default SkillGapAnalysisChart;
