import React, { useState } from 'react';
import { Grid } from '@mui/material';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

const ChatLayout = ({ currentUser }) => {
  const [chatUser, setChatUser] = useState(null); // The user currently being chatted with

  const handleSelectChatUser = (user) => {
    setChatUser(user);
  };

  return (
    <Grid container>
      <Grid item xs={3}>
        <Sidebar currentUser={currentUser} selectChatUser={handleSelectChatUser} />
      </Grid>
      <Grid item xs={9}>
        {chatUser ? (
          <ChatArea currentUser={currentUser} chatUser={chatUser} />
        ) : (
          <div>Select a user to start chatting</div>
        )}
      </Grid>
    </Grid>
  );
};

export default ChatLayout;
