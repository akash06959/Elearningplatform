// Initialize the Google Sign-In API
export const initGoogleAuth = () => {
  return new Promise((resolve) => {
    // Load the Google Sign-In API script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      resolve();
    };
    document.body.appendChild(script);
  });
};

// Handle the response from Google Sign-In
const handleGoogleResponse = async (response) => {
  try {
    // Send the ID token to your backend
    const res = await fetch('/api/auth/google/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: response.credential,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to authenticate with Google');
    }

    const data = await res.json();
    
    // Store tokens
    const tokens = {
      access: data.access,
      refresh: data.refresh
    };
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    
    // Store user info
    const userInfo = {
      username: data.username,
      user_type: data.user_type?.toLowerCase(),
      role: data.user_type?.toLowerCase()
    };
    localStorage.setItem('user', JSON.stringify(userInfo));
    localStorage.setItem('user_type', userInfo.user_type);

    // Redirect based on user type
    window.location.href = userInfo.user_type === 'instructor' 
      ? '/instructor/dashboard'
      : '/student/dashboard';
  } catch (error) {
    console.error('Google authentication error:', error);
    alert('Failed to authenticate with Google. Please try again.');
  }
};

// Render the Google Sign-In button
export const renderGoogleButton = (elementId) => {
  if (!window.google) return;
  
  window.google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      theme: 'outline',
      size: 'large',
      width: document.getElementById(elementId).offsetWidth,
    }
  );
}; 