import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import Login from './components/login-register/Login';
import ChatPage from './components/chat/ChatPage';
import Register from './components/login-register/Register';
import ForgotPassword from './components/login-register/ForgotPassword';

const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
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
      <Route path="/register" element={<Register />} />
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
      <Route path="/forgot-password" element={<ForgotPassword />} />
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

