import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Avatar, Grid, TextField, Button, Menu, MenuItem, IconButton, Snackbar, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { getDatabase, ref, onValue, push, set, serverTimestamp, off, update, get } from "firebase/database";
import { translateToLanguage } from '../../services/geminiTranslator';
import TranslationAnimation from './TranslationAnimation';
import UserInfoModal from './UserInfoModal';

const ChatArea = ({ currentUser, chatUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showOriginalFor, setShowOriginalFor] = useState(null);
  const [contactLanguage, setContactLanguage] = useState(chatUser.language);
  const [showLanguageNotification, setShowLanguageNotification] = useState(false);
  const [chatUserStatus, setChatUserStatus] = useState('offline');
  const messagesEndRef = useRef(null);
  const previousChatUserRef = useRef(chatUser);
  const [isSending, setIsSending] = useState(false);
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const [currentVariation, setCurrentVariation] = useState({});
  const [regeneratingTranslation, setRegeneratingTranslation] = useState(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [shouldScrollToBottom]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].senderId === currentUser.uid) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, currentUser.uid]);

  useEffect(() => {
    if (chatUser) {
      const db = getDatabase();
      const chatId = [currentUser.uid, chatUser.userId].sort().join('_');
      const messagesRef = ref(db, `messages/${chatId}`);
      const userLanguageRef = ref(db, `users/${chatUser.userId}/language`);
      const userStatusRef = ref(db, `status/${chatUser.userId}`);

      const messageUnsubscribe = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        setMessages(data ? Object.values(data) : []);
      });

      const languageUnsubscribe = onValue(userLanguageRef, (snapshot) => {
        const newLanguage = snapshot.val();
        if (newLanguage && newLanguage !== contactLanguage) {
          setContactLanguage(newLanguage);
          if (previousChatUserRef.current.userId === chatUser.userId) {
            setShowLanguageNotification(true);
          }
        }
      });

      const statusUnsubscribe = onValue(userStatusRef, (snapshot) => {
        const status = snapshot.val();
        setChatUserStatus(status || 'offline');
      });

      return () => {
        off(messagesRef);
        off(userLanguageRef);
        off(userStatusRef);
      };
    }
  }, [currentUser, chatUser, contactLanguage]);

  useEffect(() => {
    setContactLanguage(chatUser.language);
    previousChatUserRef.current = chatUser;
  }, [chatUser]);

  const handleSendMessage = useCallback(async () => {
    if (newMessage.trim() === '' || isSending) return;

    setShouldScrollToBottom(true);
    setIsSending(true);
    const messageToSend = newMessage;
    setNewMessage('');

    const db = getDatabase();
    const chatId = [currentUser.uid, chatUser.userId].sort().join('_');
    const messagesRef = ref(db, `messages/${chatId}`);
    const newMessageRef = push(messagesRef);

    const messageData = {
      messageId: newMessageRef.key,
      messageOG: messageToSend,
      message: "Translating...",
      senderId: currentUser.uid,
      timestamp: serverTimestamp()
    };

    try {
      await set(newMessageRef, messageData);
      const translatedMessage = await translateToLanguage(messageToSend, contactLanguage);
      
      // Parse the translated message to extract the three variations
      const variations = translatedMessage.split('\n').filter(line => line.trim() !== '');
      const messageVar1 = variations[0]?.replace(/^\d+\.\s*/, '') || messageToSend;
      const messageVar2 = variations[1]?.replace(/^\d+\.\s*/, '') || '';
      const messageVar3 = variations[2]?.replace(/^\d+\.\s*/, '') || '';

      await set(newMessageRef, {
        ...messageData,
        message: messageVar1,
        messageVar1: messageVar1,
        messageVar2: messageVar2,
        messageVar3: messageVar3,
      });
    } catch (error) {
      console.error('Translation error:', error);
      await set(newMessageRef, {
        ...messageData,
        message: messageToSend,
      });
    } finally {
      setIsSending(false);
    }
  }, [newMessage, currentUser.uid, chatUser.userId, contactLanguage, isSending]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

  const handleMenuOption = async (option, messageId) => {
    if (option === 'regenerate') {
      setShouldScrollToBottom(false);
      setRegeneratingTranslation(messageId);
      const db = getDatabase();
      const chatId = [currentUser.uid, chatUser.userId].sort().join('_');
      const messageRef = ref(db, `messages/${chatId}/${messageId}`);

      const snapshot = await get(messageRef);
      const messageData = snapshot.val();

      if (messageData) {
        let nextVar = 'messageVar1';
        if (messageData.message === messageData.messageVar1) nextVar = 'messageVar2';
        else if (messageData.message === messageData.messageVar2) nextVar = 'messageVar3';
        else if (messageData.message === messageData.messageVar3) nextVar = 'messageVar1';

        await update(messageRef, { message: messageData[nextVar] });
        setCurrentVariation(prev => ({...prev, [messageId]: nextVar}));
        
        // Set a timeout to remove the regenerating state after 1 second
        setTimeout(() => {
          setRegeneratingTranslation(null);
          // Remove this line to prevent scrolling after regeneration
          // setShouldScrollToBottom(true);
        }, 1000);
      }
    } else if (option === 'toggleOriginal') {
      setShowOriginalFor(prev => prev === messageId ? null : messageId);
    }
    handleCloseMenu();
  };

  const handleUserInfoClick = () => {
    setIsUserInfoModalOpen(true);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f7fb' }}>
      {chatUser && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2, 
            backgroundColor: '#ffffff', 
            borderBottom: '1px solid #e0e0e0', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '0 0 8px 8px'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleUserInfoClick}>
            <Box sx={{ position: 'relative', mr: 2 }}>
              <Avatar 
                src={chatUser.profileImageUrl} 
                sx={{ width: 48, height: 48 }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  backgroundColor: chatUserStatus === 'online' ? '#66BB6A' : '#747f8d',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: '500', color: '#333' }}>{chatUser.username}</Typography>
              <Typography variant="body2" sx={{ color: '#888' }}>
                {chatUserStatus.charAt(0).toUpperCase() + chatUserStatus.slice(1)}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose}
            sx={{ 
              color: '#888',
              '&:hover': { color: '#333' },
            }}
          >
            <CloseIcon />
          </IconButton>
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
          const isCurrentUserMessage = msg.senderId === currentUser.uid;
          const messageToDisplay = isCurrentUserMessage ? msg.messageOG : (msg.message || msg.messageOG);
          const isTranslating = !isCurrentUserMessage && msg.message === "Translating...";

          return (
            <Grid
              container
              spacing={2}
              key={index}
              justifyContent={isCurrentUserMessage ? 'flex-end' : 'flex-start'}
              sx={{ mb: 2 }}
              onClick={(e) => handleMessageClick(e, msg)}
            >
              {!isCurrentUserMessage && showAvatar && (
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
                    backgroundColor: msg.messageId === selectedMessageId ? '#d1c4e9' : isCurrentUserMessage ? '#AD49E1' : '#E5D9F2',
                    color: isCurrentUserMessage ? '#fff' : '#333',
                    borderRadius: '16px',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                    '&:before': (isCurrentUserMessage && isLastMessageFromCurrentUser) || (!isCurrentUserMessage && !isLastMessageFromContact) ? {
                      content: '""',
                      position: 'absolute',
                      bottom: -8,
                      left: isCurrentUserMessage ? 'auto' : 10,
                      right: isCurrentUserMessage ? 10 : 'auto',
                      width: 0,
                      height: 0,
                      borderTop: '9px solid',
                      borderTopColor: isCurrentUserMessage ? '#AD49E1' : '#E5D9F2',
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                    } : undefined,
                  }}
                >
                  {regeneratingTranslation === msg.messageId ? (
                    <TranslationAnimation />
                  ) : isTranslating ? (
                    <TranslationAnimation />
                  ) : (
                    <Typography variant="body1">{messageToDisplay}</Typography>
                  )}
                  {showOriginalFor === msg.messageId && !isCurrentUserMessage && msg.message !== msg.messageOG && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(0, 0, 0, 0.6)' }}>
                      {msg.messageOG}
                    </Typography>
                  )}
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
        {messages.find(msg => msg.messageId === selectedMessageId)?.messageVar2 && (
          <MenuItem
            onClick={() => handleMenuOption('regenerate', selectedMessageId)}
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
        )}
        <MenuItem
          onClick={() => handleMenuOption('toggleOriginal', selectedMessageId)}
          sx={{
            fontSize: '14px',
            padding: '8px 16px',
            '&:hover': {
              backgroundColor: '#FFE1FF',
            },
          }}
        >
          {showOriginalFor === selectedMessageId ? 'Hide Original Message' : 'Show Original Message'}
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
          disabled={isSending}
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
          disabled={isSending || newMessage.trim() === ''}
          sx={{ 
            backgroundColor: '#8967B3', 
            color: '#fff',
            '&:hover': { backgroundColor: '#7A1CAC' },
            '&.Mui-disabled': { backgroundColor: '#ccc' },
          }}
        >
          {isSending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={showLanguageNotification}
        autoHideDuration={3000}
        onClose={() => setShowLanguageNotification(false)}
        message={`${chatUser.username} has updated their language to ${contactLanguage}`}
      />

      <UserInfoModal
        user={chatUser}
        open={isUserInfoModalOpen}
        onClose={() => setIsUserInfoModalOpen(false)}
      />
    </Box>
  );
};

export default React.memo(ChatArea);