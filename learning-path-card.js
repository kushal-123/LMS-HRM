import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaBook, FaClock, FaUserGraduate, FaGraduationCap, FaChartLine } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const LearningPathCard = ({ path }) => {
  const {
    _id,
    name,
    description,
    thumbnail,
    courses,
    skillsDeveloped,
    estimatedCompletionDays,
    enrollmentCount,
    isEnrolled,
    enrollmentProgress,
    completedCourses,
    isCompleted,
    targetRoles,
    career
  } = path;

  // Truncate description
  const truncateDescription = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  // Format days to months/weeks
  const formatEstimatedTime = (days) => {
    if (days >= 30) {
      const months = Math.round(days / 30);
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else {
      const weeks = Math.ceil(days / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    }
  };

  return (
    <div className={`learning-path-card ${isCompleted ? 'learning-path-card--completed' : ''}`}>
      <div className="learning-path-card__image-container">
        <Link to={`/lms/learning-paths/${_id}`}>
          <img 
            src={thumbnail || '/assets/images/default-path.jpg'} 
            alt={name} 
            className="learning-path-card__image" 
          />
        </Link>
        
        {career && career.type && (
          <div className={`learning-path-card__level learning-path-card__level--${career.type.toLowerCase()}`}>
            {career.type}
          </div>
        )}
        
        {isEnrolled && (
          <div className="learning-path-card__progress-circle">
            <CircularProgressbar
              value={enrollmentProgress || 0}
              text={`${enrollmentProgress || 0}%`}
              styles={buildStyles({
                textSize: '28px',
                pathColor: isCompleted ? '#38b000' : '#4a6cf7',
                textColor: '#333',
                trailColor: '#d6d6d6',
                backgroundColor: '#fff'
              })}
            />
          </div>
        )}
      </div>
      
      <div className="learning-path-card__content">
        <Link to={`/lms/learning-paths/${_id}`} className="learning-path-card__title-link">
          <h3 className="learning-path-card__title">{name}</h3>
        </Link>
        
        <div className="learning-path-card__meta">
          <span className="learning-path-card__courses">
            <FaBook /> {courses?.length || 0} courses
          </span>
          <span className="learning-path-card__duration">
            <FaClock /> {formatEstimatedTime(estimatedCompletionDays)}
          </span>
          <span className="learning-path-card__enrollment">
            <FaUserGraduate /> {enrollmentCount || 0} enrolled
          </span>
        </div>
        
        <p className="learning-path-card__description">
          {truncateDescription(description)}
        </p>
        
        {targetRoles && targetRoles.length > 0 && (
          <div className="learning-path-card__roles">
            <span className="learning-path-card__roles-label">Target Roles:</span>
            {targetRoles.slice(0, 3).map((role, idx) => (
              <span key={idx} className="learning-path-card__role-tag">
                {role}
              </span>
            ))}
            {targetRoles.length > 3 && (
              <span className="learning-path-card__more-tag">
                +{targetRoles.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="learning-path-card__footer">
          {skillsDeveloped && skillsDeveloped.length > 0 && (
            <div className="learning-path-card__skills">
              <FaChartLine /> {skillsDeveloped.length} skills
            </div>
          )}
          
          {isEnrolled ? (
            <div className="learning-path-card__status">
              {isCompleted ? (
                <div className="learning-path-card__completed">
                  <FaGraduationCap /> Completed
                </div>
              ) : (
                <div className="learning-path-card__progress-text">
                  {completedCourses}/{courses?.length || 0} courses completed
                </div>
              )}
              <Link 
                to={`/lms/learning-paths/${_id}`} 
                className="learning-path-card__continue-btn"
              >
                {isCompleted ? 'View Path' : 'Continue'}
              </Link>
            </div>
          ) : (
            <Link 
              to={`/lms/learning-paths/${_id}`} 
              className="learning-path-card__enroll-btn"
            >
              View Path
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

LearningPathCard.propTypes = {
  path: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    thumbnail: PropTypes.string,
    courses: PropTypes.array,
    skillsDeveloped: PropTypes.array,
    estimatedCompletionDays: PropTypes.number,
    enrollmentCount: PropTypes.number,
    isEnrolled: PropTypes.bool,
    enrollmentProgress: PropTypes.number,
    completedCourses: PropTypes.number,
    isCompleted: PropTypes.bool,
    targetRoles: PropTypes.array,
    career: PropTypes.object
  }).isRequired
};

export default LearningPathCard;
