import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, Grid, TextField, Button } from '@mui/material';
import { getDatabase, ref, onValue, push, set, serverTimestamp } from "firebase/database"; // Firebase imports

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
      onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messageList = Object.values(data); // Get all messages
          setMessages(messageList);
        } else {
          setMessages([]); // No messages found
        }
      });
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
    <Box sx={{ height: '100vh', p: 3, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {chatUser && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar src={chatUser.profileImageUrl} sx={{ mr: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">{chatUser.username}</Typography>
          <Typography variant="h8" sx={{ color: 'gray' }}>
            {chatUser.language}
          </Typography>
        </Box>
        </Box>
      )}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
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
                  backgroundColor: msg.senderId === currentUser.uid ? '#7953d2' : '#eee',
                  color: msg.senderId === currentUser.uid ? '#fff' : '#000',
                  borderRadius: '12px',
                  position: 'relative',
                  wordWrap: 'break-word',
                }}
              >
                {/* Display messageOG */}
                <Typography>{msg.messageOG}</Typography>
                <Typography variant="caption" sx={{ position: 'absolute', right: 10, bottom: 5 }}>
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
          mt: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderTop: '1px solid #ddd', // Optional styling
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)} // Update message input
          onKeyPress={handleKeyPress} // Handle Enter key
          sx={{ mr: 2 }}
        />
        <Button variant="contained" onClick={handleSendMessage}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatArea;
