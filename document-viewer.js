import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Tooltip, 
  CircularProgress,
  Divider,
  TextField,
  Pagination,
  Stack,
  Alert,
  Grid,
  Slider
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Download,
  Fullscreen,
  ArrowBack,
  ArrowForward,
  Search,
  Print,
  Error,
  TextFields
} from '@mui/icons-material';

// Import PDF.js with worker
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentViewer = ({ 
  documentUrl, 
  title, 
  onProgress, 
  onComplete,
  startPage = 1,
  documentType = 'auto'
}) => {
  // Component state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(startPage);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [fileType, setFileType] = useState(null);
  const [textMode, setTextMode] = useState(false);
  const [viewerHeight, setViewerHeight] = useState('70vh');
  
  // Refs
  const containerRef = useRef(null);
  const documentRef = useRef(null);
  const progressInterval = useRef(null);
  
  // Detect file type if set to auto
  useEffect(() => {
    if (documentType === 'auto' && documentUrl) {
      const extension = documentUrl.split('.').pop().toLowerCase();
      
      if (['pdf'].includes(extension)) {
        setFileType('pdf');
      } else if (['doc', 'docx'].includes(extension)) {
        setFileType('word');
      } else if (['ppt', 'pptx'].includes(extension)) {
        setFileType('powerpoint');
      } else if (['txt', 'rtf', 'md'].includes(extension)) {
        setFileType('text');
      } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
        setFileType('spreadsheet');
      } else {
        setFileType('unknown');
      }
    } else {
      setFileType(documentType);
    }
  }, [documentUrl, documentType]);
  
  // Setup progress tracking
  useEffect(() => {
    if (onProgress && numPages) {
      progressInterval.current = setInterval(() => {
        const progressPercent = (pageNumber / numPages) * 100;
        onProgress(progressPercent, pageNumber);
        
        // Check if user has reached the end of the document
        if (pageNumber === numPages && onComplete) {
          onComplete();
          clearInterval(progressInterval.current);
        }
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [pageNumber, numPages, onProgress, onComplete]);
  
  // Resize observer for responsive scaling
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        // Adjust document display based on container width
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          if (containerWidth < 500) {
            setScale(containerWidth / 600);
          }
        }
      });
      
      resizeObserver.observe(containerRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);
  
  // PDF document loading handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    
    // Report initial progress
    if (onProgress) {
      onProgress((1 / numPages) * 100, 1);
    }
  };
  
  const onDocumentLoadError = (error) => {
    console.error('Error loading document:', error);
    setError('Failed to load document. Please try again or check the file format.');
    setLoading(false);
  };
  
  // Navigation functions
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };
  
  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };
  
  const handlePageChange = (event, value) => {
    setPageNumber(value);
  };
  
  // Zoom functions
  const zoomIn = () => {
    setScale(scale + 0.2);
  };
  
  const zoomOut = () => {
    if (scale > 0.4) {
      setScale(scale - 0.2);
    }
  };
  
  const handleZoomChange = (event, newValue) => {
    setScale(newValue);
  };
  
  // Rotation functions
  const rotateClockwise = () => {
    setRotation((rotation + 90) % 360);
  };
  
  const rotateCounterClockwise = () => {
    setRotation((rotation - 90 + 360) % 360);
  };
  
  // Download function
  const downloadDocument = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = title || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Print function
  const printDocument = () => {
    const printWindow = window.open(documentUrl, '_blank');
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  };
  
  // Fullscreen function
  const enterFullScreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    }
  };
  
  // Toggle text mode
  const toggleTextMode = () => {
    setTextMode(!textMode);
  };
  
  // Search function for PDF (limited functionality in this implementation)
  const handleSearch = () => {
    // This would typically use the PDF.js API to search within the document
    // For now, this is a placeholder for the search functionality
    alert(`Search functionality for "${searchText}" would be implemented here.`);
  };
  
  // Render a fallback viewer for non-PDF documents
  const renderFallbackViewer = () => {
    if (fileType === 'text') {
      return (
        <iframe 
          src={documentUrl} 
          title={title || "Text document"} 
          width="100%" 
          height="600px"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError('Failed to load text document.');
            setLoading(false);
          }}
        />
      );
    }
    
    return (
      <Box sx={{ 
        p: 3, 
        bgcolor: '#f5f5f5', 
        borderRadius: 1, 
        textAlign: 'center',
        minHeight: 400
      }}>
        <Typography variant="h6" gutterBottom>
          {fileType === 'unknown' 
            ? 'Unsupported Document Type' 
            : `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} Document`}
        </Typography>
        
        <Typography variant="body1" mb={2}>
          This document type is best viewed using its native application. You can download the document to view it.
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <IconButton 
            onClick={downloadDocument} 
            sx={{ bgcolor: 'primary.main', color: 'white', mr: 1, '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <Download />
          </IconButton>
          <Typography variant="button" color="primary" component="span">
            Download Document
          </Typography>
        </Box>
        
        <Alert severity="info">
          For best experience, please download the document and open it with {' '}
          {fileType === 'word' && 'Microsoft Word or an equivalent word processor.'}
          {fileType === 'powerpoint' && 'Microsoft PowerPoint or an equivalent presentation software.'}
          {fileType === 'spreadsheet' && 'Microsoft Excel or an equivalent spreadsheet application.'}
          {fileType === 'unknown' && 'the appropriate application.'}
        </Alert>
      </Box>
    );
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}
      ref={containerRef}
    >
      {/* Document Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 1.5, 
        bgcolor: 'primary.main', 
        color: 'white'
      }}>
        <Typography variant="h6">{title || 'Document Viewer'}</Typography>
        
        {fileType === 'pdf' && (
          <Box>
            <Tooltip title="Toggle Text Mode">
              <IconButton 
                size="small" 
                onClick={toggleTextMode} 
                sx={{ color: 'white', mr: 1 }}
              >
                <TextFields />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Print">
              <IconButton 
                size="small" 
                onClick={printDocument} 
                sx={{ color: 'white', mr: 1 }}
              >
                <Print />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Download">
              <IconButton 
                size="small" 
                onClick={downloadDocument} 
                sx={{ color: 'white' }}
              >
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      
      {/* PDF Search (for PDF documents only) */}
      {fileType === 'pdf' && (
        <Box sx={{ bgcolor: '#f5f5f5', p: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            placeholder="Search document..."
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flexGrow: 1, mr: 1 }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <IconButton onClick={handleSearch}>
            <Search />
          </IconButton>
        </Box>
      )}
      
      {/* Document Viewer */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          p: 2, 
          bgcolor: '#f8f9fa',
          minHeight: '60vh',
          position: 'relative'
        }}
      >
        {/* Loading indicator */}
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        {/* Error message */}
        {error && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              textAlign: 'center',
              maxWidth: '80%'
            }}
          >
            <Error color="error" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        )}
        
        {fileType === 'pdf' ? (
          <Document
            file={documentUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<CircularProgress />}
            noData={<Typography>No document loaded</Typography>}
            ref={documentRef}
            options={{
              cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
              cMapPacked: true,
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={textMode}
              renderAnnotationLayer={textMode}
              width={600}
              className="pdf-page"
              loading={<CircularProgress />}
              error={<Typography color="error">Error loading page!</Typography>}
            />
          </Document>
        ) : (
          renderFallbackViewer()
        )}
      </Box>
      
      {/* Document Controls */}
      {fileType === 'pdf' && !error && (
        <Box sx={{ bgcolor: '#f0f0f0', p: 1.5 }}>
          <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
            {/* Page Navigation */}
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton 
                  onClick={goToPrevPage} 
                  disabled={pageNumber <= 1}
                  size="small"
                >
                  <ArrowBack />
                </IconButton>
                
                <Pagination 
                  count={numPages || 1} 
                  page={pageNumber} 
                  onChange={handlePageChange}
                  size="small"
                  siblingCount={0}
                  boundaryCount={1}
                />
                
                <IconButton 
                  onClick={goToNextPage} 
                  disabled={numPages === null || pageNumber >= numPages}
                  size="small"
                >
                  <ArrowForward />
                </IconButton>
                
                <Typography variant="body2">
                  Page {pageNumber} of {numPages || '?'}
                </Typography>
              </Stack>
            </Grid>
            
            {/* Zoom & Rotation Controls */}
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                <Tooltip title="Zoom Out">
                  <IconButton onClick={zoomOut} size="small">
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                
                <Slider
                  value={scale}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onChange={handleZoomChange}
                  sx={{ width: 100 }}
                  size="small"
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                />
                
                <Tooltip title="Zoom In">
                  <IconButton onClick={zoomIn} size="small">
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                
                <Tooltip title="Rotate Counterclockwise">
                  <IconButton onClick={rotateCounterClockwise} size="small">
                    <RotateLeft />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Rotate Clockwise">
                  <IconButton onClick={rotateClockwise} size="small">
                    <RotateRight />
                  </IconButton>
                </Tooltip>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                
                <Tooltip title="Fullscreen">
                  <IconButton onClick={enterFullScreen} size="small">
                    <Fullscreen />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

DocumentViewer.propTypes = {
  documentUrl: PropTypes.string.isRequired,
  title: PropTypes.string,
  onProgress: PropTypes.func,
  onComplete: PropTypes.func,
  startPage: PropTypes.number,
  documentType: PropTypes.oneOf(['auto', 'pdf', 'word', 'powerpoint', 'text', 'spreadsheet', 'unknown'])
};

export default DocumentViewer;
