import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, IconButton, Button, Dialog, DialogActions, DialogContent, LinearProgress, TextField, Popover, List, ListItem, ListItemButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { auth, database, storage } from '../../firebaseConfig'; // Firebase imports
import { ref, onValue, update } from 'firebase/database'; // Firebase Realtime Database functions
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'; // Firebase Storage functions
import Cropper from 'react-easy-crop'; // Image Cropper
import { getCroppedImg } from './cropImage'; // Import named export

const UserProfile = ({ currentUser }) => {
  const [userData, setUserData] = useState({
    profileImageUrl: '/default-avatar.png',
    username: 'Anonymous User',
    language: '',
  });
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null); // State for selected avatar file
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [openCropDialog, setOpenCropDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Progress state
  const [uploading, setUploading] = useState(false); // Flag to check if the image is being uploaded
  const [oldAvatarUrl, setOldAvatarUrl] = useState(''); // Store the old avatar URL
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Anchor element for language popover

  useEffect(() => {
    const userRef = ref(database, `users/${currentUser.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserData({
          profileImageUrl: data.profileImageUrl || '/default-avatar.png',
          username: data.username || 'Anonymous User',
          language: data.language || '',
        });

        setOldAvatarUrl(data.profileImageUrl || ''); // Store the old avatar URL
      }
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  // Handle avatar selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setOpenCropDialog(true); // Open the crop dialog after selecting an image
    }
  };

  // Handle crop complete
  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Upload cropped image
  const handleCropUpload = async () => {
    const croppedImage = await getCroppedImg(avatarFile, croppedAreaPixels); // Crop the image
    uploadAvatar(croppedImage); // Upload the cropped image to Firebase
    setOpenCropDialog(false); // Close the dialog after cropping
  };

  // Upload the cropped image to Firebase with progress tracking
  const uploadAvatar = async (croppedImage) => {
    const storagePath = `avatars/${currentUser.uid}/${avatarFile.name}`;
    const avatarStorageRef = storageRef(storage, storagePath);

    setUploading(true); // Start uploading

    // Use uploadBytesResumable to track progress
    const uploadTask = uploadBytesResumable(avatarStorageRef, croppedImage);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Track progress (percentage)
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Error uploading avatar:', error);
        setUploading(false); // Stop uploading on error
      },
      async () => {
        // Handle successful upload and get download URL
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const userRef = ref(database, `users/${currentUser.uid}`);
        await update(userRef, { profileImageUrl: downloadURL });

        // Delete the old avatar after uploading the new one
        if (oldAvatarUrl && oldAvatarUrl !== '/default-avatar.png') {
          deleteOldAvatar(oldAvatarUrl);
        }

        setUserData((prevData) => ({
          ...prevData,
          profileImageUrl: downloadURL,
        }));

        setUploading(false); // Stop uploading on success
      }
    );
  };

  // Delete the old avatar from Firebase Storage
  const deleteOldAvatar = async (oldAvatarUrl) => {
    const oldAvatarRef = storageRef(storage, oldAvatarUrl); // Get the reference to the old avatar in storage
    try {
      await deleteObject(oldAvatarRef);
      console.log('Old avatar deleted successfully');
    } catch (error) {
      console.error('Error deleting old avatar:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUsernameDoubleClick = () => {
    setEditingUsername(true);
    setNewUsername(userData.username);
  };

  const handleUsernameChange = async () => {
    if (newUsername.trim() !== '') {
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, { username: newUsername });
      setUserData((prevData) => ({ ...prevData, username: newUsername }));
    }
    setEditingUsername(false);
  };

  const handleLanguageDoubleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageSelect = async (language) => {
    const userRef = ref(database, `users/${currentUser.uid}`);
    await update(userRef, { language });
    setUserData((prevData) => ({ ...prevData, language }));
    setAnchorEl(null);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 1.5,
      borderRadius: '5px',
      backgroundColor: '#7a49a5',
      color: '#fff',
      borderTop: '1px solid #23272A'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', mr: 2 }}>
          <input
            accept="image/*"
            type="file"
            id="avatar-upload"
            style={{ display: 'none' }}
            onChange={handleAvatarChange} // Handle the file selection
          />
          <label htmlFor="avatar-upload">
            <Avatar 
              src={userData.profileImageUrl}
              sx={{ width: 40, height: 40, cursor: 'pointer' }}
            />
          </label>
          {/* Online status indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              backgroundColor: '#43b581', // Green color for "online" status
              borderRadius: '50%',
              border: '2px solid #7a49a5', // Border matches background for a "cutout" effect
            }}
          />
        </Box>
        <Box>
          {editingUsername ? (
            <TextField
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onBlur={handleUsernameChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUsernameChange();
              }}
              size="small"
              autoFocus
              sx={{
                input: { color: '#fff' },
              }}
            />
          ) : (
            <Typography
              variant="body1"
              sx={{ fontWeight: '500', cursor: 'pointer' }}
              onClick={handleUsernameDoubleClick}
            >
              {userData.username}
            </Typography>
          )}
          <Typography
            variant="caption"
            sx={{ color: '#b9bbbe', cursor: 'pointer' }}
            onClick={handleLanguageDoubleClick}
          >
            {userData.language || currentUser.email}
          </Typography>
        </Box>
      </Box>

      {/* Language Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}><TextField placeholder='Search language...' variant='outlined' size='small' fullWidth sx={{ mb: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ccc', borderRadius: '4px' }}>
          {['English', 'Tagalog', 'Bisaya', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Russian', 'Italian', 'Portuguese', 'Hindi', 'Arabic', 'Korean', 'Dutch', 'Swedish', 'Greek', 'Turkish', 'Hebrew', 'Vietnamese', 'Thai', 'Indonesian', 'Danish', 'Finnish', 'Polish', 'Norwegian', 'Czech', 'Hungarian', 'Ukrainian', 'Malay', 'Romanian'].filter((language) => language.toLowerCase().includes(searchTerm.toLowerCase())).map((language) => (
            <ListItem key={language} disablePadding>
              <ListItemButton onClick={() => handleLanguageSelect(language)}>
                {language}
              </ListItemButton>
            </ListItem>
          ))}
        </List></Box>
      </Popover>

      {/* Crop Dialog */}
      <Dialog
        open={openCropDialog}
        onClose={() => setOpenCropDialog(false)}
        maxWidth="md" // Set a larger width for the dialog
        fullWidth={true} // Make it use the full available width
      >
        <DialogContent
          sx={{
            position: 'relative',
            width: '100%',
            height: '400px', // Adjust height for larger crop area
            backgroundColor: '#333', // Dark background for contrast
          }}
        >
          <Cropper
            image={avatarFile ? URL.createObjectURL(avatarFile) : null}
            crop={crop}
            zoom={zoom}
            aspect={1} // 1:1 aspect ratio for avatar
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCropDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleCropUpload} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Bar for uploading */}
      {uploading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" sx={{ color: '#b9bbbe' }}>
            Uploading: {Math.round(uploadProgress)}%
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton sx={{ color: '#b9bbbe' }} onClick={handleLogout}>
          <LogoutIcon />
        </IconButton>
        <IconButton sx={{ color: '#b9bbbe' }}>
          <SettingsIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default UserProfile;