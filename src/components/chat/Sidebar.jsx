import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemText, Avatar, ListItemAvatar, Typography } from '@mui/material';
import { getDatabase, ref, onValue } from 'firebase/database';
import SearchBar from './SearchBar';
import UserProfile from './UserProfile'; // Import UserProfile component

const Sidebar = ({ currentUser, selectChatUser, handleLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const allUsers = snapshot.val() ? Object.values(snapshot.val()) : [];
      const otherUsers = allUsers.filter(user => user.userId !== currentUser.uid);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers); // Initially, show all users
    });
  }, [currentUser]);

  const handleSearch = (query) => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(lowerCaseQuery) ||
      user.email.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredUsers(filtered);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f7f9fc',
        borderRight: '1px solid #ddd',
        position: 'relative', // Ensure fixed positioning works correctly
      }}
    >
      {/* Search Bar */}
      <Box
        sx={{
          position: 'sticky', // Stick the search bar to the top
          top: 0,
          zIndex: 1,
          backgroundColor: '#f7f9fc', // Make sure it has a background
          p: 2,
          borderBottom: '1px solid #ddd',
        }}
      >
        <SearchBar onSearch={handleSearch} />
      </Box>

      {/* Scrollable List of Users */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        <List>
          {filteredUsers.map(user => (
            <ListItem key={user.userId} button onClick={() => selectChatUser(user)}>
              <ListItemAvatar>
                <Avatar src={user.profileImageUrl} />
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={user.language || user.email}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* UserProfile component at the bottom */}
      <Box
        sx={{
          position: 'sticky', // Stick the profile section to the bottom
          bottom: 0,
          zIndex: 1,
          p: 2,
          backgroundColor: '#f7f9fc',
          borderTop: '1px solid #ddd',
        }}
      >
        <UserProfile currentUser={currentUser} handleLogout={handleLogout} />
      </Box>
    </Box>
  );
};

export default Sidebar;
