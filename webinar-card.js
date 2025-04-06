import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  FaClock, 
  FaUserGraduate, 
  FaCalendarAlt, 
  FaMapMarkerAlt,
  FaPlay,
  FaVideo,
  FaCheckCircle,
  FaRegStar
} from 'react-icons/fa';
import moment from 'moment-timezone';

const WebinarCard = ({ webinar, compact = false }) => {
  const {
    _id,
    title,
    description,
    startDate,
    duration,
    type,
    category,
    level,
    presenter,
    registrationCount,
    thumbnailUrl,
    isRegistered,
    registrantJoinUrl,
    status,
    isRecorded,
    recordingUrl,
    timezone
  } = webinar;

  // Truncate description
  const truncateDescription = (text, maxLength = compact ? 80 : 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    return moment(date).format('MMM D, YYYY');
  };

  // Format time with timezone
  const formatTime = (date) => {
    if (!date) return '';
    return moment(date).format('h:mm A');
  };

  // Get days until webinar
  const getDaysUntil = () => {
    if (!startDate) return null;
    const now = moment();
    const start = moment(startDate);
    return start.diff(now, 'days');
  };

  // Get status badge
  const getStatusBadge = () => {
    const daysUntil = getDaysUntil();
    
    if (status === 'Cancelled') {
      return (
        <div className="webinar-card__status webinar-card__status--cancelled">
          Cancelled
        </div>
      );
    }
    
    if (status === 'Completed') {
      return (
        <div className="webinar-card__status webinar-card__status--completed">
          Completed
        </div>
      );
    }
    
    if (status === 'In Progress') {
      return (
        <div className="webinar-card__status webinar-card__status--live">
          Live Now!
        </div>
      );
    }
    
    if (daysUntil !== null) {
      if (daysUntil === 0) {
        return (
          <div className="webinar-card__status webinar-card__status--today">
            Today
          </div>
        );
      }
      
      if (daysUntil <= 2) {
        return (
          <div className="webinar-card__status webinar-card__status--soon">
            In {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
          </div>
        );
      }
    }
    
    return null;
  };

  // Render compact version
  if (compact) {
    return (
      <div className={`webinar-card webinar-card--compact ${status === 'Completed' ? 'webinar-card--completed' : ''}`}>
        <div className="webinar-card__date-badge">
          <div className="webinar-card__date-month">
            {moment(startDate).format('MMM')}
          </div>
          <div className="webinar-card__date-day">
            {moment(startDate).format('DD')}
          </div>
        </div>
        
        <div className="webinar-card__compact-content">
          <Link to={`/lms/webinars/${_id}`} className="webinar-card__title-link">
            <h3 className="webinar-card__title">{title}</h3>
          </Link>
          
          <div className="webinar-card__compact-details">
            <span className="webinar-card__time">
              <FaClock /> {formatTime(startDate)}
            </span>
            <span className="webinar-card__presenter">
              By: {presenter?.name || 'TBD'}
            </span>
          </div>
          
          <div className="webinar-card__compact-footer">
            {status === 'Completed' ? (
              isRecorded ? (
                <Link to={`/lms/webinars/${_id}`} className="webinar-card__recording-btn">
                  <FaPlay /> Watch Recording
                </Link>
              ) : (
                <span className="webinar-card__ended">Ended</span>
              )
            ) : (
              <Link to={`/lms/webinars/${_id}`} className="webinar-card__details-btn">
                Details
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`webinar-card ${status === 'Completed' ? 'webinar-card--completed' : ''}`}>
      <div className="webinar-card__image-container">
        <Link to={`/lms/webinars/${_id}`}>
          <img 
            src={thumbnailUrl || '/assets/images/default-webinar.jpg'} 
            alt={title} 
            className="webinar-card__image" 
          />
        </Link>
        
        <div className="webinar-card__category">{category}</div>
        
        {getStatusBadge()}
        
        {type === 'Recorded' && (
          <div className="webinar-card__type">
            <FaVideo /> Recorded
          </div>
        )}
        
        {isRegistered && status !== 'Completed' && (
          <div className="webinar-card__registered">
            <FaCheckCircle /> Registered
          </div>
        )}
      </div>
      
      <div className="webinar-card__content">
        <Link to={`/lms/webinars/${_id}`} className="webinar-card__title-link">
          <h3 className="webinar-card__title">{title}</h3>
        </Link>
        
        <div className="webinar-card__meta">
          <span className="webinar-card__date">
            <FaCalendarAlt /> {formatDate(startDate)}
          </span>
          <span className="webinar-card__time">
            <FaClock /> {formatTime(startDate)}
          </span>
          <span className="webinar-card__timezone">
            <FaMapMarkerAlt /> {timezone}
          </span>
        </div>
        
        <p className="webinar-card__description">
          {truncateDescription(description)}
        </p>
        
        <div className="webinar-card__presenter-info">
          <div className="webinar-card__presenter-image">
            {presenter?.imageUrl ? (
              <img src={presenter.imageUrl} alt={presenter.name} />
            ) : (
              <div className="webinar-card__presenter-placeholder">
                {presenter?.name ? presenter.name.charAt(0) : '?'}
              </div>
            )}
          </div>
          <div className="webinar-card__presenter-details">
            <div className="webinar-card__presenter-name">
              {presenter?.name || 'TBD'}
            </div>
            <div className="webinar-card__presenter-title">
              {presenter?.title || ''}
            </div>
          </div>
        </div>
        
        <div className="webinar-card__footer">
          <div className="webinar-card__stats">
            <span className="webinar-card__duration">
              <FaClock /> {duration} min
            </span>
            <span className="webinar-card__registrations">
              <FaUserGraduate /> {registrationCount || 0} registered
            </span>
            {level && (
              <span className="webinar-card__level">
                <FaRegStar /> {level}
              </span>
            )}
          </div>
          
          <div className="webinar-card__actions">
            {status === 'Completed' ? (
              isRecorded ? (
                <Link to={recordingUrl || `/lms/webinars/${_id}`} className="webinar-card__recording-btn">
                  <FaPlay /> Watch Recording
                </Link>
              ) : (
                <span className="webinar-card__ended">Webinar Ended</span>
              )
            ) : isRegistered ? (
              <a 
                href={registrantJoinUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="webinar-card__join-btn"
              >
                Join Webinar
              </a>
            ) : (
              <Link to={`/lms/webinars/${_id}`} className="webinar-card__register-btn">
                Register Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

WebinarCard.propTypes = {
  webinar: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    startDate: PropTypes.string,
    duration: PropTypes.number,
    type: PropTypes.string,
    category: PropTypes.string,
    level: PropTypes.string,
    presenter: PropTypes.object,
    registrationCount: PropTypes.number,
    thumbnailUrl: PropTypes.string,
    isRegistered: PropTypes.bool,
    registrantJoinUrl: PropTypes.string,
    status: PropTypes.string,
    isRecorded: PropTypes.bool,
    recordingUrl: PropTypes.string,
    timezone: PropTypes.string
  }).isRequired,
  compact: PropTypes.bool
};

export default WebinarCard;
