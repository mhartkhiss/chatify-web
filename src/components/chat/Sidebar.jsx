import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemText, Avatar, ListItemAvatar, Typography, Badge, Button, ButtonGroup } from '@mui/material';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import SearchBar from './SearchBar';
import UserProfile from './UserProfile';

const Sidebar = ({ currentUser, selectChatUser, handleLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userConversations, setUserConversations] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [lastMessages, setLastMessages] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null); // Track the selected user
  const [filter, setFilter] = useState('recent'); // Filter: 'recent' or 'all'

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const messagesRef = ref(db, 'messages');

    onValue(usersRef, (snapshot) => {
      const allUsers = snapshot.val() ? Object.values(snapshot.val()) : [];
      const otherUsers = allUsers.filter(user => user.userId !== currentUser.uid);
      setUsers(otherUsers);
    });

    onValue(messagesRef, (snapshot) => {
      const conversations = snapshot.val();
      const userConvo = {};
      const unreadMsg = {};

      if (conversations) {
        Object.keys(conversations).forEach(chatId => {
          const participants = chatId.split('_');
          if (participants.includes(currentUser.uid)) {
            const otherUserId = participants.find(uid => uid !== currentUser.uid);

            const messages = Object.values(conversations[chatId]);
            const latestMessage = messages.reduce((latest, current) => {
              return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
            });

            const unreadCount = messages.filter(msg => msg.senderId !== currentUser.uid && !msg.read).length;
            const hasUnread = unreadCount > 0;

            userConvo[otherUserId] = {
              hasConversation: true,
              latestMessageTimestamp: latestMessage.timestamp,
            };

            unreadMsg[otherUserId] = {
              hasUnread,
              unreadCount,
            };

            setLastMessages((prevLastMessages) => ({
              ...prevLastMessages,
              [otherUserId]: latestMessage.message || '',
            }));
          }
        });
      }

      setUserConversations(userConvo);
      setUnreadMessages(unreadMsg);
    });
  }, [currentUser]);

  const sortUsersByLatestMessage = (userList) => {
    return userList.sort((a, b) => {
      const timestampA = userConversations[a.userId]?.latestMessageTimestamp || 0;
      const timestampB = userConversations[b.userId]?.latestMessageTimestamp || 0;
      return new Date(timestampB) - new Date(timestampA);
    });
  };

  useEffect(() => {
    let usersToDisplay = [];

    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      usersToDisplay = users.filter(user =>
        user.username.toLowerCase().includes(lowerCaseQuery) ||
        user.email.toLowerCase().includes(lowerCaseQuery)
      );
    } else if (filter === 'recent') {
      usersToDisplay = users.filter(user => userConversations[user.userId]?.hasConversation);
    } else if (filter === 'all') {
      usersToDisplay = users;
    }

    const sortedUsers = sortUsersByLatestMessage(usersToDisplay);
    setFilteredUsers(sortedUsers);
  }, [searchQuery, users, userConversations, filter]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const markMessagesAsRead = (userId) => {
    const db = getDatabase();
    const chatId = currentUser.uid < userId ? `${currentUser.uid}_${userId}` : `${userId}_${currentUser.uid}`;
    const messagesRef = ref(db, `messages/${chatId}`);

    onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val();
      if (messages) {
        Object.keys(messages).forEach((messageKey) => {
          if (messages[messageKey].senderId !== currentUser.uid && !messages[messageKey].read) {
            update(ref(db, `messages/${chatId}/${messageKey}`), { read: true });
          }
        });
      }
    });
  };

  const handleUserSelect = (user) => {
    setSelectedUserId(user.userId); // Set the selected user
    markMessagesAsRead(user.userId); // Mark all messages as read when user selects a conversation
    selectChatUser(user); // Proceed with opening the conversation
  };

  const truncateMessage = (message, maxLength = 30) => {
    if (message.length > maxLength) {
      return message.substring(0, maxLength) + '...';
    }
    return message;
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f7f9fc',
        borderRight: '1px solid #ddd',
        position: 'relative',
      }}
    >
      {/* Search Bar */} 
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: '#f7f9fc',
          p: 2,
          borderBottom: '1px solid #ddd',
        }}
      >
        <SearchBar onSearch={handleSearch} />
        {/* Filter buttons */}
        <ButtonGroup fullWidth size="small" sx={{ mt: 1 }}>
          <Button
            variant={filter === 'recent' ? 'contained' : 'outlined'}
            onClick={() => setFilter('recent')}
            sx={{
              backgroundColor: filter === 'recent' ? '#AD49E1' : '#E5D9F2',
              color: '#fff',
              border: 'none', // Remove border
              '&:hover': {
                backgroundColor: '#9600ce',
              },
            }}
          >
            Recent
          </Button>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            sx={{
              backgroundColor: filter === 'all' ? '#AD49E1' : '#E5D9F2',
              color: '#fff',
              border: 'none', // Remove border
              '&:hover': {
                backgroundColor: '#9600ce',
              },
            }}
          >
            Show All Users
          </Button>
        </ButtonGroup>
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
            <ListItem
              key={user.userId}
              button
              onClick={() => handleUserSelect(user)}
              sx={{
                backgroundColor: user.userId === selectedUserId ? '#E5D9F2' : 'transparent', borderRadius: '5px', // Highlight selected user
                '&:hover': {
                  backgroundColor: user.userId === selectedUserId ? '#E5D9F2' : '#f0f0f0',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar src={user.profileImageUrl} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: unreadMessages[user.userId]?.hasUnread ? 'bold' : 'normal' }}>
                    {user.username}
                  </Typography>
                }
                secondary={lastMessages[user.userId] ? truncateMessage(lastMessages[user.userId]) : user.email}
              />
              {unreadMessages[user.userId]?.unreadCount > 0 && (
                <Badge
                  badgeContent={unreadMessages[user.userId].unreadCount}
                  color="primary"
                  sx={{ ml: 2 }}
                />
              )}
            </ListItem>
          ))}
        </List>
      </Box>

      {/* UserProfile component at the bottom */}
      <Box
        sx={{
          position: 'sticky',
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
