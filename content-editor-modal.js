import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  Box,
  IconButton,
  Divider,
  FormHelperText,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  CloudUpload,
  VideoLibrary,
  Description,
  Slideshow,
  Assignment,
  Link as LinkIcon,
  Close,
  Delete
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import lmsService for file uploads
import lmsService from '../../api/lmsService';

const ContentEditorModal = ({ open, onClose, module, content, onSave }) => {
  const isEditing = !!content;
  
  // Content state
  const [contentData, setContentData] = useState({
    title: '',
    description: '',
    contentType: 'Video',
    order: 1,
    module: module?._id,
    videoUrl: '',
    videoDuration: 0,
    documentUrl: '',
    presentationUrl: '',
    assignment: {
      instructions: '',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      submissionType: 'Text',
      maxScore: 100
    },
    externalLink: '',
    requiredToComplete: true
  });
  
  // Upload state
  const [uploadType, setUploadType] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Tabs for different content sections
  const [activeTab, setActiveTab] = useState(0);
  
  // Initialize content data when editing
  useEffect(() => {
    if (isEditing && content) {
      setContentData({
        ...content,
        // Ensure all required properties exist
        assignment: content.assignment || {
          instructions: '',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          submissionType: 'Text',
          maxScore: 100
        }
      });
      
      // Set appropriate tab based on content type
      switch (content.contentType) {
        case 'Video':
          setActiveTab(0);
          break;
        case 'Document':
          setActiveTab(1);
          break;
        case 'Presentation':
          setActiveTab(2);
          break;
        case 'Assignment':
          setActiveTab(3);
          break;
        case 'Link':
          setActiveTab(4);
          break;
        default:
          setActiveTab(0);
      }
    }
  }, [isEditing, content]);
  
  // Handle content type change
  const handleContentTypeChange = (event) => {
    const type = event.target.value;
    setContentData(prev => ({
      ...prev,
      contentType: type
    }));
    
    // Set active tab based on content type
    switch (type) {
      case 'Video':
        setActiveTab(0);
        break;
      case 'Document':
        setActiveTab(1);
        break;
      case 'Presentation':
        setActiveTab(2);
        break;
      case 'Assignment':
        setActiveTab(3);
        break;
      case 'Link':
        setActiveTab(4);
        break;
      default:
        setActiveTab(0);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Update content type based on tab
    const contentTypes = ['Video', 'Document', 'Presentation', 'Assignment', 'Link'];
    setContentData(prev => ({
      ...prev,
      contentType: contentTypes[newValue]
    }));
  };
  
  // Handle text input change
  const handleInputChange = (field, value) => {
    setContentData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  // Handle assignment input change
  const handleAssignmentChange = (field, value) => {
    setContentData(prev => ({
      ...prev,
      assignment: {
        ...prev.assignment,
        [field]: value
      }
    }));
    
    // Clear error for this field
    if (errors[`assignment.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`assignment.${field}`]: ''
      }));
    }
  };
  
  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setUploadError('');
    
    try {
      // Determine file type
      let fileType = '';
      switch (contentData.contentType) {
        case 'Video':
          fileType = 'video';
          break;
        case 'Document':
          fileType = 'document';
          break;
        case 'Presentation':
          fileType = 'presentation';
          break;
        default:
          fileType = 'document';
      }
      
      // Upload file
      const result = await lmsService.uploadFile(selectedFile, fileType);
      
      // Update content data with file URL
      switch (contentData.contentType) {
        case 'Video':
          setContentData(prev => ({
            ...prev,
            videoUrl: result.fileUrl
          }));
          break;
        case 'Document':
          setContentData(prev => ({
            ...prev,
            documentUrl: result.fileUrl
          }));
          break;
        case 'Presentation':
          setContentData(prev => ({
            ...prev,
            presentationUrl: result.fileUrl
          }));
          break;
        default:
          break;
      }
      
      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Error uploading file. Please try again.');
      setUploading(false);
    }
  };
  
  // Validate content data
  const validateContent = () => {
    const newErrors = {};
    
    // Common validations
    if (!contentData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    // Type-specific validations
    switch (contentData.contentType) {
      case 'Video':
        if (!contentData.videoUrl && uploadType === 'url') {
          newErrors.videoUrl = 'Video URL is required';
        }
        if (contentData.videoDuration <= 0) {
          newErrors.videoDuration = 'Duration must be greater than 0';
        }
        break;
        
      case 'Document':
        if (!contentData.documentUrl && uploadType === 'url') {
          newErrors.documentUrl = 'Document URL is required';
        }
        break;
        
      case 'Presentation':
        if (!contentData.presentationUrl && uploadType === 'url') {
          newErrors.presentationUrl = 'Presentation URL is required';
        }
        break;
        
      case 'Assignment':
        if (!contentData.assignment.instructions.trim()) {
          newErrors['assignment.instructions'] = 'Instructions are required';
        }
        if (!contentData.assignment.deadline) {
          newErrors['assignment.deadline'] = 'Deadline is required';
        }
        if (contentData.assignment.maxScore <= 0) {
          newErrors['assignment.maxScore'] = 'Max score must be greater than 0';
        }
        break;
        
      case 'Link':
        if (!contentData.externalLink.trim()) {
          newErrors.externalLink = 'External link is required';
        } else if (!isValidUrl(contentData.externalLink)) {
          newErrors.externalLink = 'Please enter a valid URL';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // URL validation
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Handle save
  const handleSave = () => {
    if (validateContent()) {
      onSave(module._id, contentData);
    }
  };
  
  // Content specific forms
  const renderVideoForm = () => (
    <Box mt={2}>
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Video Source
        </Typography>
        <Box display="flex" mb={2}>
          <Button
            variant={uploadType === 'url' ? 'contained' : 'outlined'}
            onClick={() => setUploadType('url')}
            size="small"
            sx={{ mr: 1 }}
          >
            External URL
          </Button>
          <Button
            variant={uploadType === 'upload' ? 'contained' : 'outlined'}
            onClick={() => setUploadType('upload')}
            size="small"
          >
            Upload Video
          </Button>
        </Box>
      </Box>
      
      {uploadType === 'url' ? (
        <TextField
          label="Video URL"
          value={contentData.videoUrl}
          onChange={(e) => handleInputChange('videoUrl', e.target.value)}
          fullWidth
          placeholder="Enter video URL (YouTube, Vimeo, etc.)"
          variant="outlined"
          error={!!errors.videoUrl}
          helperText={errors.videoUrl}
          margin="normal"
        />
      ) : (
        <Box mb={3}>
          <input
            accept="video/*"
            style={{ display: 'none' }}
            id="video-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="video-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              sx={{ mr: 2 }}
            >
              Select Video
            </Button>
          </label>
          {selectedFile && (
            <Box display="flex" alignItems="center" mt={1}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </Typography>
              <IconButton size="small" onClick={() => setSelectedFile(null)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          )}
          
          <Box mt={2}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </Box>
          
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {uploadProgress}% Uploaded
              </Typography>
            </Box>
          )}
          
          {contentData.videoUrl && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Video uploaded successfully!
            </Alert>
          )}
        </Box>
      )}
      
      <TextField
        label="Video Duration (minutes)"
        type="number"
        value={contentData.videoDuration}
        onChange={(e) => handleInputChange('videoDuration', parseInt(e.target.value) || 0)}
        fullWidth
        variant="outlined"
        error={!!errors.videoDuration}
        helperText={errors.videoDuration}
        margin="normal"
        InputProps={{ inputProps: { min: 1 } }}
      />
    </Box>
  );
  
  const renderDocumentForm = () => (
    <Box mt={2}>
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Document Source
        </Typography>
        <Box display="flex" mb={2}>
          <Button
            variant={uploadType === 'url' ? 'contained' : 'outlined'}
            onClick={() => setUploadType('url')}
            size="small"
            sx={{ mr: 1 }}
          >
            External URL
          </Button>
          <Button
            variant={uploadType === 'upload' ? 'contained' : 'outlined'}
            onClick={() => setUploadType('upload')}
            size="small"
          >
            Upload Document
          </Button>
        </Box>
      </Box>
      
      {uploadType === 'url' ? (
        <TextField
          label="Document URL"
          value={contentData.documentUrl}
          onChange={(e) => handleInputChange('documentUrl', e.target.value)}
          fullWidth
          placeholder="Enter document URL (PDF, DOCX, etc.)"
          variant="outlined"
          error={!!errors.documentUrl}
          helperText={errors.documentUrl}
          margin="normal"
        />
      ) : (
        <Box mb={3}>
          <input
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
            style={{ display: 'none' }}
            id="document-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="document-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              sx={{ mr: 2 }}
            >
              Select Document
            </Button>
          </label>
          {selectedFile && (
            <Box display="flex" alignItems="center" mt={1}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </Typography>
              <IconButton size="small" onClick={() => setSelectedFile(null)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          )}
          
          <Box mt={2}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </Box>
          
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {uploadProgress}% Uploaded
              </Typography>
            </Box>
          )}
          
          {contentData.documentUrl && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Document uploaded successfully!
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
  
  const renderPresentationForm = () => (
    <Box mt={2}>
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Presentation Source
        </Typography>
        <Box display="flex" mb={2}>
          <Button
            variant={uploadType === 'url' ? 'contained' : 'outlined'}
            onClick={() => setUploadType('url')}
            size="small"
            sx={{ mr: 1 }}
          >
            External URL
          </Button>
          <Button
            variant={uploadType === 'upload' ? 'contained' : 'outlined'}
            onClick={() => setUploadType('upload')}
            size="small"
          >
            Upload Presentation
          </Button>
        </Box>
      </Box>
      
      {uploadType === 'url' ? (
        <TextField
          label="Presentation URL"
          value={contentData.presentationUrl}
          onChange={(e) => handleInputChange('presentationUrl', e.target.value)}
          fullWidth
          placeholder="Enter presentation URL (Google Slides, etc.)"
          variant="outlined"
          error={!!errors.presentationUrl}
          helperText={errors.presentationUrl}
          margin="normal"
        />
      ) : (
        <Box mb={3}>
          <input
            accept=".ppt,.pptx,.pdf"
            style={{ display: 'none' }}
            id="presentation-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="presentation-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              sx={{ mr: 2 }}
            >
              Select Presentation
            </Button>
          </label>
          {selectedFile && (
            <Box display="flex" alignItems="center" mt={1}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </Typography>
              <IconButton size="small" onClick={() => setSelectedFile(null)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          )}
          
          <Box mt={2}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {uploading ? 'Uploading...' : 'Upload Presentation'}
            </Button>
          </Box>
          
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {uploadProgress}% Uploaded
              </Typography>
            </Box>
          )}
          
          {contentData.presentationUrl && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Presentation uploaded successfully!
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
  
  const renderAssignmentForm = () => (
    <Box mt={2}>
      <Typography variant="subtitle2" gutterBottom>
        Assignment Instructions
      </Typography>
      <Box sx={{ height: 200, mb: 3 }}>
        <ReactQuill
          theme="snow"
          value={contentData.assignment.instructions}
          onChange={(value) => handleAssignmentChange('instructions', value)}
          style={{ height: 150 }}
          placeholder="Enter detailed instructions for the assignment..."
        />
        {errors['assignment.instructions'] && (
          <FormHelperText error>{errors['assignment.instructions']}</FormHelperText>
        )}
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Deadline"
              value={contentData.assignment.deadline}
              onChange={(newValue) => handleAssignmentChange('deadline', newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params}
                  fullWidth
                  error={!!errors['assignment.deadline']}
                  helperText={errors['assignment.deadline']}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Max Score"
            type="number"
            value={contentData.assignment.maxScore}
            onChange={(e) => handleAssignmentChange('maxScore', parseInt(e.target.value) || 0)}
            fullWidth
            variant="outlined"
            error={!!errors['assignment.maxScore']}
            helperText={errors['assignment.maxScore']}
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Submission Type</InputLabel>
            <Select
              value={contentData.assignment.submissionType}
              onChange={(e) => handleAssignmentChange('submissionType', e.target.value)}
              label="Submission Type"
            >
              <MenuItem value="Text">Text Submission</MenuItem>
              <MenuItem value="File">File Upload</MenuItem>
              <MenuItem value="Link">External Link</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
  
  const renderLinkForm = () => (
    <Box mt={2}>
      <TextField
        label="External Link URL"
        value={contentData.externalLink}
        onChange={(e) => handleInputChange('externalLink', e.target.value)}
        fullWidth
        placeholder="Enter external resource URL"
        variant="outlined"
        error={!!errors.externalLink}
        helperText={errors.externalLink}
        margin="normal"
      />
    </Box>
  );
  
  // Render appropriate form based on content type
  const renderContentForm = () => {
    switch (activeTab) {
      case 0:
        return renderVideoForm();
      case 1:
        return renderDocumentForm();
      case 2:
        return renderPresentationForm();
      case 3:
        return renderAssignmentForm();
      case 4:
        return renderLinkForm();
      default:
        return null;
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isEditing ? 'Edit Content' : 'Add New Content'}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Content Title"
              value={contentData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              fullWidth
              required
              variant="outlined"
              error={!!errors.title}
              helperText={errors.title}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={contentData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Content Type</InputLabel>
              <Select
                value={contentData.contentType}
                onChange={handleContentTypeChange}
                label="Content Type"
              >
                <MenuItem value="Video">Video</MenuItem>
                <MenuItem value="Document">Document</MenuItem>
                <MenuItem value="Presentation">Presentation</MenuItem>
                <MenuItem value="Assignment">Assignment</MenuItem>
                <MenuItem value="Link">External Link</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Order"
              type="number"
              value={contentData.order}
              onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
              fullWidth
              variant="outlined"
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Content Type Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="content type tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label="Video"
              icon={<VideoLibrary />}
              iconPosition="start"
              disabled={contentData.contentType !== 'Video'}
            />
            <Tab
              label="Document"
              icon={<Description />}
              iconPosition="start"
              disabled={contentData.contentType !== 'Document'}
            />
            <Tab
              label="Presentation"
              icon={<Slideshow />}
              iconPosition="start"
              disabled={contentData.contentType !== 'Presentation'}
            />
            <Tab
              label="Assignment"
              icon={<Assignment />}
              iconPosition="start"
              disabled={contentData.contentType !== 'Assignment'}
            />
            <Tab
              label="External Link"
              icon={<LinkIcon />}
              iconPosition="start"
              disabled={contentData.contentType !== 'Link'}
            />
          </Tabs>
        </Box>
        
        {/* Content Type Form */}
        {renderContentForm()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={uploading}
        >
          {isEditing ? 'Update' : 'Add'} Content
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ContentEditorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  module: PropTypes.object.isRequired,
  content: PropTypes.object,
  onSave: PropTypes.func.isRequired
};

export default ContentEditorModal;
