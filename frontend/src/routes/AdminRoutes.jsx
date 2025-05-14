import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import UsersManagement from '../components/admin/UsersManagement';
import CoursesManagement from '../components/admin/CoursesManagement';

// Protected Route wrapper component
const ProtectedAdminRoute = ({ children }) => {
  // Get user info from localStorage or context
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = user.role === 'admin' || user.user_type === 'admin';

  if (!isAdmin) {
    // Redirect to login if not admin
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedAdminRoute>
            <UsersManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedAdminRoute>
            <CoursesManagement />
          </ProtectedAdminRoute>
        }
      />
      {/* Add more admin routes as needed */}
    </Routes>
  );
};

export default AdminRoutes; 