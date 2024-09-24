import React, { useState, useEffect } from 'react';
import { Avatar, Box, Typography, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { getDatabase, ref, onValue } from "firebase/database"; // Firebase imports
import SearchBar from './SearchBar';
import { green, grey } from '@mui/material/colors';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ currentUser, selectChatUser }) => {
  const [users, setUsers] = useState([]); // All users
  const [conversations, setConversations] = useState([]); // Users with conversations
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
      }
    });

    // Fetch conversations
    const fetchConversations = () => {
      const conversationPromises = users.map(user => {
        const chatId = currentUser.uid < user.userId 
          ? `${currentUser.uid}_${user.userId}` 
          : `${user.userId}_${currentUser.uid}`;
        
        const chatRef = ref(db, `messages/${chatId}`);

        // Listen for changes in the conversation between current user and this user
        return new Promise((resolve) => {
          onValue(chatRef, (snapshot) => {
            const messages = snapshot.val();
            if (messages) {
              // Find the latest message by sorting messages by timestamp
              const lastMessage = Object.values(messages).sort((a, b) => b.timestamp - a.timestamp)[0];
              resolve({ user, lastMessage });
            } else {
              resolve(null); // No conversation
            }
          });
        });
      });

      // Process and sort conversation data
      Promise.all(conversationPromises).then(conversations => {
        const validConversations = conversations.filter(conversation => conversation !== null);
        // Sort conversations by the latest message timestamp dynamically
        validConversations.sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
        setConversations(validConversations);
      });
    };

    // Only fetch conversations if users are loaded
    if (users.length > 0) {
      fetchConversations();
    }
  }, [currentUser, users]);

  // Get the list of users without conversations
  const usersWithoutConversations = users.filter(user =>
    !conversations.some(conversation => conversation.user.userId === user.userId)
  );

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
        <SearchBar />
      </Box>
      
      {/* Scrollable list of users */}
      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        <List>
          {/* Display users with conversations first */}
          {conversations.map(({ user, lastMessage }) => (
            <ListItem key={user.userId} button onClick={() => selectChatUser(user)}>
              <ListItemAvatar>
                <Avatar src={user.profileImageUrl} sx={{ bgcolor: user.online ? green[500] : grey[300] }} />
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={`Last message: ${new Date(lastMessage.timestamp).toLocaleTimeString()}`}
                sx={{ ml: 1 }}
                primaryTypographyProps={{ fontSize: '1rem' }}
                secondaryTypographyProps={{ fontSize: '0.8rem', color: 'gray' }}
              />
            </ListItem>
          ))}

          {/* Display users without conversations */}
          {usersWithoutConversations.map((user) => (
            <ListItem key={user.userId} button onClick={() => selectChatUser(user)}>
              <ListItemAvatar>
                <Avatar src={user.profileImageUrl} sx={{ bgcolor: user.online ? green[500] : grey[300] }} />
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={user.language}  // No conversation, so just show other info
                sx={{ ml: 1 }}
                primaryTypographyProps={{ fontSize: '1rem' }}
                secondaryTypographyProps={{ fontSize: '0.8rem', color: 'gray' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;
