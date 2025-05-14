import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import AdminRoutes from './routes/AdminRoutes';
import Login from './components/auth/Login';
// Import other components as needed

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          {/* Admin routes */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Add other routes as needed */}
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App; 