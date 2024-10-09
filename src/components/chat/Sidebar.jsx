import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemText, Avatar, ListItemAvatar, Typography, Badge, Button, ButtonGroup, Divider } from '@mui/material';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import SearchBar from './SearchBar';
import UserProfile from './UserProfile';
import { MessageOutlined, PeopleOutline } from '@mui/icons-material';

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
        borderRight: '1px solid #e0e0e0',
        position: 'relative',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
        width: '350px', // Increased from 320px to 350px
        minWidth: '300px', // Increased from 280px to 300px
      }}
    >
      {/* Search Bar */} 
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: '#ffffff',
          p: 1, // Reduced padding
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <SearchBar onSearch={handleSearch} />
        {/* Filter buttons */}
        <ButtonGroup fullWidth size="small" sx={{ mt: 1 }}> {/* Reduced top margin */}
          <Button
            variant={filter === 'recent' ? 'contained' : 'outlined'}
            onClick={() => setFilter('recent')}
            startIcon={<MessageOutlined />}
            sx={{
              backgroundColor: filter === 'recent' ? '#AD49E1' : 'transparent',
              color: filter === 'recent' ? '#fff' : '#AD49E1',
              border: '1px solid #AD49E1',
              '&:hover': {
                backgroundColor: '#9600ce',
                color: '#fff',
              },
              fontSize: '0.8rem', // Smaller font size
              padding: '4px 8px', // Reduced padding
            }}
          >
            Recent
          </Button>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            startIcon={<PeopleOutline />}
            sx={{
              backgroundColor: filter === 'all' ? '#AD49E1' : 'transparent',
              color: filter === 'all' ? '#fff' : '#AD49E1',
              border: '1px solid #AD49E1',
              '&:hover': {
                backgroundColor: '#9600ce',
                color: '#fff',
              },
              fontSize: '0.8rem', // Smaller font size
              padding: '4px 8px', // Reduced padding
            }}
          >
            All Users
          </Button>
        </ButtonGroup>
      </Box>

      {/* Scrollable List of Users */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'hidden', // Hide horizontal scrollbar
          backgroundColor: '#ffffff',
        }}
      >
        {filteredUsers.length > 0 ? (
          <List>
            {filteredUsers.map((user, index) => (
              <React.Fragment key={user.userId}>
                <ListItem
                  button
                  onClick={() => handleUserSelect(user)}
                  sx={{
                    backgroundColor: user.userId === selectedUserId ? '#f0e6f7' : 'transparent',
                    borderRadius: '8px',
                    my: 0.5,
                    mx: 0.5, // Reduced horizontal margin
                    '&:hover': {
                      backgroundColor: user.userId === selectedUserId ? '#f0e6f7' : '#f5f5f5',
                    },
                    position: 'relative', // Add this to allow absolute positioning of the badge
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.profileImageUrl} sx={{ width: 40, height: 40 }} /> {/* Smaller avatar */}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ 
                        fontWeight: unreadMessages[user.userId]?.hasUnread ? 'bold' : 'normal',
                        fontSize: '0.9rem', // Smaller font size
                      }}>
                        {user.username}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}> {/* Smaller font size */}
                        {lastMessages[user.userId] ? truncateMessage(lastMessages[user.userId], 20) : user.email} {/* Shorter truncation */}
                      </Typography>
                    }
                  />
                  {unreadMessages[user.userId]?.unreadCount > 0 && (
                    <Badge
                      badgeContent={unreadMessages[user.userId].unreadCount}
                      color="primary"
                      sx={{
                        position: 'absolute',
                        right: 25, // Adjust this value to move the badge left or right
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  )}
                </ListItem>
                {index < filteredUsers.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {filter === 'recent' ? "You don't have any contacts." : "No users found."}
            </Typography>
            {filter === 'recent' && (
              <Typography variant="body2" color="text.secondary">
                Tip: Use the search box or click "All Users" to connect with people.
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* UserProfile component at the bottom */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 1,
          p: 1, // Reduced padding
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <UserProfile currentUser={currentUser} handleLogout={handleLogout} />
      </Box>
    </Box>
  );
};

export default Sidebar;