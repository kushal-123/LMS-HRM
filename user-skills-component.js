import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled linear progress bar
const BorderLinearProgress = styled(LinearProgress)(({ theme, value }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
    backgroundColor: value < 2 ? theme.palette.error.main :
                    value < 3 ? theme.palette.warning.main :
                    value >= 4 ? theme.palette.success.main :
                    theme.palette.primary.main,
  },
}));

// Custom tooltip for radar chart
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Box 
        sx={{ 
          bgcolor: 'background.paper',
          p: 1.5,
          boxShadow: 1,
          borderRadius: 1,
          maxWidth: 200
        }}
      >
        <Typography variant="subtitle2">
          {payload[0].payload.skill}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current Level: <strong>{payload[0].value}</strong>/5
        </Typography>
        {payload[0].payload.averageLevel && (
          <Typography variant="body2" color="text.secondary">
            Team Average: {payload[0].payload.averageLevel.toFixed(1)}/5
          </Typography>
        )}
        {payload[0].payload.targetLevel && (
          <Typography variant="body2" color="text.secondary">
            Target Level: {payload[0].payload.targetLevel}/5
          </Typography>
        )}
      </Box>
    );
  }
  return null;
};

const UserSkillsChart = ({ skills, averageSkills, targetSkills, loading }) => {
  const [skillCategory, setSkillCategory] = useState('all');
  const [viewMode, setViewMode] = useState('radar');
  
  // Get unique skill categories
  const categories = React.useMemo(() => {
    if (!skills || skills.length === 0) return [];
    
    const uniqueCategories = [...new Set(skills.map(skill => skill.category))];
    return ['all', ...uniqueCategories].filter(Boolean);
  }, [skills]);
  
  // Filter skills by category
  const filteredSkills = React.useMemo(() => {
    if (!skills || skills.length === 0) return [];
    
    return skillCategory === 'all' 
      ? skills 
      : skills.filter(skill => skill.category === skillCategory);
  }, [skills, skillCategory]);
  
  // Prepare data for radar chart - limit to top 8 skills for readability
  const radarData = React.useMemo(() => {
    const data = filteredSkills.map(skill => {
      const averageLevel = averageSkills?.[skill.name] || null;
      const targetLevel = targetSkills?.[skill.name] || null;
      
      return {
        skill: skill.name,
        level: skill.level,
        averageLevel,
        targetLevel
      };
    });
    
    // Sort by skill name for consistency
    return data.sort((a, b) => a.skill.localeCompare(b.skill)).slice(0, 8);
  }, [filteredSkills, averageSkills, targetSkills]);
  
  // Handle tab change
  const handleCategoryChange = (event, newValue) => {
    setSkillCategory(newValue);
  };
  
  // Handle view mode change
  const handleViewModeChange = (event, newValue) => {
    if (newValue !== null) {
      setViewMode(newValue);
    }
  };
  
  // Get color based on skill level
  const getSkillLevelColor = (level) => {
    if (level >= 4) return '#38b000'; // Green
    if (level >= 3) return '#4a6cf7'; // Blue
    if (level >= 2) return '#ff9e00'; // Orange
    return '#f44336'; // Red
  };
  
  // Get level label
  const getSkillLevelLabel = (level) => {
    if (level >= 4.5) return 'Expert';
    if (level >= 3.5) return 'Advanced';
    if (level >= 2.5) return 'Intermediate';
    if (level >= 1.5) return 'Basic';
    return 'Novice';
  };
  
  // Calculate skill gap
  const calculateSkillGap = (currentLevel, targetLevel) => {
    if (!targetLevel) return null;
    return Math.max(0, targetLevel - currentLevel);
  };
  
  // Sort skills by name, level, or gap
  const sortedListSkills = React.useMemo(() => {
    if (filteredSkills.length === 0) return [];
    
    // Create copy with target levels
    const skillsWithTarget = filteredSkills.map(skill => ({
      ...skill,
      targetLevel: targetSkills?.[skill.name] || null,
      gap: calculateSkillGap(skill.level, targetSkills?.[skill.name])
    }));
    
    // Sort by gap (largest first), then by name
    return skillsWithTarget.sort((a, b) => {
      if (a.gap !== null && b.gap !== null) {
        if (b.gap !== a.gap) return b.gap - a.gap;
      } else if (a.gap !== null) {
        return -1;
      } else if (b.gap !== null) {
        return 1;
      }
      
      return a.skill.localeCompare(b.skill);
    });
  }, [filteredSkills, targetSkills]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!skills || skills.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No skill data available
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Complete courses to develop and track your skills.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box mb={3} display="flex" justifyContent="space-between" flexWrap="wrap">
        <Typography variant="h5" component="h2" gutterBottom>
          Skills Proficiency
        </Typography>
        
        <Box display="flex" alignItems="center">
          <Tabs 
            value={viewMode} 
            onChange={handleViewModeChange}
            aria-label="chart view mode"
            sx={{ mr: 2 }}
          >
            <Tab value="radar" label="Radar View" />
            <Tab value="list" label="List View" />
          </Tabs>
          
          <Tabs
            value={skillCategory}
            onChange={handleCategoryChange}
            aria-label="skill categories"
            variant="scrollable"
            scrollButtons="auto"
          >
            {categories.map(category => (
              <Tab 
                key={category} 
                value={category} 
                label={category === 'all' ? 'All Categories' : category} 
              />
            ))}
          </Tabs>
        </Box>
      </Box>
      
      {/* Skill Count and Average */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Skills
                </Typography>
                <Typography variant="h4">{filteredSkills.length}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {skillCategory === 'all' ? 'Across all categories' : `In ${skillCategory}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Skill Level
                </Typography>
                <Typography variant="h4">
                  {(filteredSkills.reduce((sum, skill) => sum + skill.level, 0) / filteredSkills.length).toFixed(1)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Out of 5.0 max
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Skill Distribution
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  {[1, 2, 3, 4, 5].map(level => {
                    const count = filteredSkills.filter(skill => 
                      Math.floor(skill.level) === level
                    ).length;
                    
                    return (
                      <Chip 
                        key={level}
                        label={`Level ${level}: ${count}`}
                        size="small"
                        sx={{ 
                          bgcolor: getSkillLevelColor(level),
                          color: level >= 3 ? 'white' : 'black'
                        }}
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* Radar Chart View */}
      {viewMode === 'radar' && (
        <Box height={400} mb={2}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
              outerRadius="70%" 
              data={radarData}
              margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={30} domain={[0, 5]} />
              
              {targetSkills && (
                <Radar
                  name="Target Level"
                  dataKey="targetLevel"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.1}
                />
              )}
              
              {averageSkills && (
                <Radar
                  name="Team Average"
                  dataKey="averageLevel"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.1}
                />
              )}
              
              <Radar
                name="Your Level"
                dataKey="level"
                stroke="#4a6cf7"
                fill="#4a6cf7"
                fillOpacity={0.6}
              />
              
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      )}
      
      {/* List View */}
      {viewMode === 'list' && (
        <Box mb={2}>
          <List>
            {sortedListSkills.map((skill, index) => (
              <React.Fragment key={skill.name}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">
                          {skill.name}
                          <Chip 
                            size="small" 
                            label={skill.category} 
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        </Typography>
                        <Typography variant="body2">
                          {getSkillLevelLabel(skill.level)} ({skill.level}/5)
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <BorderLinearProgress 
                            variant="determinate" 
                            value={skill.level * 20} 
                            sx={{ 
                              flexGrow: 1, 
                              mr: 2 
                            }}
                            value={skill.level}
                          />
                          {skill.targetLevel && (
                            <Chip 
                              size="small" 
                              label={`Target: ${skill.targetLevel}`}
                              color={skill.gap ? "warning" : "success"}
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        {skill.gap > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Gap to target: {skill.gap.toFixed(1)} level{skill.gap !== 1 ? 's' : ''}
                          </Typography>
                        )}
                        
                        {skill.lastAssessed && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

UserSkillsChart.propTypes = {
  skills: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      category: PropTypes.string,
      level: PropTypes.number.isRequired,
      lastAssessed: PropTypes.string
    })
  ),
  averageSkills: PropTypes.object,
  targetSkills: PropTypes.object,
  loading: PropTypes.bool
};

export default UserSkillsChart;
