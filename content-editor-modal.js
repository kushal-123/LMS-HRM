import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Tabs,
  Tab,
  Box,
  IconButton,
  FormHelperText,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import YouTubeIcon from '@mui/icons-material/YouTube';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReorderIcon from '@mui/icons-material/Reorder';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { createContent, updateContent, deleteContent } from '../../redux/thunks/contentThunks';
import { validateRequired, validateUrl } from '../../utils/validators';
import { formatDuration, formatFileSize } from '../../utils/formatters';

const ContentEditorModal = ({ 
  open, 
  handleClose, 
  courseId, 
  moduleId, 
  contentId = null, 
  onContentSaved 
}) => {
  const dispatch = useDispatch();
  
  const { content, loading, error } = useSelector((state) => state.content);
  const { course } = useSelector((state) => state.courses);
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Content form state
  const [formData, setFormData] = useState({
    title: '',
    contentType: 'video',
    description: '',
    url: '',
    duration: 0,
    isRequired: true,
    allowComments: true,
    allowNotes: true,
    isPublished: false,
    order: 0,
    attachments: [],
    quiz: {
      questions: []
    },
    assignment: {
      instructions: '',
      dueDate: '',
      totalPoints: 100,
      submissionType: 'file'
    }
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  
  // Load content data if editing existing content
  useEffect(() => {
    if (contentId && open) {
      // Get current content from course data
      const module = course?.modules?.find(m => m._id === moduleId);
      const currentContent = module?.contents?.find(c => c._id === contentId);
      
      if (currentContent) {
        setFormData({
          ...currentContent,
          moduleId,
          courseId
        });
      }
    } else if (open) {
      // New content - set defaults
      const module = course?.modules?.find(m => m._id === moduleId);
      const order = module?.contents?.length || 0;
      
      setFormData({
        title: '',
        contentType: 'video',
        description: '',
        url: '',
        duration: 0,
        isRequired: true,
        allowComments: true,
        allowNotes: true,
        isPublished: false,
        order,
        moduleId,
        courseId,
        attachments: [],
        quiz: {
          questions: []
        },
        assignment: {
          instructions: '',
          dueDate: '',
          totalPoints: 100,
          submissionType: 'file'
        }
      });
    }
  }, [contentId, open, course, moduleId, courseId]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle rich text editor changes
  const handleRichTextChange = (value, field) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  // Handle switch changes
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      // Mock file upload - in a real app, you would upload to a server
      setTimeout(() => {
        const newFiles = files.map(file => ({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString()
        }));
        
        setUploadedFiles([...uploadedFiles, ...newFiles]);
        
        // Add to form data attachments
        setFormData({
          ...formData,
          attachments: [
            ...formData.attachments,
            ...newFiles.map(file => ({
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url
            }))
          ]
        });
        
        setUploading(false);
        
        setNotification({
          open: true,
          message: `${files.length} file(s) uploaded successfully`,
          type: 'success'
        });
      }, 1500);
    } catch (error) {
      setUploading(false);
      setNotification({
        open: true,
        message: `File upload failed: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  // Handle file delete
  const handleFileDelete = (fileId) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    
    // Update form data attachments
    setFormData({
      ...formData,
      attachments: formData.attachments.filter(attachment => 
        !uploadedFiles.find(file => file.id === fileId && file.name === attachment.name)
      )
    });
  };
  
  // Handle quiz question add
  const handleAddQuestion = () => {
    const newQuestion = {
      id: Math.random().toString(36).substring(2, 9),
      text: '',
      type: 'multiple-choice',
      options: [
        { id: Math.random().toString(36).substring(2, 9), text: '', isCorrect: false },
        { id: Math.random().toString(36).substring(2, 9), text: '', isCorrect: false }
      ],
      points: 10
    };
    
    setFormData({
      ...formData,
      quiz: {
        ...formData.quiz,
        questions: [...formData.quiz.questions, newQuestion]
      }
    });
  };
  
  // Handle quiz question delete
  const handleDeleteQuestion = (questionId) => {
    setFormData({
      ...formData,
      quiz: {
        ...formData.quiz,
        questions: formData.quiz.questions.filter(q => q.id !== questionId)
      }
    });
  };
  
  // Handle quiz question change
  const handleQuestionChange = (questionId, field, value) => {
    setFormData({
      ...formData,
      quiz: {
        ...formData.quiz,
        questions: formData.quiz.questions.map(q => 
          q.id === questionId 
            ? { ...q, [field]: value } 
            : q
        )
      }
    });
  };
  
  // Handle quiz option add
  const handleAddOption = (questionId) => {
    setFormData({
      ...formData,
      quiz: {
        ...formData.quiz,
        questions: formData.quiz.questions.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                options: [
                  ...q.options, 
                  { 
                    id: Math.random().toString(36).substring(2, 9), 
                    text: '', 
                    isCorrect: false 
                  }
                ] 
              } 
            : q
        )
      }
    });
  };
  
  // Handle quiz option delete
  const handleDeleteOption = (questionId, optionId) => {
    setFormData({
      ...formData,
      quiz: {
        ...formData.quiz,
        questions: formData.quiz.questions.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                options: q.options.filter(o => o.id !== optionId) 
              } 
            : q
        )
      }
    });
  };
  
  // Handle quiz option change
  const handleOptionChange = (questionId, optionId, field, value) => {
    setFormData({
      ...formData,
      quiz: {
        ...formData.quiz,
        questions: formData.quiz.questions.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                options: q.options.map(o => 
                  o.id === optionId 
                    ? { ...o, [field]: value } 
                    : o
                ) 
              } 
            : q
        )
      }
    });
  };
  
  // Handle assignment field change
  const handleAssignmentChange = (field, value) => {
    setFormData({
      ...formData,
      assignment: {
        ...formData.assignment,
        [field]: value
      }
    });
    
    // Clear error for this field
    if (errors[`assignment.${field}`]) {
      setErrors({
        ...errors,
        [`assignment.${field}`]: ''
      });
    }
  };
  
  // Drag and drop for reordering quiz questions
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.quiz.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFormData({
      ...formData,
      quiz: {
        ...formData.quiz,
        questions: items
      }
    });
  };
  
  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!validateRequired(formData.title)) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.contentType === 'video' || formData.contentType === 'document') {
      if (!validateRequired(formData.url)) {
        newErrors.url = 'URL is required';
      } else if (!validateUrl(formData.url)) {
        newErrors.url = 'Please enter a valid URL';
      }
    }
    
    if (formData.contentType === 'video' && (!formData.duration || formData.duration <= 0)) {
      newErrors.duration = 'Valid duration is required';
    }
    
    if (formData.contentType === 'quiz') {
      if (formData.quiz.questions.length === 0) {
        newErrors['quiz.questions'] = 'At least one question is required';
      } else {
        // Validate each question
        formData.quiz.questions.forEach((question, index) => {
          if (!validateRequired(question.text)) {
            newErrors[`question_${index}_text`] = 'Question text is required';
          }
          
          if (question.type === 'multiple-choice') {
            if (question.options.length < 2) {
              newErrors[`question_${index}_options`] = 'At least two options are required';
            }
            
            // Check if at least one option is marked as correct
            const hasCorrectOption = question.options.some(option => option.isCorrect);
            if (!hasCorrectOption) {
              newErrors[`question_${index}_correct`] = 'At least one option must be marked as correct';
            }
            
            // Validate each option
            question.options.forEach((option, optionIndex) => {
              if (!validateRequired(option.text)) {
                newErrors[`question_${index}_option_${optionIndex}`] = 'Option text is required';
              }
            });
          }
        });
      }
    }
    
    if (formData.contentType === 'assignment') {
      if (!validateRequired(formData.assignment.instructions)) {
        newErrors['assignment.instructions'] = 'Instructions are required';
      }
      
      if (formData.assignment.dueDate && new Date(formData.assignment.dueDate) < new Date()) {
        newErrors['assignment.dueDate'] = 'Due date cannot be in the past';
      }
      
      if (!formData.assignment.totalPoints || formData.assignment.totalPoints <= 0) {
        newErrors['assignment.totalPoints'] = 'Total points must be greater than 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      setNotification({
        open: true,
        message: 'Please fix the validation errors',
        type: 'error'
      });
      return;
    }
    
    // Prepare data for submission
    const contentData = {
      ...formData,
      courseId,
      moduleId
    };
    
    if (contentId) {
      // Update existing content
      dispatch(updateContent({
        contentId,
        contentData
      })).then(() => {
        setNotification({
          open: true,
          message: 'Content updated successfully',
          type: 'success'
        });
        if (onContentSaved) {
          onContentSaved(contentData);
        }
        handleClose();
      }).catch((err) => {
        setNotification({
          open: true,
          message: `Error updating content: ${err.message}`,
          type: 'error'
        });
      });
    } else {
      // Create new content
      dispatch(createContent(contentData)).then(() => {
        setNotification({
          open: true,
          message: 'Content created successfully',
          type: 'success'
        });
        if (onContentSaved) {
          onContentSaved(contentData);
        }
        handleClose();
      }).catch((err) => {
        setNotification({
          open: true,
          message: `Error creating content: ${err.message}`,
          type: 'error'
        });
      });
    }
  };
  
  // Handle close notification
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Quill editor modules/formats
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };
  
  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image', 'video'
  ];
  
  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {contentId ? 'Edit Content' : 'Add New Content'}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Content Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.contentType}>
                <InputLabel>Content Type</InputLabel>
                <Select
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleChange}
                  label="Content Type"
                >
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>
                  <MenuItem value="webinar">Webinar</MenuItem>
                  <MenuItem value="survey">Survey</MenuItem>
                  <MenuItem value="interactive">Interactive Content</MenuItem>
                </Select>
                {errors.contentType && (
                  <FormHelperText>{errors.contentType}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRequired}
                      onChange={handleSwitchChange}
                      name="isRequired"
                    />
                  }
                  label="Required"
                  sx={{ flex: 1 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPublished}
                      onChange={handleSwitchChange}
                      name="isPublished"
                    />
                  }
                  label="Published"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                <Tab label="Content" />
                <Tab label="Attachments" />
                <Tab label="Settings" />
                {formData.contentType === 'quiz' && <Tab label="Questions" />}
                {formData.contentType === 'assignment' && <Tab label="Assignment Details" />}
              </Tabs>
              
              {/* Content Tab */}
              {activeTab === 0 && (
                <Box sx={{ mt: 2 }}>
                  {(formData.contentType === 'video' || formData.contentType === 'document') && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Content URL"
                          name="url"
                          value={formData.url}
                          onChange={handleChange}
                          fullWidth
                          error={!!errors.url}
                          helperText={errors.url}
                          InputProps={{
                            startAdornment: (
                              <LinkIcon color="action" sx={{ mr: 1 }} />
                            )
                          }}
                        />
                      </Grid>
                      
                      {formData.contentType === 'video' && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Duration (minutes)"
                            name="duration"
                            type="number"
                            value={formData.duration}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.duration}
                            helperText={errors.duration}
                            InputProps={{
                              inputProps: { min: 0 }
                            }}
                          />
                        </Grid>
                      )}
                      
                      {formData.url && formData.contentType === 'video' && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2, mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Video Preview:
                            </Typography>
                            
                            <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                              <iframe
                                src={formData.url.includes('youtube.com') ? 
                                  formData.url.replace('watch?v=', 'embed/') : formData.url}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  border: 'none'
                                }}
                                title="Video Preview"
                                allowFullScreen
                              />
                            </Box>
                          </Paper>
                        </Grid>
                      )}
                      
                      {formData.url && formData.contentType === 'document' && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2, mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Document Preview:
                            </Typography>
                            
                            {formData.url.endsWith('.pdf') ? (
                              <Box sx={{ height: '500px', width: '100%' }}>
                                <iframe
                                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(formData.url)}&embedded=true`}
                                  width="100%"
                                  height="100%"
                                  style={{ border: 'none' }}
                                  title="Document Preview"
                                />
                              </Box>
                            ) : (
                              <Box sx={{ p: 2, textAlign: 'center' }}>
                                <InsertDriveFileIcon fontSize="large" color="primary" />
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  Document preview not available
                                </Typography>
                                <Button 
                                  variant="outlined" 
                                  startIcon={<VisibilityIcon />}
                                  href={formData.url}
                                  target="_blank"
                                  sx={{ mt: 1 }}
                                >
                                  Open document
                                </Button>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  )}
                  
                  {formData.contentType === 'webinar' && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Webinar Link"
                          name="url"
                          value={formData.url}
                          onChange={handleChange}
                          fullWidth
                          error={!!errors.url}
                          helperText={errors.url}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Duration (minutes)"
                          name="duration"
                          type="number"
                          value={formData.duration}
                          onChange={handleChange}
                          fullWidth
                          InputProps={{
                            inputProps: { min: 0 }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Webinar Date"
                          name="webinarDate"
                          type="datetime-local"
                          value={formData.webinarDate || ''}
                          onChange={handleChange}
                          fullWidth
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Host Name"
                          name="hostName"
                          value={formData.hostName || ''}
                          onChange={handleChange}
                          fullWidth
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          label="Additional Information"
                          name="additionalInfo"
                          value={formData.additionalInfo || ''}
                          onChange={handleChange}
                          fullWidth
                          multiline
                          rows={4}
                        />
                      </Grid>
                    </Grid>
                  )}
                  
                  {formData.contentType === 'survey' && (
                    <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                      Survey configuration is available under the Questions tab.
                    </Typography>
                  )}
                  
                  {formData.contentType === 'interactive' && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Interactive Content URL"
                          name="url"
                          value={formData.url}
                          onChange={handleChange}
                          fullWidth
                          error={!!errors.url}
                          helperText={errors.url || 'Enter the URL to your interactive content (H5P, Storyline, etc.)'}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.trackProgress || false}
                              onChange={handleSwitchChange}
                              name="trackProgress"
                            />
                          }
                          label="Track Progress"
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}
              
              {/* Attachments Tab */}
              {activeTab === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload File'}
                        <input
                          type="file"
                          hidden
                          multiple
                          onChange={handleFileUpload}
                        />
                      </Button>
                      
                      {uploading && (
                        <CircularProgress size={24} sx={{ ml: 2 }} />
                      )}
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Attached Files ({formData.attachments.length})
                      </Typography>
                      
                      {formData.attachments.length === 0 ? (
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                          <Typography variant="body2" color="textSecondary">
                            No files attached yet
                          </Typography>
                        </Paper>
                      ) : (
                        <Paper variant="outlined" sx={{ p: 0 }}>
                          {formData.attachments.map((file, index) => (
                            <Box
                              key={index}
                              sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                borderBottom: index < formData.attachments.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider'
                              }}
                            >
                              <Box sx={{ mr: 2 }}>
                                <InsertDriveFileIcon color="primary" />
                              </Box>
                              
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2" noWrap>
                                  {file.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatFileSize(file.size)}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleFileDelete(file.id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Paper>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* Settings Tab */}
              {activeTab === 2 && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.allowComments}
                            onChange={handleSwitchChange}
                            name="allowComments"
                          />
                        }
                        label="Allow Comments"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.allowNotes}
                            onChange={handleSwitchChange}
                            name="allowNotes"
                          />
                        }
                        label="Allow Notes"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Order"
                        name="order"
                        type="number"
                        value={formData.order}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                          inputProps: { min: 0 }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Completion Criteria
                      </Typography>
                      
                      <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Completion Criteria</InputLabel>
                        <Select
                          name="completionCriteria"
                          value={formData.completionCriteria || 'view'}
                          onChange={handleChange}
                          label="Completion Criteria"
                        >
                          <MenuItem value="view">View Content</MenuItem>
                          <MenuItem value="time">Time Spent</MenuItem>
                          <MenuItem value="quiz">Pass Quiz</MenuItem>
                          <MenuItem value="assignment">Complete Assignment</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {formData.completionCriteria === 'time' && (
                      <Grid item xs={12}>
                        <TextField
                          label="Required Time (minutes)"
                          name="requiredTime"
                          type="number"
                          value={formData.requiredTime || 0}
                          onChange={handleChange}
                          fullWidth
                          InputProps={{
                            inputProps: { min: 0 }
                          }}
                        />
                      </Grid>
                    )}
                    
                    {formData.completionCriteria === 'quiz' && (
                      <Grid item xs={12}>
                        <TextField
                          label="Passing Score (%)"
                          name="passingScore"
                          type="number"
                          value={formData.passingScore || 70}
                          onChange={handleChange}
                          fullWidth
                          InputProps={{
                            inputProps: { min: 0, max: 100 }
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
              
              {/* Questions Tab (for Quiz) */}
              {activeTab === 3 && formData.contentType === 'quiz' && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Quiz Questions ({formData.quiz.questions.length})
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddQuestion}
                    >
                      Add Question
                    </Button>
                  </Box>
                  
                  {errors['quiz.questions'] && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors['quiz.questions']}
                    </Alert>
                  )}
                  
                  {formData.quiz.questions.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="body2" color="textSecondary">
                        No questions added yet. Click "Add Question" to create your first quiz question.
                      </Typography>
                    </Paper>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="questions">
                        {(provided) => (
                          <Box
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {formData.quiz.questions.map((question, index) => (
                              <Draggable
                                key={question.id}
                                draggableId={question.id}
                                index={index}
                              >
                                {(provided) => (
                                  <Paper
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    sx={{ p: 2, mb: 2, position: 'relative' }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                      <Box
                                        {...provided.dragHandleProps}
                                        sx={{ mr: 1, cursor: 'grab' }}
                                      >
                                        <ReorderIcon color="action" />
                                      </Box>
                                      
                                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                                        Question {index + 1}
                                      </Typography>
                                      
                                      <IconButton
                                        color="error"
                                        onClick={() => handleDeleteQuestion(question.id)}
                                        size="small"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Box>
                                    
                                    <Grid container spacing={2}>
                                      <Grid item xs={12}>
                                        <TextField
                                          label="Question Text"
                                          value={question.text}
                                          onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
                                          fullWidth
                                          error={!!errors[`question_${index}_text`]}
                                          helperText={errors[`question_${index}_text`]}
                                        />
                                      </Grid>
                                      
                                      <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                          <InputLabel>Question Type</InputLabel>
                                          <Select
                                            value={question.type}
                                            onChange={(e) => handleQuestionChange(question.id, 'type', e.target.value)}
                                            label="Question Type"
                                          >
                                            <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                                            <MenuItem value="true-false">True/False</MenuItem>
                                            <MenuItem value="short-answer">Short Answer</MenuItem>
                                          </Select>
                                        </FormControl>
                                      </Grid>
                                      
                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          label="Points"
                                          type="number"
                                          value={question.points}
                                          onChange={(e) => handleQuestionChange(question.id, 'points', e.target.value)}
                                          fullWidth
                                          InputProps={{
                                            inputProps: { min: 1 }
                                          }}
                                        />
                                      </Grid>
                                      
                                      {(question.type === 'multiple-choice' || question.type === 'true-false') && (
                                        <Grid item xs={12}>
                                          <Typography variant="subtitle2" gutterBottom>
                                            Answer Options
                                          </Typography>
                                          
                                          {errors[`question_${index}_options`] && (
                                            <FormHelperText error sx={{ mb: 1 }}>
                                              {errors[`question_${index}_options`]}
                                            </FormHelperText>
                                          )}
                                          
                                          {errors[`question_${index}_correct`] && (
                                            <FormHelperText error sx={{ mb: 1 }}>
                                              {errors[`question_${index}_correct`]}
                                            </FormHelperText>
                                          )}
                                          
                                          {question.type === 'true-false' ? (
                                            // Special case for true/false questions
                                            <Grid container spacing={2}>
                                              <Grid item xs={12}>
                                                <FormControlLabel
                                                  control={
                                                    <Switch
                                                      checked={
                                                        question.options.length > 0 && 
                                                        question.options[0].isCorrect
                                                      }
                                                      onChange={(e) => {
                                                        const newOptions = [
                                                          { id: 'true', text: 'True', isCorrect: e.target.checked },
                                                          { id: 'false', text: 'False', isCorrect: !e.target.checked }
                                                        ];
                                                        handleQuestionChange(question.id, 'options', newOptions);
                                                      }}
                                                    />
                                                  }
                                                  label="Correct answer is True"
                                                />
                                              </Grid>
                                            </Grid>
                                          ) : (
                                            // Multiple choice options
                                            <>
                                              {question.options.map((option, optionIndex) => (
                                                <Box key={option.id} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                                  <FormControlLabel
                                                    control={
                                                      <Checkbox
                                                        checked={option.isCorrect}
                                                        onChange={(e) => handleOptionChange(
                                                          question.id,
                                                          option.id,
                                                          'isCorrect',
                                                          e.target.checked
                                                        )}
                                                        color="primary"
                                                      />
                                                    }
                                                    label=""
                                                    sx={{ mr: 0 }}
                                                  />
                                                  
                                                  <TextField
                                                    label={`Option ${optionIndex + 1}`}
                                                    value={option.text}
                                                    onChange={(e) => handleOptionChange(
                                                      question.id,
                                                      option.id,
                                                      'text',
                                                      e.target.value
                                                    )}
                                                    fullWidth
                                                    error={!!errors[`question_${index}_option_${optionIndex}`]}
                                                    helperText={errors[`question_${index}_option_${optionIndex}`]}
                                                    sx={{ flexGrow: 1 }}
                                                  />
                                                  
                                                  <IconButton
                                                    color="error"
                                                    onClick={() => handleDeleteOption(question.id, option.id)}
                                                    disabled={question.options.length <= 2}
                                                    size="small"
                                                    sx={{ ml: 1 }}
                                                  >
                                                    <DeleteIcon />
                                                  </IconButton>
                                                </Box>
                                              ))}
                                              
                                              <Button
                                                startIcon={<AddIcon />}
                                                onClick={() => handleAddOption(question.id)}
                                                size="small"
                                                sx={{ mt: 1 }}
                                              >
                                                Add Option
                                              </Button>
                                            </>
                                          )}
                                        </Grid>
                                      )}
                                      
                                      {question.type === 'short-answer' && (
                                        <Grid item xs={12}>
                                          <TextField
                                            label="Correct Answer"
                                            value={question.correctAnswer || ''}
                                            onChange={(e) => handleQuestionChange(
                                              question.id,
                                              'correctAnswer',
                                              e.target.value
                                            )}
                                            fullWidth
                                          />
                                          <FormHelperText>
                                            Enter the expected answer. Student responses will be checked for exact matches.
                                          </FormHelperText>
                                        </Grid>
                                      )}
                                      
                                      <Grid item xs={12}>
                                        <TextField
                                          label="Explanation (Optional)"
                                          value={question.explanation || ''}
                                          onChange={(e) => handleQuestionChange(
                                            question.id,
                                            'explanation',
                                            e.target.value
                                          )}
                                          fullWidth
                                          multiline
                                          rows={2}
                                        />
                                        <FormHelperText>
                                          Explanation will be shown to students after answering the question.
                                        </FormHelperText>
                                      </Grid>
                                    </Grid>
                                  </Paper>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </Box>
              )}
              
              {/* Assignment Details Tab */}
              {activeTab === 3 && formData.contentType === 'assignment' && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Assignment Instructions
                      </Typography>
                      
                      <Box sx={{ border: errors['assignment.instructions'] ? '1px solid red' : 'none' }}>
                        <ReactQuill
                          value={formData.assignment.instructions}
                          onChange={(value) => handleAssignmentChange('instructions', value)}
                          modules={quillModules}
                          formats={quillFormats}
                          style={{ height: '200px', marginBottom: '50px' }}
                        />
                      </Box>
                      
                      {errors['assignment.instructions'] && (
                        <FormHelperText error>
                          {errors['assignment.instructions']}
                        </FormHelperText>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Due Date"
                        type="datetime-local"
                        value={formData.assignment.dueDate || ''}
                        onChange={(e) => handleAssignmentChange('dueDate', e.target.value)}
                        fullWidth
                        InputLabelProps={{
                          shrink: true,
                        }}
                        error={!!errors['assignment.dueDate']}
                        helperText={errors['assignment.dueDate']}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Total Points"
                        type="number"
                        value={formData.assignment.totalPoints}
                        onChange={(e) => handleAssignmentChange('totalPoints', e.target.value)}
                        fullWidth
                        InputProps={{
                          inputProps: { min: 1 }
                        }}
                        error={!!errors['assignment.totalPoints']}
                        helperText={errors['assignment.totalPoints']}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Submission Type</InputLabel>
                        <Select
                          value={formData.assignment.submissionType}
                          onChange={(e) => handleAssignmentChange('submissionType', e.target.value)}
                          label="Submission Type"
                        >
                          <MenuItem value="file">File Upload</MenuItem>
                          <MenuItem value="text">Text Entry</MenuItem>
                          <MenuItem value="url">Website URL</MenuItem>
                          <MenuItem value="media">Media Recording</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.assignment.allowResubmission || false}
                            onChange={(e) => handleAssignmentChange('allowResubmission', e.target.checked)}
                          />
                        }
                        label="Allow Resubmission"
                      />
                    </Grid>
                    
                    {formData.assignment.allowResubmission && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Max Attempts"
                          type="number"
                          value={formData.assignment.maxAttempts || 3}
                          onChange={(e) => handleAssignmentChange('maxAttempts', e.target.value)}
                          fullWidth
                          InputProps={{
                            inputProps: { min: 1 }
                          }}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Assignment Resources
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Attach files in the Attachments tab to provide resources for this assignment.
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {contentId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.type}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContentEditorModal;
