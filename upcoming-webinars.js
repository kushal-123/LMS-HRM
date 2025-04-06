import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import WebinarCard from './WebinarCard';
import { FaCalendarPlus } from 'react-icons/fa';

const UpcomingWebinars = ({ webinars, loading, limit = 3, showEmpty = true }) => {
  // Filter only upcoming webinars
  const upcomingWebinars = webinars?.filter(webinar => 
    webinar.status === 'Scheduled' || webinar.status === 'In Progress'
  ) || [];
  
  // Limit the number of webinars shown
  const limitedWebinars = upcomingWebinars.slice(0, limit);
  
  // If loading
  if (loading) {
    return (
      <div className="upcoming-webinars__loading">
        <div className="loading-spinner"></div>
        <p>Loading upcoming webinars...</p>
      </div>
    );
  }
  
  // If no webinars and showing empty state
  if (upcomingWebinars.length === 0 && showEmpty) {
    return (
      <div className="upcoming-webinars__empty">
        <div className="upcoming-webinars__empty-icon">
          <FaCalendarPlus />
        </div>
        <p className="upcoming-webinars__empty-text">
          No upcoming webinars at the moment.
        </p>
        <p className="upcoming-webinars__empty-subtext">
          Check back later for new events or browse our recorded webinars.
        </p>
        <Link to="/lms/webinars?past=true" className="upcoming-webinars__empty-link">
          View Recorded Webinars
        </Link>
      </div>
    );
  }
  
  // If no webinars and not showing empty state
  if (upcomingWebinars.length === 0 && !showEmpty) {
    return null;
  }
  
  return (
    <div className="upcoming-webinars">
      <div className="upcoming-webinars__list">
        {limitedWebinars.map(webinar => (
          <WebinarCard 
            key={webinar._id} 
            webinar={webinar} 
            compact={true} 
          />
        ))}
      </div>
      
      {upcomingWebinars.length > limit && (
        <div className="upcoming-webinars__more">
          <Link to="/lms/webinars" className="upcoming-webinars__more-link">
            View All Webinars ({upcomingWebinars.length})
          </Link>
        </div>
      )}
    </div>
  );
};

UpcomingWebinars.propTypes = {
  webinars: PropTypes.array,
  loading: PropTypes.bool,
  limit: PropTypes.number,
  showEmpty: PropTypes.bool
};

export default UpcomingWebinars;
