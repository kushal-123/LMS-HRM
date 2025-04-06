import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaBook, FaGraduationCap, FaTrophy, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

// Components
import Loader from '../../components/common/Loader';
import CourseCard from '../../components/course/CourseCard';
import CourseProgress from '../../components/course/CourseProgress';
import BadgeDisplay from '../../components/gamification/BadgeDisplay';
import LeaderboardTable from '../../components/gamification/LeaderboardTable';
import UpcomingWebinars from '../../components/webinar/UpcomingWebinars';

// Actions
import { getEnrollments } from '../../redux/thunks/enrollmentThunks';
import { getRecommendedCourses } from '../../redux/thunks/courseThunks';
import { getUpcomingWebinars } from '../../redux/thunks/webinarThunks';
import { getUserBadges, getLeaderboard } from '../../redux/thunks/gamificationThunks';

// Styles
import '../../styles/lms-dashboard.css';

const LMSDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { enrollments, loading: enrollmentsLoading } = useSelector(state => state.enrollments);
  const { recommendedCourses, loading: coursesLoading } = useSelector(state => state.courses);
  const { webinars, loading: webinarsLoading } = useSelector(state => state.webinars);
  const { badges, leaderboard, loading: gamificationLoading } = useSelector(state => state.gamification);
  
  const [inProgressCourses, setInProgressCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [requiredCourses, setRequiredCourses] = useState([]);
  
  useEffect(() => {
    dispatch(getEnrollments({ status: 'all', limit: 100 }));
    dispatch(getRecommendedCourses());
    dispatch(getUpcomingWebinars({ limit: 3 }));
    dispatch(getUserBadges());
    dispatch(getLeaderboard({ period: 'month', limit: 5 }));
  }, [dispatch]);
  
  // Process enrollments when data is loaded
  useEffect(() => {
    if (enrollments && enrollments.length > 0) {
      setInProgressCourses(
        enrollments.filter(enrollment => enrollment.status === 'In Progress')
          .sort((a, b) => new Date(b.lastAccessedOn) - new Date(a.lastAccessedOn))
          .slice(0, 3)
      );
      
      setCompletedCourses(
        enrollments.filter(enrollment => enrollment.status === 'Completed')
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 3)
      );
      
      setRequiredCourses(
        enrollments.filter(enrollment => enrollment.isRequired && enrollment.status !== 'Completed')
          .sort((a, b) => {
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate) - new Date(b.dueDate);
            }
            return 0;
          })
      );
    }
  }, [enrollments]);
  
  // Calculate overall learning stats
  const calculateLearningStats = () => {
    if (!enrollments || enrollments.length === 0) return { completed: 0, inProgress: 0, totalHours: 0 };
    
    const completed = enrollments.filter(e => e.status === 'Completed').length;
    const inProgress = enrollments.filter(e => e.status === 'In Progress').length;
    
    // Calculate total learning hours
    const totalMinutes = enrollments.reduce((total, enrollment) => {
      // If course has duration, add it for completed courses or calculate partial for in progress
      if (enrollment.course && enrollment.course.duration) {
        if (enrollment.status === 'Completed') {
          return total + enrollment.course.duration;
        } else {
          // Add partial minutes based on progress
          return total + (enrollment.course.duration * (enrollment.progressPercentage / 100));
        }
      }
      return total;
    }, 0);
    
    return {
      completed,
      inProgress,
      totalHours: Math.round(totalMinutes / 60)
    };
  };
  
  const stats = calculateLearningStats();
  
  if (enrollmentsLoading || coursesLoading || webinarsLoading || gamificationLoading) {
    return <Loader />;
  }
  
  return (
    <div className="lms-dashboard">
      <div className="dashboard-welcome">
        <div className="welcome-message">
          <h1>Welcome back, {user?.name || 'Learner'}!</h1>
          <p className="welcome-text">
            Continue your learning journey and track your progress.
          </p>
        </div>
        
        <div className="learning-stats">
          <div className="stat-card">
            <div className="stat-icon completed-icon">
              <FaGraduationCap />
            </div>
            <div className="stat-content">
              <h3>{stats.completed}</h3>
              <p>Completed Courses</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon progress-icon">
              <FaBook />
            </div>
            <div className="stat-content">
              <h3>{stats.inProgress}</h3>
              <p>In Progress</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon hours-icon">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <h3>{stats.totalHours}</h3>
              <p>Learning Hours</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Required/Compliance Courses Section */}
      {requiredCourses.length > 0 && (
        <div className="dashboard-section required-courses">
          <div className="section-header">
            <h2>Required & Compliance Training</h2>
            <span className="course-count">{requiredCourses.length} course(s) to complete</span>
          </div>
          
          <div className="required-courses-list">
            {requiredCourses.map(enrollment => (
              <div key={enrollment._id} className="required-course-item">
                <div className="required-course-info">
                  <h3>
                    <Link to={`/lms/courses/${enrollment.course._id}`}>
                      {enrollment.course.title}
                    </Link>
                  </h3>
                  <p className="required-by">
                    Required for: {enrollment.requiredBy}
                  </p>
                  <div className="progress-info">
                    <CourseProgress progress={enrollment.progressPercentage} />
                    {enrollment.dueDate && (
                      <p className="due-date">
                        Due: {new Date(enrollment.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Link to={`/lms/courses/${enrollment.course._id}`} className="start-btn">
                  {enrollment.progressPercentage > 0 ? 'Continue' : 'Start Now'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* In Progress Courses Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Continue Learning</h2>
          <Link to="/lms/courses" className="view-all">
            View All Courses
          </Link>
        </div>
        
        {inProgressCourses.length > 0 ? (
          <div className="courses-grid">
            {inProgressCourses.map(enrollment => (
              <CourseCard 
                key={enrollment.course._id} 
                course={{
                  ...enrollment.course,
                  isEnrolled: true,
                  progress: enrollment.progressPercentage
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>You don't have any courses in progress.</p>
            <Link to="/lms/courses" className="btn-primary">
              Explore Courses
            </Link>
          </div>
        )}
      </div>
      
      {/* Recommended Courses Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recommended For You</h2>
          <Link to="/lms/courses" className="view-all">
            View All Courses
          </Link>
        </div>
        
        {recommendedCourses && recommendedCourses.length > 0 ? (
          <div className="courses-grid">
            {recommendedCourses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No recommendations available at the moment.</p>
          </div>
        )}
      </div>
      
      {/* Split Section: Upcoming Webinars & Leaderboard */}
      <div className="dashboard-split-section">
        <div className="dashboard-section webinars-section">
          <div className="section-header">
            <h2>Upcoming Webinars</h2>
            <Link to="/lms/webinars" className="view-all">
              View All
            </Link>
          </div>
          
          <UpcomingWebinars webinars={webinars} limit={3} />
        </div>
        
        <div className="dashboard-section leaderboard-section">
          <div className="section-header">
            <h2>Top Learners This Month</h2>
            <Link to="/lms/leaderboard" className="view-all">
              View Full Leaderboard
            </Link>
          </div>
          
          <LeaderboardTable leaderboard={leaderboard} compact={true} />
        </div>
      </div>
      
      {/* Earned Badges Section */}
      {badges && badges.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Achievements</h2>
            <Link to="/lms/certificates" className="view-all">
              View All Certificates & Badges
            </Link>
          </div>
          
          <div className="badges-container">
            {badges.slice(0, 5).map(badge => (
              <BadgeDisplay key={badge._id} badge={badge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSDashboard;
