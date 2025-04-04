import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const InstructorRoute = ({ children }) => {
    const { user, authTokens } = useContext(AuthContext);

    useEffect(() => {
        console.log('InstructorRoute - Auth Check:', {
            hasAuthTokens: !!authTokens,
            user,
            userType: localStorage.getItem('userType'),
            isInstructor: user?.role === 'instructor'
        });
    }, [authTokens, user]);

    // If no auth tokens, redirect to login
    if (!authTokens) {
        console.log('No auth tokens found, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Check if user is an instructor
    const isInstructor = user?.role === 'instructor' || localStorage.getItem('userType') === 'instructor';
    
    if (!isInstructor) {
        console.log('User is not an instructor:', {
            userRole: user?.role,
            userType: localStorage.getItem('userType')
        });
        return <Navigate to="/std_dashboard" replace />;
    }

    console.log('Access granted to instructor route:', {
        username: user?.username,
        role: user?.role
    });
    
    return children;
};

export default InstructorRoute; 