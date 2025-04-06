import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaStar, FaClock, FaUserGraduate, FaLock } from 'react-icons/fa';
import EnrollmentButton from './EnrollmentButton';
import CourseProgress from './CourseProgress';

const CourseCard = ({ course }) => {
  const {
    _id,
    title,
    description,
    category,
    level,
    thumbnail,
    duration,
    rating,
    enrollmentCount,
    isEnrolled,
    progress,
    isPublished
  } = course;

  // Format duration from minutes to hours and minutes
  const formatDuration = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  // Truncate description
  const truncateDescription = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <div className="course-card">
      <div className="course-card__image-container">
        <Link to={`/lms/courses/${_id}`}>
          <img 
            src={thumbnail || '/assets/images/default-course.jpg'} 
            alt={title} 
            className="course-card__image" 
          />
        </Link>
        {!isPublished && (
          <div className="course-card__unpublished">
            <FaLock /> Unpublished
          </div>
        )}
        <div className="course-card__category">{category}</div>
      </div>
      
      <div className="course-card__content">
        <Link to={`/lms/courses/${_id}`} className="course-card__title-link">
          <h3 className="course-card__title">{title}</h3>
        </Link>
        
        <div className="course-card__meta">
          <span className="course-card__level">{level}</span>
          <span className="course-card__duration">
            <FaClock /> {formatDuration(duration)}
          </span>
          <span className="course-card__enrollment">
            <FaUserGraduate /> {enrollmentCount} enrolled
          </span>
        </div>
        
        <p className="course-card__description">
          {truncateDescription(description)}
        </p>
        
        <div className="course-card__footer">
          <div className="course-card__rating">
            <FaStar /> {rating > 0 ? rating.toFixed(1) : 'New'}
          </div>
          
          {isEnrolled ? (
            <div className="course-card__progress-container">
              <CourseProgress 
                progress={progress} 
                size="small" 
                showLabel={true}
              />
              <Link 
                to={`/lms/courses/${_id}`} 
                className="course-card__continue-btn"
              >
                Continue
              </Link>
            </div>
          ) : (
            <EnrollmentButton courseId={_id} isPublished={isPublished} />
          )}
        </div>
      </div>
    </div>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    duration: PropTypes.number.isRequired,
    rating: PropTypes.number,
    enrollmentCount: PropTypes.number,
    isEnrolled: PropTypes.bool,
    progress: PropTypes.number,
    isPublished: PropTypes.bool
  }).isRequired
};

export default CourseCard;
