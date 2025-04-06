import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  IconButton, 
  Slider, 
  CircularProgress, 
  Tooltip,
  Paper,
  Grid,
  Stack,
  Collapse
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  Settings,
  Speed,
  ClosedCaption,
  ClosedCaptionDisabled,
  SkipNext,
  ArrowDropDown,
  ArrowDropUp
} from '@mui/icons-material';

const VideoPlayer = ({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete, 
  startTime = 0, 
  autoplay = false,
  showTitle = true,
  nextVideoUrl = null,
  onNextVideo = null,
  subtitles = null
}) => {
  // Player state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showCaptions, setShowCaptions] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const sliderRef = useRef(null);
  const progressInterval = useRef(null);
  
  // Format time (seconds -> MM:SS)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };
  
  // Handle progress change from slider
  const handleProgressChange = (e, newValue) => {
    if (videoRef.current) {
      const newTime = (newValue / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e, newValue) => {
    if (videoRef.current) {
      videoRef.current.volume = newValue;
      setVolume(newValue);
      setMuted(newValue === 0);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };
  
  // Change playback rate
  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackOptions(false);
    }
  };
  
  // Toggle captions
  const toggleCaptions = () => {
    setShowCaptions(!showCaptions);
    
    if (videoRef.current && videoRef.current.textTracks) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = !showCaptions ? 'showing' : 'hidden';
      }
    }
  };
  
  // Handle next video click
  const handleNextVideo = () => {
    if (onNextVideo && nextVideoUrl) {
      onNextVideo(nextVideoUrl);
    }
  };
  
  // Initialize player on mount
  useEffect(() => {
    if (videoRef.current) {
      // Set initial time if provided
      if (startTime > 0) {
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
      
      // Auto play if enabled
      if (autoplay) {
        videoRef.current.play().catch(err => {
          console.warn('Auto-play was prevented:', err);
          setPlaying(false);
        });
      }
    }
    
    // Setup progress tracking interval
    progressInterval.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentProgress = videoRef.current.currentTime;
        setCurrentTime(currentProgress);
        
        // Report progress to parent component
        if (onProgress) {
          const progressPercent = (currentProgress / videoRef.current.duration) * 100;
          onProgress(progressPercent, currentProgress);
        }
      }
    }, 1000);
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [autoplay, startTime, onProgress]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);
  
  // Update subtitles
  useEffect(() => {
    if (videoRef.current && subtitles && subtitles.length > 0) {
      // Remove existing tracks
      while (videoRef.current.firstChild) {
        if (videoRef.current.firstChild.tagName === 'TRACK') {
          videoRef.current.removeChild(videoRef.current.firstChild);
        } else {
          break;
        }
      }
      
      // Add new tracks
      subtitles.forEach((subtitle, index) => {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = subtitle.label || `Subtitle ${index + 1}`;
        track.srclang = subtitle.language || 'en';
        track.src = subtitle.url;
        track.default = index === 0;
        
        videoRef.current.appendChild(track);
      });
    }
  }, [subtitles]);
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        overflow: 'hidden', 
        borderRadius: 2, 
        bgcolor: '#000', 
        position: 'relative',
        mb: 2
      }}
    >
      {showTitle && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 1.5, 
          bgcolor: 'primary.dark', 
          color: 'white'
        }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton 
            size="small" 
            onClick={() => setShowDetails(!showDetails)} 
            sx={{ color: 'white' }}
          >
            {showDetails ? <ArrowDropUp /> : <ArrowDropDown />}
          </IconButton>
        </Box>
      )}
      
      <Collapse in={showDetails}>
        <Box sx={{ p: 2, bgcolor: '#1a1a1a', color: 'white' }}>
          <Typography variant="body2">
            Video duration: {formatTime(duration)}
          </Typography>
          {videoUrl && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'gray' }}>
              Source: {videoUrl.substring(0, 50)}{videoUrl.length > 50 ? '...' : ''}
            </Typography>
          )}
        </Box>
      </Collapse>
      
      <Box sx={{ position: 'relative' }}>
        {/* Video Element */}
        <video
          ref={videoRef}
          className="video-player"
          src={videoUrl}
          style={{ width: '100%', display: 'block' }}
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => {
            setDuration(e.target.duration);
            setLoading(false);
          }}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onEnded={() => {
            setPlaying(false);
            if (onComplete) onComplete();
          }}
          onError={(e) => {
            console.error('Video error:', e);
            setError('Error loading video. Please try again.');
            setLoading(false);
          }}
          crossOrigin="anonymous"
          playsInline
        >
          {subtitles && subtitles.map((subtitle, index) => (
            <track 
              key={index}
              kind="subtitles" 
              label={subtitle.label || `Subtitle ${index + 1}`}
              srcLang={subtitle.language || 'en'}
              src={subtitle.url}
              default={index === 0}
            />
          ))}
          Your browser does not support the video tag.
        </video>
        
        {/* Loading Spinner */}
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}
        
        {/* Error Message */}
        {error && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.7)',
              p: 2,
              borderRadius: 1
            }}
          >
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        )}
        
        {/* Play/Pause Overlay */}
        {!loading && !playing && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              p: 1,
              cursor: 'pointer'
            }}
            onClick={togglePlay}
          >
            <PlayArrow sx={{ fontSize: 60, color: 'white' }} />
          </Box>
        )}
      </Box>
      
      {/* Controls */}
      <Box sx={{ 
        bgcolor: '#1a1a1a', 
        p: 1,
        position: 'relative'
      }}>
        {/* Progress Bar */}
        <Slider
          ref={sliderRef}
          value={duration ? (currentTime / duration) * 100 : 0}
          onChange={handleProgressChange}
          sx={{ 
            color: 'primary.main',
            height: 4,
            mb: 1,
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              display: 'none',
              '&:hover, &.Mui-focusVisible': {
                boxShadow: 'none',
              },
            },
            '&:hover .MuiSlider-thumb': {
              display: 'block',
            },
          }}
        />
        
        <Grid container alignItems="center" spacing={1}>
          {/* Main Controls */}
          <Grid item>
            <IconButton onClick={togglePlay} size="small" sx={{ color: 'white' }}>
              {playing ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Grid>
          
          {/* Time Display */}
          <Grid item>
            <Typography variant="caption" sx={{ color: 'white' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Grid>
          
          {/* Volume Control */}
          <Grid item xs>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ maxWidth: 200 }}>
              <IconButton onClick={toggleMute} size="small" sx={{ color: 'white' }}>
                {muted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              <Slider
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                sx={{
                  width: 100,
                  color: 'white',
                  '& .MuiSlider-track': {
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                    '&:hover, &.Mui-focusVisible, &.Mui-active': {
                      boxShadow: 'none',
                    },
                  },
                }}
              />
            </Stack>
          </Grid>
          
          {/* Right Controls */}
          <Grid item>
            {/* Playback Rate Button */}
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Tooltip title="Playback Speed">
                <IconButton 
                  onClick={() => setShowPlaybackOptions(!showPlaybackOptions)} 
                  size="small" 
                  sx={{ color: 'white' }}
                >
                  <Speed />
                </IconButton>
              </Tooltip>
              
              {/* Playback Rate Options */}
              {showPlaybackOptions && (
                <Paper 
                  sx={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    right: 0, 
                    width: 120,
                    mt: 1,
                    zIndex: 1,
                    bgcolor: '#333',
                    color: 'white'
                  }}
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <Box 
                      key={rate} 
                      sx={{ 
                        p: 1, 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' },
                        fontWeight: playbackRate === rate ? 'bold' : 'normal'
                      }}
                      onClick={() => changePlaybackRate(rate)}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </Box>
                  ))}
                </Paper>
              )}
            </Box>
          </Grid>
          
          {/* Captions Toggle */}
          {subtitles && subtitles.length > 0 && (
            <Grid item>
              <Tooltip title={showCaptions ? "Hide Captions" : "Show Captions"}>
                <IconButton onClick={toggleCaptions} size="small" sx={{ color: 'white' }}>
                  {showCaptions ? <ClosedCaption /> : <ClosedCaptionDisabled />}
                </IconButton>
              </Tooltip>
            </Grid>
          )}
          
          {/* Next Video Button */}
          {nextVideoUrl && (
            <Grid item>
              <Tooltip title="Next Video">
                <IconButton onClick={handleNextVideo} size="small" sx={{ color: 'white' }}>
                  <SkipNext />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
          
          {/* Fullscreen Button */}
          <Grid item>
            <Tooltip title="Fullscreen">
              <IconButton onClick={toggleFullscreen} size="small" sx={{ color: 'white' }}>
                <Fullscreen />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

VideoPlayer.propTypes = {
  videoUrl: PropTypes.string.isRequired,
  title: PropTypes.string,
  onProgress: PropTypes.func,
  onComplete: PropTypes.func,
  startTime: PropTypes.number,
  autoplay: PropTypes.bool,
  showTitle: PropTypes.bool,
  nextVideoUrl: PropTypes.string,
  onNextVideo: PropTypes.func,
  subtitles: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      language: PropTypes.string,
      label: PropTypes.string
    })
  )
};

export default VideoPlayer;
