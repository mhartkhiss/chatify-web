import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, IconButton, Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { auth, database, storage } from '../../firebaseConfig'; // Firebase imports
import { ref, onValue, update } from 'firebase/database'; // Firebase Realtime Database functions
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage functions
import Cropper from 'react-easy-crop'; // Image Cropper
import { getCroppedImg } from './cropImage'; // Import named export

const UserProfile = ({ currentUser }) => {
  const [userData, setUserData] = useState({
    profileImageUrl: '/default-avatar.png',
    username: 'Anonymous User',
    language: '',
  });
  const [avatarFile, setAvatarFile] = useState(null); // State for selected avatar file
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [openCropDialog, setOpenCropDialog] = useState(false);

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

  // Upload the cropped image to Firebase
  const uploadAvatar = async (croppedImage) => {
    const storagePath = `avatars/${currentUser.uid}/${avatarFile.name}`;
    const avatarStorageRef = storageRef(storage, storagePath);

    try {
      await uploadBytes(avatarStorageRef, croppedImage);
      const downloadURL = await getDownloadURL(avatarStorageRef);
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, { profileImageUrl: downloadURL });

      setUserData((prevData) => ({
        ...prevData,
        profileImageUrl: downloadURL,
      }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        </Box>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: '500' }}>
            {userData.username}
          </Typography>
          <Typography variant="caption" sx={{ color: '#b9bbbe' }}>
            {userData.language || currentUser.email}
          </Typography>
        </Box>
      </Box>

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
            Upload
          </Button>
        </DialogActions>
      </Dialog>

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
