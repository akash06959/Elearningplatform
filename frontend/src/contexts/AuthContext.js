import { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens') 
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null
    );
    
    const [user, setUser] = useState(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Error parsing user from localStorage:', e);
                return null;
            }
        }
        return null;
    });

    const navigate = useNavigate();

    const loginUser = async (userData, tokens) => {
        console.log('LoginUser called with:', { userData, tokens });
        
        // Store tokens
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        setAuthTokens(tokens);

        // Store user info with consistent role field
        const userInfo = {
            ...userData,
            username: userData.username,
            role: userData.user_type?.toLowerCase(),
            user_type: userData.user_type?.toLowerCase(),
            profile_picture: userData.profile_picture || null,
        };
        
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('user_type', userInfo.user_type);
        setUser(userInfo);

        console.log('User state updated:', userInfo);
        
        // Return the dashboard path based on role
        return userInfo.role === 'instructor' ? '/instructor/dashboard' : '/student/dashboard';
    };

    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        navigate('/login');
    }, [navigate]);

    const updateUserProfile = async (profileData) => {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = {
            ...currentUser,
            ...profileData,
            profile_picture: profileData.profile_picture 
                ? profileData.profile_picture.startsWith('http') 
                    ? profileData.profile_picture 
                    : `http://localhost:8000${profileData.profile_picture.replace(/^\/media/, '/media')}`
                : currentUser.profile_picture,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const contextData = {
        user,
        setUser,
        authTokens,
        setAuthTokens,
        loginUser,
        logoutUser,
        updateUserProfile,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 