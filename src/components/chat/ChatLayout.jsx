import React, { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

const ChatLayout = ({ currentUser }) => {
  const [chatUser, setChatUser] = useState(null);

  // Handle selecting a user from the sidebar
  const handleSelectChatUser = (user) => {
    setChatUser(user); // Set the selected chat user
  };

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f0f2f5',  // Light background for the layout
      
    }}>
      <Box sx={{
        width: '25%',
        borderRight: '1px solid #ddd',  // Border between sidebar and chat area
        boxShadow: 3,
      }}>
        <Sidebar currentUser={currentUser} selectChatUser={handleSelectChatUser} />

      </Box>
      <Box sx={{
        width: '75%',
        backgroundColor: '#fff',  // Main chat area background
      }}>
        {chatUser ? (
          <ChatArea currentUser={currentUser} chatUser={chatUser} />
        ) : (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '24px',
            color: '#888',
          }}>
            Select a chat to start messaging
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatLayout;
