import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const InstructorRoute = ({ children }) => {
    const { user, authTokens } = useContext(AuthContext);
    
    // Debug log to see what's happening every time this component renders
    useEffect(() => {
        console.log('InstructorRoute check:', {
            hasAuthTokens: !!authTokens,
            tokenDetails: authTokens ? {
                access: authTokens.access ? authTokens.access.substring(0, 10) + '...' : 'missing',
                refresh: authTokens.refresh ? 'present' : 'missing'
            } : null,
            user: user ? {
                username: user.username,
                role: user.role
            } : null
        });
    }, [user, authTokens]);

    // Simple combined check - if no tokens or user isn't an instructor, redirect
    if (!authTokens || !user || user.role !== 'instructor') {
        // Only log when there's a real issue
        console.log('Access denied to instructor route:', { 
            hasAuthTokens: !!authTokens,
            isLoggedIn: !!user,
            role: user?.role,
            redirecting: !authTokens || !user ? 'to login' : 'to student dashboard'
        });
        
        if (!authTokens || !user) {
            return <Navigate to="/login" replace />;
        } else {
            return <Navigate to="/student/dashboard" replace />;
        }
    }
    
    // User is authenticated and is an instructor, render the children
    console.log('✅ InstructorRoute: Access granted to instructor route');
    return children;
};

export default InstructorRoute; 