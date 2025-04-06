import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  CloudUpload,
  CalendarToday,
  Assignment,
  Check,
  ExpandMore,
  AttachFile,
  Delete,
  Info,
  Send,
  AccessTime,
  Link as LinkIcon,
  Warning,
  Download
} from '@mui/icons-material';
import { red, amber, green, blue } from '@mui/material/colors';
import DOMPurify from 'dompurify';
import { useDropzone } from 'react-dropzone';
import { format, differenceInDays, isPast } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AssignmentComponent = ({ 
  assignmentData, 
  enrollmentId, 
  contentId, 
  submissionData = null,
  onSubmit,
  onDownload,
  readOnly = false
}) => {
  // State
  const [submissionType, setSubmissionType] = useState('text');
  const [textSubmission, setTextSubmission] = useState('');
  const [linkSubmission, setLinkSubmission] = useState('');
  const [fileSubmission, setFileSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // References
  const fileInputRef = useRef(null);
  
  // Setup dropzone for file uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFileSubmission(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setError('File is too large. Maximum size is 10MB.');
      } else {
        setError('Invalid file type. Please upload a document, spreadsheet, presentation, PDF, or image file.');
      }
    }
  });
  
  // Initialize component with existing submission data if available
  useEffect(() => {
    if (submissionData) {
      if (submissionData.submissionText) {
        setSubmissionType('text');
        setTextSubmission(submissionData.submissionText);
      } else if (submissionData.submissionFileUrl) {
        setSubmissionType('file');
        // We can't set the actual file object, just indicate we have one
        setFileSubmission({ name: 'Submitted file', preview: submissionData.submissionFileUrl });
      } else if (submissionData.submissionLink) {
        setSubmissionType('link');
        setLinkSubmission(submissionData.submissionLink);
      }
    } else if (assignmentData && assignmentData.submissionType) {
      // Set the default submission type based on assignment configuration
      setSubmissionType(assignmentData.submissionType.toLowerCase());
    }
  }, [submissionData, assignmentData]);
  
  // Clean up the file preview URL on unmount
  useEffect(() => {
    return () => {
      if (fileSubmission && fileSubmission.preview && !fileSubmission.preview.startsWith('http')) {
        URL.revokeObjectURL(fileSubmission.preview);
      }
    };
  }, [fileSubmission]);
  
  // Calculate days until deadline
  const calculateDaysUntilDeadline = () => {
    if (!assignmentData || !assignmentData.deadline) return null;
    
    const deadlineDate = new Date(assignmentData.deadline);
    const today = new Date();
    return differenceInDays(deadlineDate, today);
  };
  
  const daysUntilDeadline = calculateDaysUntilDeadline();
  const isDeadlinePassed = daysUntilDeadline !== null && daysUntilDeadline < 0;
  
  // Handle submission type change
  const handleSubmissionTypeChange = (type) => {
    setSubmissionType(type);
    setError(null);
  };
  
  // Handle file selection
  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('File is too large. Maximum size is 10MB.');
        return;
      }
      
      setFileSubmission(file);
      setError(null);
    }
  };
  
  // Remove selected file
  const handleRemoveFile = () => {
    setFileSubmission(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Validate link format
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Handle link validation
  const validateLink = () => {
    if (!linkSubmission) {
      setError('Please enter a link');
      return false;
    }
    
    if (!isValidUrl(linkSubmission)) {
      setError('Please enter a valid URL (include http:// or https://)');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  // Handle text submission validation
  const validateTextSubmission = () => {
    if (!textSubmission || textSubmission.trim() === '' || textSubmission === '<p><br></p>') {
      setError('Please enter your submission text');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  // Validate the submission based on the selected type
  const validateSubmission = () => {
    switch (submissionType) {
      case 'text':
        return validateTextSubmission();
      case 'file':
        if (!fileSubmission) {
          setError('Please select a file to upload');
          return false;
        }
        return true;
      case 'link':
        return validateLink();
      default:
        return false;
    }
  };
  
  // Handle submission confirmation
  const handleConfirmSubmission = () => {
    if (!validateSubmission()) return;
    setConfirmSubmit(true);
  };
  
  // Handle submission
  const handleSubmit = async () => {
    setConfirmSubmit(false);
    setLoading(true);
    setError(null);
    
    try {
      let submissionData = {
        submissionType
      };
      
      switch (submissionType) {
        case 'text':
          submissionData.submissionText = textSubmission;
          break;
        case 'file':
          // In a real implementation, you would handle file upload here
          // and receive a URL back from the server
          // For now, we'll simulate this
          submissionData.submissionFileUrl = URL.createObjectURL(fileSubmission);
          submissionData.submissionFileName = fileSubmission.name;
          break;
        case 'link':
          submissionData.submissionLink = linkSubmission;
          break;
      }
      
      // Call the onSubmit callback
      if (onSubmit) {
        await onSubmit(enrollmentId, contentId, submissionData);
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setError('Failed to submit assignment. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle download of assignment submission (for instructors)
  const handleDownload = async () => {
    if (onDownload && submissionData) {
      await onDownload(enrollmentId, contentId, submissionData);
    }
  };
  
  // Format deadline date
  const formatDeadline = (dateString) => {
    try {
      if (!dateString) return 'No deadline';
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Sanitize HTML content from instructions
  const sanitizedInstructions = assignmentData?.instructions 
    ? DOMPurify.sanitize(assignmentData.instructions)
    : '';
  
  // Render the submission form based on submission type
  const renderSubmissionForm = () => {
    if (readOnly) {
      return renderSubmissionDetails();
    }
    
    return (
      <Box sx={{ mt: 3 }}>
        {/* Submission Type Selection */}
        {(!submissionData || submissionData.status === 'Rejected') && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Submission Type
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant={submissionType === 'text' ? 'contained' : 'outlined'}
                onClick={() => handleSubmissionTypeChange('text')}
                startIcon={<Assignment />}
                disabled={assignmentData.submissionType !== 'Text' && assignmentData.submissionType !== null}
              >
                Text
              </Button>
              <Button
                variant={submissionType === 'file' ? 'contained' : 'outlined'}
                onClick={() => handleSubmissionTypeChange('file')}
                startIcon={<AttachFile />}
                disabled={assignmentData.submissionType !== 'File' && assignmentData.submissionType !== null}
              >
                File Upload
              </Button>
              <Button
                variant={submissionType === 'link' ? 'contained' : 'outlined'}
                onClick={() => handleSubmissionTypeChange('link')}
                startIcon={<LinkIcon />}
                disabled={assignmentData.submissionType !== 'Link' && assignmentData.submissionType !== null}
              >
                Link
              </Button>
            </Stack>
          </Box>
        )}
        
        {/* Submission Form */}
        <Box sx={{ mb: 3 }}>
          {submissionType === 'text' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Text Submission
              </Typography>
              <Box sx={{ height: 250, mb: 2 }}>
                <ReactQuill
                  theme="snow"
                  value={textSubmission}
                  onChange={setTextSubmission}
                  placeholder="Enter your submission here..."
                  style={{ height: 200 }}
                  readOnly={!!submissionData && submissionData.status !== 'Rejected'}
                />
              </Box>
            </Box>
          )}
          
          {submissionType === 'file' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                File Upload
              </Typography>
              {(!fileSubmission || (submissionData && submissionData.status === 'Rejected')) ? (
                <Box 
                  {...getRootProps()} 
                  sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: 2, 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: isDragActive ? '#f0f7ff' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#f0f7ff'
                    }
                  }}
                >
                  <input {...getInputProps()} ref={fileInputRef} />
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    {isDragActive 
                      ? 'Drop your file here...' 
                      : 'Drag and drop your file here, or click to select'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Accepted file types: PDF, Word, Excel, PowerPoint, Text, Images (max 10MB)
                  </Typography>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    border: '1px solid #ccc', 
                    borderRadius: 2, 
                    p: 2,
                    bgcolor: '#f5f5f5'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachFile sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {fileSubmission.name}
                      </Typography>
                    </Box>
                    {(!submissionData || submissionData.status === 'Rejected') && (
                      <IconButton onClick={handleRemoveFile} size="small">
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          
          {submissionType === 'link' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Link Submission
              </Typography>
              <TextField
                fullWidth
                label="Enter URL"
                value={linkSubmission}
                onChange={(e) => setLinkSubmission(e.target.value)}
                placeholder="https://example.com"
                variant="outlined"
                disabled={!!submissionData && submissionData.status !== 'Rejected'}
                helperText="Include the full URL including http:// or https://"
                error={error?.includes('URL')}
              />
            </Box>
          )}
        </Box>
        
        {/* Submit Button & Messages */}
        {(!submissionData || submissionData.status === 'Rejected') && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Assignment submitted successfully!
                </Alert>
              )}
              
              {isDeadlinePassed && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  The deadline for this assignment has passed. Your submission may be marked as late.
                </Alert>
              )}
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmSubmission}
              disabled={loading || (submissionData && submissionData.status !== 'Rejected')}
              startIcon={loading ? <CircularProgress size={20} /> : <Send />}
            >
              {loading ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </Box>
        )}
      </Box>
    );
  };
  
  // Render submitted assignment details
  const renderSubmissionDetails = () => {
    if (!submissionData) return null;
    
    const { status, submittedOn, submissionText, submissionFileUrl, submissionLink, score, feedback } = submissionData;
    
    return (
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 2 
          }}>
            <Typography variant="h6">
              Submission Details
            </Typography>
            <Chip 
              label={status} 
              color={
                status === 'Pending' ? 'default' :
                status === 'Graded' ? 'success' : 'error'
              }
              size="small"
            />
          </Box>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Submitted on: {submittedOn ? format(new Date(submittedOn), 'MMMM d, yyyy h:mm a') : 'N/A'}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {submissionText && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Submitted Text:
              </Typography>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: '#f9f9f9', 
                  borderRadius: 1,
                  '& a': {
                    color: 'primary.main'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(submissionText) }}
              />
            </Box>
          )}
          
          {submissionFileUrl && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Submitted File:
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2, 
                bgcolor: '#f9f9f9', 
                borderRadius: 1 
              }}>
                <AttachFile sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {submissionData.submissionFileName || 'Submitted file'}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<Download />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </Box>
            </Box>
          )}
          
          {submissionLink && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Submitted Link:
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f9f9f9', 
                borderRadius: 1,
                wordBreak: 'break-all'
              }}>
                <a 
                  href={submissionLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <LinkIcon sx={{ mr: 1, fontSize: 18 }} />
                  {submissionLink}
                </a>
              </Box>
            </Box>
          )}
          
          {status === 'Graded' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Score:
              </Typography>
              <Typography variant="h5" color="primary">
                {score} / {assignmentData?.maxScore || 100}
              </Typography>
              
              {feedback && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Instructor Feedback:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {feedback}
                  </Paper>
                </Box>
              )}
            </Box>
          )}
          
          {status === 'Rejected' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Your submission was rejected. Please review the feedback and resubmit.
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
      {/* Assignment Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          {assignmentData?.title || 'Assignment'}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTime sx={{ mr: 0.5, fontSize: 20 }} />
          <Typography variant="body2">
            Due: {formatDeadline(assignmentData?.deadline)}
          </Typography>
        </Box>
      </Box>
      
      {/* Assignment Content */}
      <Box sx={{ p: 3 }}>
        {/* Assignment Instructions */}
        <Accordion
          expanded={showInstructions}
          onChange={() => setShowInstructions(!showInstructions)}
          sx={{ mb: 3 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              Instructions
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Assignment Metadata */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Deadline
                      </Typography>
                      <Typography variant="body2">
                        {formatDeadline(assignmentData?.deadline)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assignment sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Points
                      </Typography>
                      <Typography variant="body2">
                        {assignmentData?.maxScore || 100} points
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Deadline Status */}
              {daysUntilDeadline !== null && (
                <Box sx={{ 
                  mt: 2, 
                  p: 1.5, 
                  borderRadius: 1,
                  bgcolor: 
                    isDeadlinePassed ? red[50] :
                    daysUntilDeadline <= 1 ? amber[50] :
                    daysUntilDeadline <= 3 ? blue[50] :
                    green[50],
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {isDeadlinePassed ? (
                    <Warning sx={{ mr: 1, color: red[700] }} />
                  ) : daysUntilDeadline <= 1 ? (
                    <Warning sx={{ mr: 1, color: amber[700] }} />
                  ) : (
                    <Info sx={{ mr: 1, color: blue[700] }} />
                  )}
                  <Typography variant="body2" sx={{ 
                    color: 
                      isDeadlinePassed ? red[700] :
                      daysUntilDeadline <= 1 ? amber[700] :
                      daysUntilDeadline <= 3 ? blue[700] :
                      green[700]
                  }}>
                    {isDeadlinePassed 
                      ? `Deadline passed ${Math.abs(daysUntilDeadline)} day${Math.abs(daysUntilDeadline) !== 1 ? 's' : ''} ago` 
                      : daysUntilDeadline === 0 
                        ? 'Due today!' 
                        : daysUntilDeadline === 1 
                          ? 'Due tomorrow!' 
                          : `Due in ${daysUntilDeadline} days`}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Assignment Description */}
            <Box 
              className="assignment-instructions"
              sx={{ 
                '& a': { color: 'primary.main' },
                '& img': { maxWidth: '100%', height: 'auto' },
                '& h1, & h2, & h3, & h4, & h5, & h6': { 
                  mt: 2, 
                  mb: 1 
                },
                '& ul, & ol': { pl: 3 }
              }}
              dangerouslySetInnerHTML={{ __html: sanitizedInstructions }}
            />
          </AccordionDetails>
        </Accordion>
        
        {/* Submission Form */}
        {renderSubmissionForm()}
      </Box>
      
      {/* Submission Confirmation Dialog */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Submit Assignment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit this assignment? You may not be able to edit your submission after submitting.
          </DialogContentText>
          {isDeadlinePassed && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              The deadline for this assignment has passed. Your submission may be marked as late.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

AssignmentComponent.propTypes = {
  assignmentData: PropTypes.shape({
    title: PropTypes.string,
    instructions: PropTypes.string,
    deadline: PropTypes.string,
    maxScore: PropTypes.number,
    submissionType: PropTypes.oneOf(['Text', 'File', 'Link'])
  }).isRequired,
  enrollmentId: PropTypes.string.isRequired,
  contentId: PropTypes.string.isRequired,
  submissionData: PropTypes.shape({
    submissionText: PropTypes.string,
    submissionFileUrl: PropTypes.string,
    submissionFileName: PropTypes.string,
    submissionLink: PropTypes.string,
    submittedOn: PropTypes.string,
    status: PropTypes.oneOf(['Pending', 'Graded', 'Rejected']),
    score: PropTypes.number,
    feedback: PropTypes.string
  }),
  onSubmit: PropTypes.func,
  onDownload: PropTypes.func,
  readOnly: PropTypes.bool
};

export default AssignmentComponent;
