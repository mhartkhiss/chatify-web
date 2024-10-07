import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, Grid, TextField, Button } from '@mui/material';
import { getDatabase, ref, onValue, push, set, serverTimestamp, off } from "firebase/database"; // Firebase imports

const ChatArea = ({ currentUser, chatUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(''); // For the new message input
  const messagesEndRef = useRef(null); // Reference to the end of the messages list

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatUser) {
      const db = getDatabase();

      // Combine user IDs to form the key for fetching messages
      const chatId = currentUser.uid < chatUser.userId 
        ? `${currentUser.uid}_${chatUser.userId}` 
        : `${chatUser.userId}_${currentUser.uid}`;
        
      const messagesRef = ref(db, `messages/${chatId}`);

      // Fetch messages from Firebase
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messageList = Object.values(data); // Get all messages
          setMessages(messageList);
        } else {
          setMessages([]); // No messages found
        }
      });

      // Cleanup function to unsubscribe from the previous listener when switching users
      return () => off(messagesRef);  // Unsubscribe from the previous listener
    }
  }, [currentUser, chatUser]);

  // Scroll to bottom when messages are updated or when conversation is opened
  useEffect(() => {
    scrollToBottom(); // Auto-scroll when messages change or conversation opens
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return; // Prevent sending empty messages

    const db = getDatabase();
    const chatId = currentUser.uid < chatUser.userId 
      ? `${currentUser.uid}_${chatUser.userId}` 
      : `${chatUser.userId}_${currentUser.uid}`;

    const messagesRef = ref(db, `messages/${chatId}`);
    const newMessageRef = push(messagesRef); // Create a new message reference

    // Create message object
    const messageData = {
      messageId: newMessageRef.key,
      messageOG: newMessage, // Original message (can be modified later for translations etc.)
      message: newMessage, // Default message is the original message
      senderId: currentUser.uid,
      timestamp: serverTimestamp() // Use Firebase server timestamp
    };

    // Save the message to Firebase
    set(newMessageRef, messageData);

    // Clear the input field after sending the message
    setNewMessage('');
  };

  // Handle keypress event for sending message with "Enter" key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default behavior of adding a new line
      handleSendMessage(); // Trigger sending the message
    }
  };
  

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f7fb' }}>
      {chatUser && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 2, 
            backgroundColor: '#ffffff', 
            borderBottom: '1px solid #e0e0e0', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '0 0 8px 8px' // Slight rounding on the bottom
          }}
        >
          <Avatar src={chatUser.profileImageUrl} sx={{ width: 48, height: 48, mr: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: '500', color: '#333' }}>{chatUser.username}</Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              {chatUser.language || chatUser.email}
            </Typography>
          </Box>
        </Box>
      )}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 3, 
          backgroundColor: '#f0f4f8',
          // Custom scrollbar hiding
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': {
            display: 'none'  // WebKit browsers (Chrome, Safari, Edge)
          }
        }}
      >
        {messages.map((msg, index) => (
          <Grid
            container
            spacing={2}
            key={index}
            justifyContent={msg.senderId === currentUser.uid ? 'flex-end' : 'flex-start'} // Align right or left
            sx={{ mb: 2 }}
          >
            {msg.senderId !== currentUser.uid && (
              <Grid item>
                <Avatar src={chatUser.profileImageUrl} />
              </Grid>
            )}
            <Grid item xs={8} md={6} lg={5}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: msg.senderId === currentUser.uid ? '#007aff' : '#e5e7eb',
                  color: msg.senderId === currentUser.uid ? '#fff' : '#333',
                  borderRadius: '16px',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  wordWrap: 'break-word',
                  maxWidth: '100%', // Ensures message stays within bounds
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: msg.senderId === currentUser.uid ? 'auto' : 10,
                    right: msg.senderId === currentUser.uid ? 10 : 'auto',
                    width: 0,
                    height: 0,
                    borderTop: '8px solid',
                    borderTopColor: msg.senderId === currentUser.uid ? '#007aff' : '#e5e7eb',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent'
                  }
                }}
              >
                {/* Display messageOG */}
                <Typography variant="body1">{msg.messageOG}</Typography>
                <Typography variant="caption" sx={{ position: 'absolute', right: 10, bottom: 5, color: '#bbb' }}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Sending...'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        ))}

        {/* Dummy div to always scroll to */}
        <div ref={messagesEndRef} />
      </Box>

      {/* Chatbox and Send Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e0e0e0',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)} // Update message input
          onKeyPress={handleKeyPress} // Handle Enter key
          sx={{
            borderRadius: 2,
            backgroundColor: '#f5f7fb',
            mr: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#ddd',
              },
              '&:hover fieldset': {
                borderColor: '#007aff',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#007aff',
              },
            },
          }}
        />
        <Button 
          variant="contained" 
          onClick={handleSendMessage}
          sx={{ 
            backgroundColor: '#007aff', 
            color: '#fff',
            px: 3, 
            py: 1, 
            borderRadius: 2, 
            '&:hover': { backgroundColor: '#005bb5' },
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatArea;
