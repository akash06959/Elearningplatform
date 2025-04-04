import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens') 
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null
    );
    const [user, setUser] = useState(() =>
        localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user'))
            : null
    );

    const navigate = useNavigate();

    const loginUser = (userData, tokens) => {
        setAuthTokens(tokens);
        setUser(userData);
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userType', userData.role);
    };

    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        navigate('/login');
    }, [navigate]);

    useEffect(() => {
        // If we have tokens but no user data, try to get user data from tokens
        if (authTokens && !user) {
            try {
                const token = authTokens.access;
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const payload = JSON.parse(jsonPayload);
                const userData = {
                    username: payload.username || payload.user_id,
                    role: localStorage.getItem('userType') || 'student'
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (error) {
                console.error('Error decoding token:', error);
                logoutUser();
            }
        }
    }, [authTokens, user, logoutUser]);

    const contextData = {
        user,
        setUser,
        authTokens,
        setAuthTokens,
        loginUser,
        logoutUser,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
}; 