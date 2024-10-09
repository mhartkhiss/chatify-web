import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Avatar, Grid, TextField, Button, Menu, MenuItem, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { getDatabase, ref, onValue, push, set, serverTimestamp, off } from "firebase/database";

const ChatArea = ({ currentUser, chatUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (chatUser) {
      const db = getDatabase();
      const chatId = [currentUser.uid, chatUser.userId].sort().join('_');
      const messagesRef = ref(db, `messages/${chatId}`);

      const unsubscribe = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        setMessages(data ? Object.values(data) : []);
      });

      return () => off(messagesRef);
    }
  }, [currentUser, chatUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() === '') return;

    const db = getDatabase();
    const chatId = [currentUser.uid, chatUser.userId].sort().join('_');
    const messagesRef = ref(db, `messages/${chatId}`);
    const newMessageRef = push(messagesRef);

    const messageData = {
      messageId: newMessageRef.key,
      messageOG: newMessage,
      message: newMessage,
      senderId: currentUser.uid,
      timestamp: serverTimestamp()
    };

    set(newMessageRef, messageData);
    setNewMessage('');
  }, [newMessage, currentUser.uid, chatUser.userId]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();

    const isToday = messageDate.toDateString() === now.toDateString();
    const isYesterday = messageDate.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();

    const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) {
      return `Today ${timeString}`;
    } else if (isYesterday) {
      return `Yesterday ${timeString}`;
    } else {
      const dateString = messageDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return `(${dateString}) ${timeString}`;
    }
  };

  const handleMessageClick = (event, message) => {
    if (message.senderId !== currentUser.uid) {
      setAnchorEl(event.currentTarget);
      setSelectedMessageId(message.messageId);
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMessageId(null);
  };

  const handleMenuOption = (option) => {
    if (option === 'regenerate') {
      console.log("Regenerate Translation for:", selectedMessageId);
    } else if (option === 'showOriginal') {
      console.log("Show Original Message for:", selectedMessageId);
    }
    handleCloseMenu();
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
            borderRadius: '0 0 8px 8px'
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
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }}
      >
        {messages.map((msg, index) => {
  const showAvatar = index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId;
  const isLastMessageFromContact = (index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId) && msg.senderId !== currentUser.uid;
  const isLastMessageFromCurrentUser = (index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId) && msg.senderId === currentUser.uid;

  return (
    <Grid
      container
      spacing={2}
      key={index}
      justifyContent={msg.senderId === currentUser.uid ? 'flex-end' : 'flex-start'}
      sx={{ mb: 2 }}
      onClick={(e) => handleMessageClick(e, msg)}
    >
      {msg.senderId !== currentUser.uid && showAvatar && (
        <Grid item>
          <Avatar 
            src={chatUser.profileImageUrl} 
            sx={{ alignSelf: 'flex-end' }}
          />
        </Grid>
      )}
      <Grid item xs={8} md={6} lg={5}>
        <Box
          sx={{
            p: 2,
            backgroundColor: msg.messageId === selectedMessageId ? '#d1c4e9' : msg.senderId === currentUser.uid ? '#AD49E1' : '#E5D9F2',
            color: msg.senderId === currentUser.uid ? '#fff' : '#333',
            borderRadius: '16px',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            wordWrap: 'break-word',
            maxWidth: '100%',
            '&:before': (msg.senderId === currentUser.uid && isLastMessageFromCurrentUser) || (msg.senderId !== currentUser.uid && !isLastMessageFromContact) ? {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: msg.senderId === currentUser.uid ? 'auto' : 10,
              right: msg.senderId === currentUser.uid ? 10 : 'auto',
              width: 0,
              height: 0,
              borderTop: '9px solid',
              borderTopColor: msg.senderId === currentUser.uid ? '#AD49E1' : '#E5D9F2',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
            } : undefined,
          }}
        >
          <Typography variant="body1">{msg.messageOG}</Typography>
          <Typography variant="caption" sx={{ position: 'absolute', right: 10, bottom: 5, color: '#bbb' }}>
            {msg.timestamp ? formatTimestamp(msg.timestamp) : 'Sending...'}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
})}


        <div ref={messagesEndRef} />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#CDC1FF',
            borderRadius: 2,
            boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.2)',
            minWidth: 180,
            border: '1px solid #ddd',
          },
        }}
      >
        <MenuItem
          onClick={() => handleMenuOption('regenerate')}
          sx={{
            fontSize: '14px',
            padding: '8px 16px',
            '&:hover': {
              backgroundColor: '#FFE1FF',
            },
          }}
        >
          Regenerate Translation
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuOption('showOriginal')}
          sx={{
            fontSize: '14px',
            padding: '8px 16px',
            '&:hover': {
              backgroundColor: '#FFE1FF',
            },
          }}
        >
          Show Original Message
        </MenuItem>
      </Menu>

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
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
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
        <IconButton 
          color="primary" 
          onClick={handleSendMessage}
          sx={{ 
            backgroundColor: '#8967B3', 
            color: '#fff',
            '&:hover': { backgroundColor: '#7A1CAC' },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default React.memo(ChatArea);
