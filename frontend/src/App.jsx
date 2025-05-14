// App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import Login from './components/auth/Login';
import StudentDashboard from './components/student/StudentDashboard';
import Register from './components/auth/Register';
import CourseList from './components/courses/CourseList';
import CourseDetail from './components/courses/CourseDetail';
import CourseLearning from './components/courses/CourseLearning';
import CourseRedirect from './components/courses/CourseRedirect';
import InstructorCourseList from './components/instructor/CourseList';
import CreateCourse from './components/instructor/CreateCourse';
import EditCourse from './components/instructor/EditCourse';
import InstructorCourseDetail from './components/instructor/InstructorCourseDetail';
import ForgotPassword from './components/auth/ForgotPassword';
import InstructorRoute from './components/auth/InstructorRoute';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import InstructorList from './components/instructors/InstructorList';
import UserProfile from './components/users/UserProfile';
import EditProfile from './components/users/EditProfile';
import EnrollmentList from './components/enrollments/EnrollmentList';
import NotificationList from './components/notifications/NotificationList';

// Auth check component that uses AuthContext
const RequireAuth = ({ children }) => {
  const { authTokens } = useContext(AuthContext);
  const location = useLocation();
  
  console.log('RequireAuth check for path:', location.pathname, 'Auth tokens present:', !!authTokens);
  
  // Save the current location to redirect back after login
  if (!authTokens) {
    console.log('No auth tokens found in RequireAuth, redirecting to login');
    // Save the location they were trying to access
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  try {
    // Try to parse the token to see if it's valid JSON
    const tokens = JSON.parse(JSON.stringify(authTokens));
    if (!tokens.access) {
      console.log('Auth tokens missing access token, redirecting to login');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Check if token is expired (if it has an exp field)
    if (tokens.access_token_exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (tokens.access_token_exp < currentTime) {
        console.log('Auth token expired, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
    }
    
    console.log('Auth check passed, rendering protected route');
    return children;
  } catch (error) {
    console.error('Error parsing auth tokens:', error);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

function App() {
  const { user, authTokens } = useContext(AuthContext);

  // Function to check if user is an instructor
  const isInstructor = () => {
    if (!user) return false;
    return user.role === 'instructor';
  };

  // Function to redirect based on user type
  const redirectToDashboard = () => {
    console.log('Redirecting to dashboard. User:', user);
    if (!user || !authTokens) {
      return <Navigate to="/login" replace />;
    }
    return isInstructor() ? 
      <Navigate to="/instructor/dashboard" replace /> : 
      <Navigate to="/student/dashboard" replace />;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Course redirect route - publicly accessible */}
      <Route path="/redirect/course/:courseId" element={<CourseRedirect />} />
      
      {/* Test route for CourseLearning without auth */}
      <Route path="/test/courses/:courseId/learn" element={<CourseLearning />} />
      
      {/* Root route with redirect */}
      <Route 
        path="/" 
        element={
          <RequireAuth>
            {redirectToDashboard()}
          </RequireAuth>
        } 
      />
      
      {/* Student routes */}
      <Route
        path="/student/dashboard"
        element={
          <RequireAuth>
            <StudentDashboard />
          </RequireAuth>
        }
      />
      
      <Route
        path="/enrollments"
        element={<EnrollmentList />}
      />
      
      <Route
        path="/notifications"
        element={<NotificationList />}
      />
      
      {/* Course routes - Make sure CourseLearning route comes before CourseDetail */}
      <Route
        path="/courses/:courseId/learn"
        element={
          <RequireAuth>
            {console.log("Matched /courses/:courseId/learn route")}
            <CourseLearning />
          </RequireAuth>
        }
      />
      
      <Route
        path="/courses/:courseId"
        element={
          <RequireAuth>
            <CourseDetail />
          </RequireAuth>
        }
      />
      
      <Route
        path="/courses"
        element={
          <RequireAuth>
            <CourseList />
          </RequireAuth>
        }
      />
      
      {/* Instructor routes */}
      <Route
        path="/instructor/dashboard"
        element={
          <RequireAuth>
            <InstructorRoute>
              <InstructorDashboard />
            </InstructorRoute>
          </RequireAuth>
        }
      />
      
      <Route
        path="/instructor/courses"
        element={
          <RequireAuth>
            <InstructorRoute>
              <InstructorCourseList />
            </InstructorRoute>
          </RequireAuth>
        }
      />
      
      <Route
        path="/instructor/courses/create"
        element={
          <RequireAuth>
            <InstructorRoute>
              <CreateCourse />
            </InstructorRoute>
          </RequireAuth>
        }
      />
      
      <Route
        path="/instructor/courses/:courseId/view"
        element={
          <RequireAuth>
            <InstructorRoute>
              <InstructorCourseDetail />
            </InstructorRoute>
          </RequireAuth>
        }
      />
      
      <Route
        path="/instructor/courses/:courseId/edit"
        element={
          <RequireAuth>
            <InstructorRoute>
              <EditCourse />
            </InstructorRoute>
          </RequireAuth>
        }
      />
      
      <Route
        path="/instructors"
        element={
          <RequireAuth>
            <InstructorList />
          </RequireAuth>
        }
      />

      {/* User Profile Routes */}
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <UserProfile />
          </RequireAuth>
        }
      />
      
      <Route
        path="/profile/edit"
        element={
          <RequireAuth>
            <EditProfile />
          </RequireAuth>
        }
      />

      {/* Catch all other routes and redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;