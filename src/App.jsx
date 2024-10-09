import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import Login from './components/login-register/Login';
import ChatPage from './components/chat/ChatPage';
import Register from './components/login-register/Register';
import ForgotPassword from './components/login-register/ForgotPassword';
import chatifyLogo from './assets/chatifylogo.png';

const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <img src={chatifyLogo} alt="Chatify Logo" style={{ width: '250px', height: 'auto' }} />
  </Box>
);

const AppRoutes = () => {
  const { currentUser, loading, logout } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={currentUser ? <Navigate to="/chat" /> : <Login />} />
      <Route path="/register" element={currentUser ? null : <Register />} />
      <Route 
        path="/chat" 
        element={
          currentUser ? (
            <ChatPage currentUser={currentUser} handleLogout={logout} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route path="/forgot-password" element={currentUser ? <Navigate to="/chat" /> : <ForgotPassword />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;

