import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  Add,
  Edit,
  Delete,
  Publish,
  Visibility,
  VisibilityOff,
  CheckCircleOutline
} from '@mui/icons-material';

// Components
import CourseDetailsForm from '../../components/admin/CourseDetailsForm';
import ModuleEditor from '../../components/admin/ModuleEditor';
import ContentEditorModal from '../../components/admin/ContentEditorModal';
import RequirementsSettingsForm from '../../components/admin/RequirementsSettingsForm';
import CoursePreview from '../../components/admin/CoursePreview';
import Loader from '../../components/common/Loader';

// Actions
import {
  getCourseById,
  createCourse,
  updateCourse,
  publishCourse
} from '../../redux/thunks/courseThunks';
import { resetCoursesState } from '../../redux/slices/coursesSlice';

const steps = ['Basic Information', 'Modules & Content', 'Requirements & Settings', 'Review & Publish'];

const AdminCourseBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { course, loading, success, error } = useSelector(state => state.courses);
  const { user } = useSelector(state => state.auth);
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  
  // Course state
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    thumbnail: 'default-course.jpg',
    duration: 0,
    skillsTaught: [],
    isPublished: false,
    requiredForRoles: [],
    requiredForDepartments: [],
    completionCriteria: 'All Modules',
    minimumScore: 70,
    certificateTemplate: 'default',
    creator: null
  });
  
  // Modules state
  const [modules, setModules] = useState([]);
  
  // Content editor modal state
  const [contentEditorOpen, setContentEditorOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  
  // Publish confirmation dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  
  // Initialize course data if editing existing course
  useEffect(() => {
    if (id) {
      dispatch(getCourseById(id));
    } else {
      // For new course, set creator to current user
      setCourseData(prev => ({
        ...prev,
        creator: user?.id
      }));
    }
    
    // Reset course state on unmount
    return () => {
      dispatch(resetCoursesState());
    };
  }, [dispatch, id, user]);
  
  // Populate form when course data is loaded
  useEffect(() => {
    if (course && id) {
      // Set course data
      setCourseData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        level: course.level || 'Beginner',
        thumbnail: course.thumbnail || 'default-course.jpg',
        duration: course.duration || 0,
        skillsTaught: course.skillsTaught || [],
        isPublished: course.isPublished || false,
        requiredForRoles: course.requiredForRoles || [],
        requiredForDepartments: course.requiredForDepartments || [],
        completionCriteria: course.completionCriteria || 'All Modules',
        minimumScore: course.minimumScore || 70,
        certificateTemplate: course.certificateTemplate || 'default',
        creator: course.creator || user?.id
      });
      
      // Set modules
      if (course.modules && course.modules.length > 0) {
        setModules(course.modules);
      }
    }
  }, [course, id, user]);
  
  // Handle next step
  const handleNext = () => {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Validate current step
  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0: // Basic Information
        return courseData.title && courseData.description && courseData.category;
      case 1: // Modules & Content
        return modules.length > 0;
      case 2: // Requirements & Settings
        return true; // No mandatory fields in this step
      default:
        return true;
    }
  };
  
  // Handle course data change
  const handleCourseDataChange = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle module operations
  const handleAddModule = (newModule) => {
    setModules(prev => [
      ...prev,
      {
        ...newModule,
        order: prev.length + 1,
        contents: []
      }
    ]);
  };
  
  const handleUpdateModule = (updatedModule) => {
    setModules(prev => prev.map(module => 
      module._id === updatedModule._id ? updatedModule : module
    ));
  };
  
  const handleDeleteModule = (moduleId) => {
    setModules(prev => {
      const filteredModules = prev.filter(module => module._id !== moduleId);
      
      // Re-order remaining modules
      return filteredModules.map((module, index) => ({
        ...module,
        order: index + 1
      }));
    });
  };
  
  // Handle content operations
  const handleAddContent = (moduleId) => {
    setSelectedModule(modules.find(module => module._id === moduleId));
    setSelectedContent(null);
    setContentEditorOpen(true);
  };
  
  const handleEditContent = (moduleId, contentId) => {
    const module = modules.find(module => module._id === moduleId);
    setSelectedModule(module);
    setSelectedContent(module.contents?.find(content => content._id === contentId) || null);
    setContentEditorOpen(true);
  };
  
  const handleSaveContent = (moduleId, newContent) => {
    setModules(prev => prev.map(module => {
      if (module._id === moduleId) {
        // If content has an ID, update it; otherwise add it
        if (newContent._id) {
          return {
            ...module,
            contents: module.contents.map(content => 
              content._id === newContent._id ? newContent : content
            )
          };
        } else {
          // Add new content with a temporary ID
          return {
            ...module,
            contents: [
              ...module.contents,
              {
                ...newContent,
                _id: `temp-${Date.now()}`,
                order: module.contents.length + 1
              }
            ]
          };
        }
      }
      return module;
    }));
    
    setContentEditorOpen(false);
  };
  
  const handleDeleteContent = (moduleId, contentId) => {
    setModules(prev => prev.map(module => {
      if (module._id === moduleId) {
        const filteredContents = module.contents.filter(content => content._id !== contentId);
        
        // Re-order remaining contents
        return {
          ...module,
          contents: filteredContents.map((content, index) => ({
            ...content,
            order: index + 1
          }))
        };
      }
      return module;
    }));
  };
  
  // Calculate total duration
  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    
    modules.forEach(module => {
      totalMinutes += module.duration || 0;
    });
    
    return totalMinutes;
  };
  
  // Handle save course
  const handleSaveCourse = async () => {
    // Update duration based on modules
    const updatedCourseData = {
      ...courseData,
      duration: calculateTotalDuration(),
      modules: modules.map(module => module._id)
    };
    
    if (id) {
      // Update existing course
      await dispatch(updateCourse({
        id,
        courseData: updatedCourseData
      }));
    } else {
      // Create new course
      await dispatch(createCourse(updatedCourseData));
    }
  };
  
  // Handle publish course
  const handlePublishCourse = async () => {
    if (validateCourseForPublishing()) {
      setPublishDialogOpen(true);
    }
  };
  
  // Confirm publish
  const confirmPublish = async () => {
    // First save the course if needed
    if (!course || !course._id) {
      await handleSaveCourse();
    }
    
    // Then publish it
    await dispatch(publishCourse(id || course._id));
    setPublishDialogOpen(false);
  };
  
  // Validate course for publishing
  const validateCourseForPublishing = () => {
    // Check if course has all required fields
    if (!courseData.title || !courseData.description || !courseData.category) {
      return false;
    }
    
    // Check if course has at least one module
    if (modules.length === 0) {
      return false;
    }
    
    // Check if each module has content
    for (const module of modules) {
      if (!module.contents || module.contents.length === 0) {
        return false;
      }
    }
    
    return true;
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <CourseDetailsForm 
            courseData={courseData} 
            onChange={handleCourseDataChange} 
          />
        );
      case 1:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Modules ({modules.length})</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleAddModule({
                  title: `Module ${modules.length + 1}`,
                  description: '',
                  duration: 0,
                  contents: [],
                  quizRequired: false,
                  _id: `temp-module-${Date.now()}`
                })}
              >
                Add Module
              </Button>
            </Box>
            
            {modules.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No modules added yet. Add at least one module to continue.
              </Alert>
            ) : (
              modules.map((module, index) => (
                <ModuleEditor
                  key={module._id || index}
                  module={module}
                  onUpdate={handleUpdateModule}
                  onDelete={handleDeleteModule}
                  onAddContent={() => handleAddContent(module._id)}
                  onEditContent={(contentId) => handleEditContent(module._id, contentId)}
                  onDeleteContent={(contentId) => handleDeleteContent(module._id, contentId)}
                />
              ))
            )}
          </Box>
        );
      case 2:
        return (
          <RequirementsSettingsForm
            courseData={courseData}
            onChange={handleCourseDataChange}
          />
        );
      case 3:
        return (
          <CoursePreview
            courseData={courseData}
            modules={modules}
            totalDuration={calculateTotalDuration()}
          />
        );
      default:
        return 'Unknown step';
    }
  };
  
  if (loading && id) {
    return <Loader />;
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={() => navigate('/admin/lms/courses')}
              sx={{ mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h5">
              {id ? 'Edit Course' : 'Create New Course'}
            </Typography>
            {courseData.isPublished && (
              <Chip 
                label="Published" 
                color="success" 
                icon={<CheckCircleOutline />} 
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={handleSaveCourse}
              sx={{ mr: 1 }}
            >
              Save
            </Button>
            
            {courseData.isPublished ? (
              <Button
                variant="contained"
                color="warning"
                startIcon={<VisibilityOff />}
                onClick={() => handleCourseDataChange('isPublished', false)}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Publish />}
                onClick={handlePublishCourse}
                disabled={!validateCourseForPublishing()}
              >
                Publish
              </Button>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Error/success messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Course saved successfully!
          </Alert>
        )}
        
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Step Content */}
        <Box sx={{ mt: 3, mb: 3 }}>
          {getStepContent(activeStep)}
        </Box>
        
        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            <Button 
              variant="outlined" 
              onClick={handleSaveCourse} 
              startIcon={<Save />}
              sx={{ mr: 1 }}
            >
              Save Draft
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handlePublishCourse}
                startIcon={<Publish />}
                disabled={!validateCourseForPublishing()}
              >
                Publish Course
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!validateCurrentStep()}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Content Editor Modal */}
      {contentEditorOpen && selectedModule && (
        <ContentEditorModal
          open={contentEditorOpen}
          onClose={() => setContentEditorOpen(false)}
          module={selectedModule}
          content={selectedContent}
          onSave={handleSaveContent}
        />
      )}
      
      {/* Publish Confirmation Dialog */}
      <Dialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
      >
        <DialogTitle>Publish Course</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to publish "{courseData.title}"? Once published, it will be visible to all users based on your requirements settings.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmPublish} variant="contained" color="primary">
            Publish
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCourseBuilder;
