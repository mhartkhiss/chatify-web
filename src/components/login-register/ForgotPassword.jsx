import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth"; // Firebase function for password reset
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";
import { auth } from "../../firebaseConfig";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
      setError(""); // Clear any previous error
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handlePasswordReset}
        sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h4" gutterBottom>
          Forgot Password
        </Typography>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" fullWidth>
          Send Password Reset Email
        </Button>
        <Button href="/login" variant="outlined" fullWidth>
          Back to Login
        </Button>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
