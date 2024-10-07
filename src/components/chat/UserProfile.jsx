import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout'; // Import the LogoutIcon
import SettingsIcon from '@mui/icons-material/Settings'; // Import the SettingsIcon
import { auth, database } from '../../firebaseConfig'; // Firebase auth and database imports
import { ref, onValue } from 'firebase/database'; // Firebase Realtime Database functions

const UserProfile = ({ currentUser }) => {
  const [userData, setUserData] = useState({
    profileImageUrl: '/default-avatar.png', // Default fallback image
    username: 'Anonymous User',
    language: '',
  });

  // Fetch all user data (profileImageUrl, language, etc.) from Firebase Realtime Database
  useEffect(() => {
    const userRef = ref(database, `users/${currentUser.uid}`); // Reference to the user's data in Firebase
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserData({
          profileImageUrl: data.profileImageUrl || '/default-avatar.png',
          username: data.username || 'Anonymous User',
          language: data.language || '',
        });
      }
    });

    // Clean up the listener when the component is unmounted
    return () => unsubscribe();
  }, [currentUser.uid]);

  // Define the handleLogout function directly in this component
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Firebase sign out
      window.location.href = '/login'; // Redirect to login page after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 1.5,
      borderRadius: '5px',
      backgroundColor: '#7a49a5', // Dark background similar to Discord
      color: '#fff', // White text color
      borderTop: '1px solid #23272A' // Slightly lighter border on top
    }}>
      {/* Avatar and user info */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', mr: 2 }}>
          <Avatar 
            src={userData.profileImageUrl} // Use profileImageUrl from the state
            sx={{ width: 40, height: 40 }} 
          />
          {/* Status icon (example: crescent moon for "Do Not Disturb") */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            backgroundColor: '#43b581', // Status icon color (green for online)
            borderRadius: '50%',
            border: '2px solid #2C2F33', // Match background color to look like a border
          }} />
        </Box>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: '500' }}>
            {userData.username} {/* Display the username */}
          </Typography>
          {/* Display the language */}
          <Typography variant="caption" sx={{ color: '#b9bbbe' }}>
            {userData.language || currentUser.email} {/* If no language, display email */}
          </Typography>
        </Box>
      </Box>

      {/* Icons: Logout and Settings */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton sx={{ color: '#b9bbbe' }} onClick={handleLogout}>
          <LogoutIcon />
        </IconButton>
        <IconButton sx={{ color: '#b9bbbe' }} onClick={() => console.log('Settings Clicked')}>
          <SettingsIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default UserProfile;
