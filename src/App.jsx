import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login-register/Login';
import ChatLayout from './components/chat/ChatLayout';
import Register from './components/login-register/Register';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    
    // Listen for user login state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user)); // Store in localStorage
      } else {
        // User is logged out
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
      }
      setLoading(false);
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  // Show loading state until Firebase auth is initialized
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={currentUser ? <Navigate to="/chat" /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={currentUser ? <ChatLayout currentUser={currentUser} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
