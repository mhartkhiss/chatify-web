import React, { useState, useEffect } from 'react';
import { Avatar, Box, Typography, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { getDatabase, ref, onValue } from "firebase/database"; // Firebase imports
import SearchBar from './SearchBar';
import { green, grey } from '@mui/material/colors';
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ currentUser, selectChatUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // State to store filtered users
  const [conversations, setConversations] = useState([]); // Track conversations
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Log out the user
      localStorage.removeItem('currentUser'); // Clear user session if using localStorage
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');

    // Fetch all users from Firebase
    onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const allUsers = Object.values(usersData).filter(user => user.userId !== currentUser.uid); // Exclude current user
        setUsers(allUsers); // Store all users
        setFilteredUsers(allUsers); // Initially, show all users
      }
    });
  }, [currentUser]);

  // Handle search input from SearchBar
  const handleSearch = (query) => {
    if (query === "") {
      setFilteredUsers(users); // If query is empty, show all users
    } else {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(lowerCaseQuery) ||
        user.email.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredUsers(filtered); // Update filtered users list
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',               // Full viewport height
        backgroundColor: grey[100],
        p: 2,
        borderRight: '1px solid #ddd',  // Optional: Adds a border to the right
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Fixed section for "Chats" label and SearchBar */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: grey[100], pb: 2 }}>
        <Typography variant="h6" gutterBottom onClick={handleLogout} sx={{ cursor: 'pointer' }}>
          Chatify
        </Typography>
        <SearchBar onSearch={handleSearch} /> {/* Pass the search handler */}
      </Box>
      
      {/* Scrollable list of users */}
      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        <List>
          {/* Display filtered users */}
          {filteredUsers.map(user => (
            <ListItem key={user.userId} button onClick={() => selectChatUser(user)}>
              <ListItemAvatar>
                <Avatar src={user.profileImageUrl} sx={{ bgcolor: user.online ? green[500] : grey[300] }} />
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={user.email}
                sx={{ ml: 1 }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;
