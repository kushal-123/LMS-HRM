import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './redux/store';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { LMSProvider } from './contexts/LMSContext';

// Layout Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Sidebar from './components/common/Sidebar';

// LMS Pages
import LMSDashboard from './pages/LMS/LMSDashboard';
import CoursesCatalog from './pages/LMS/CoursesCatalog';
import CourseViewer from './pages/LMS/CourseViewer';
import LearningPathsPage from './pages/LMS/LearningPathsPage';
import LearningPathViewer from './pages/LMS/LearningPathViewer';
import WebinarPage from './pages/LMS/WebinarPage';
import LeaderboardPage from './pages/LMS/LeaderboardPage';
import CertificatesPage from './pages/LMS/CertificatesPage';
import MySkillsPage from './pages/LMS/MySkillsPage';

// Admin Pages
import AdminLMSPanel from './pages/Admin/AdminLMSPanel';
import AdminCourseBuilder from './pages/Admin/AdminCourseBuilder';
import AdminUserProgress from './pages/Admin/AdminUserProgress';
import AdminLearningPaths from './pages/Admin/AdminLearningPaths';
import AdminWebinars from './pages/Admin/AdminWebinars';
import AdminGamification from './pages/Admin/AdminGamification';
import AdminAnalytics from './pages/Admin/AdminAnalytics';

// Auth Guards
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';

// Global Styles
import './styles/global.css';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <LMSProvider>
          <Router>
            <div className="app-container">
              <Header />
              <div className="main-content">
                <Sidebar />
                <div className="content-wrapper">
                  <Routes>
                    {/* Public/Protected LMS Routes */}
                    <Route path="/lms" element={<PrivateRoute><LMSDashboard /></PrivateRoute>} />
                    <Route path="/lms/courses" element={<PrivateRoute><CoursesCatalog /></PrivateRoute>} />
                    <Route path="/lms/courses/:id" element={<PrivateRoute><CourseViewer /></PrivateRoute>} />
                    <Route path="/lms/learning-paths" element={<PrivateRoute><LearningPathsPage /></PrivateRoute>} />
                    <Route path="/lms/learning-paths/:id" element={<PrivateRoute><LearningPathViewer /></PrivateRoute>} />
                    <Route path="/lms/webinars" element={<PrivateRoute><WebinarPage /></PrivateRoute>} />
                    <Route path="/lms/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
                    <Route path="/lms/certificates" element={<PrivateRoute><CertificatesPage /></PrivateRoute>} />
                    <Route path="/lms/my-skills" element={<PrivateRoute><MySkillsPage /></PrivateRoute>} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/lms" element={<AdminRoute><AdminLMSPanel /></AdminRoute>} />
                    <Route path="/admin/lms/courses" element={<AdminRoute><AdminCourseBuilder /></AdminRoute>} />
                    <Route path="/admin/lms/courses/:id" element={<AdminRoute><AdminCourseBuilder /></AdminRoute>} />
                    <Route path="/admin/lms/users" element={<AdminRoute><AdminUserProgress /></AdminRoute>} />
                    <Route path="/admin/lms/learning-paths" element={<AdminRoute><AdminLearningPaths /></AdminRoute>} />
                    <Route path="/admin/lms/webinars" element={<AdminRoute><AdminWebinars /></AdminRoute>} />
                    <Route path="/admin/lms/gamification" element={<AdminRoute><AdminGamification /></AdminRoute>} />
                    <Route path="/admin/lms/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                    
                    {/* Default redirect to dashboard if logged in */}
                    <Route path="/" element={<PrivateRoute><LMSDashboard /></PrivateRoute>} />
                  </Routes>
                </div>
              </div>
              <Footer />
            </div>
          </Router>
          <ToastContainer position="top-right" autoClose={3000} />
        </LMSProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
