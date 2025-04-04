// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import Login from './components/auth/Login';
import StudentDashboard from './components/student/StudentDashboard';
import Register from './components/auth/Register';
import CourseList from './components/courses/CourseList';
import CourseDetail from './components/courses/CourseDetail';
import InstructorCourseList from './components/instructor/CourseList';
import CreateCourse from './components/instructor/CreateCourse';
import ForgotPassword from './components/auth/ForgotPassword';
import InstructorRoute from './components/auth/InstructorRoute';
import InstructorDashboard from './components/instructor/InstructorDashboard';

function App() {
  const { user } = useContext(AuthContext);

  // Function to check if user is an instructor
  const isInstructor = () => {
    try {
      const userType = localStorage.getItem('userType');
      return userType === 'instructor' || user?.role === 'instructor';
    } catch (error) {
      console.error('Error checking instructor status:', error);
      return false;
    }
  };

  // Function to redirect based on user type
  const redirectToDashboard = () => {
    console.log('Redirecting to dashboard. User type:', user?.role, 'Is instructor:', isInstructor());
    return isInstructor() ? <Navigate to="/inst_dashboard" replace /> : <Navigate to="/std_dashboard" replace />;
  };

  return (
    <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Default route - show login page */}
      <Route path="/" element={<Login />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Dashboard redirect route */}
      <Route path="/home" element={
        localStorage.getItem('authTokens') 
          ? redirectToDashboard()
          : <Navigate to="/login" replace />
      } />
      
      {/* Student Routes */}
      <Route path="/std_dashboard" element={
        <RequireAuth>
          <StudentDashboard />
        </RequireAuth>
      } />
      <Route path="/courses" element={<CourseList />} />
      <Route path="/courses/:courseId" element={<CourseDetail />} />
      
      {/* Instructor Routes - Protected */}
      <Route 
        path="/inst_dashboard" 
        element={
          <InstructorRoute>
            <InstructorDashboard />
          </InstructorRoute>
        } 
      />
      <Route 
        path="/instructor/courses" 
        element={
          <InstructorRoute>
            <InstructorCourseList />
          </InstructorRoute>
        } 
      />
      <Route 
        path="/instructor/create-course" 
        element={
          <InstructorRoute>
            <CreateCourse />
          </InstructorRoute>
        } 
      />
      <Route 
        path="/instructor/courses/:courseId" 
        element={
          <InstructorRoute>
            <CourseDetail />
          </InstructorRoute>
        } 
      />
      
      {/* Redirect old dashboard path */}
      <Route path="/dashboard" element={redirectToDashboard()} />

      {/* Catch all other routes and redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Auth check component that uses AuthContext
const RequireAuth = ({ children }) => {
  const { authTokens } = useContext(AuthContext);
  if (!authTokens) {
    console.log('No auth tokens found in RequireAuth, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default App;