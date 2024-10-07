import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemText, Avatar, ListItemAvatar } from '@mui/material';
import { getDatabase, ref, onValue } from 'firebase/database';
import SearchBar from './SearchBar';
import UserProfile from './UserProfile'; // Import UserProfile component

const Sidebar = ({ currentUser, selectChatUser, handleLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userConversations, setUserConversations] = useState({}); // Store conversations and latest message timestamps
  const [searchQuery, setSearchQuery] = useState(''); // Track the search query

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const messagesRef = ref(db, 'messages');

    // Fetch all users
    onValue(usersRef, (snapshot) => {
      const allUsers = snapshot.val() ? Object.values(snapshot.val()) : [];
      const otherUsers = allUsers.filter(user => user.userId !== currentUser.uid);
      setUsers(otherUsers);
    });

    // Fetch conversations and latest message timestamps for the current user
    onValue(messagesRef, (snapshot) => {
      const conversations = snapshot.val();
      const userConvo = {};

      if (conversations) {
        Object.keys(conversations).forEach(chatId => {
          const participants = chatId.split('_');
          if (participants.includes(currentUser.uid)) {
            const otherUserId = participants.find(uid => uid !== currentUser.uid);

            // Find the latest message for this conversation
            const messages = Object.values(conversations[chatId]);
            const latestMessage = messages.reduce((latest, current) => {
              return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
            });

            userConvo[otherUserId] = {
              hasConversation: true,
              latestMessageTimestamp: latestMessage.timestamp, // Store latest message timestamp
            };
          }
        });
      }

      setUserConversations(userConvo); // Save user's conversation and timestamp data
    });
  }, [currentUser]);

  // Sort users based on the latest message timestamps
  const sortUsersByLatestMessage = (userList) => {
    return userList.sort((a, b) => {
      const timestampA = userConversations[a.userId]?.latestMessageTimestamp || 0;
      const timestampB = userConversations[b.userId]?.latestMessageTimestamp || 0;
      return new Date(timestampB) - new Date(timestampA); // Sort in descending order
    });
  };

  // Update filtered users based on search query
  useEffect(() => {
    let usersToDisplay = [];

    if (searchQuery.trim()) {
      // If there is a search query, show all users that match the query (including those without conversations)
      const lowerCaseQuery = searchQuery.toLowerCase();
      usersToDisplay = users.filter(user =>
        user.username.toLowerCase().includes(lowerCaseQuery) ||
        user.email.toLowerCase().includes(lowerCaseQuery)
      );
    } else {
      // If no search query, show only users with active conversations
      usersToDisplay = users.filter(user => userConversations[user.userId]?.hasConversation);
    }

    // Sort the users based on the latest message timestamps
    const sortedUsers = sortUsersByLatestMessage(usersToDisplay);
    setFilteredUsers(sortedUsers);
  }, [searchQuery, users, userConversations]);

  // Handle search input from the SearchBar component
  const handleSearch = (query) => {
    setSearchQuery(query); // Update the search query
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
                secondary={user.email}
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
