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
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ece9e6 0%, #ffffff 100%)",
      }}
    >
      <Container
        maxWidth="xs"
        sx={{
          p: 4,
          boxShadow: 3,
          backgroundColor: "#fff",
          borderRadius: 2,
        }}
      >
        <Box
          component="form"
          onSubmit={handlePasswordReset}
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <Typography variant="h4" textAlign="center" gutterBottom>
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
            sx={{ boxShadow: 1, borderRadius: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{
              py: 1.5,
              background: "linear-gradient(90deg, #4a90e2, #007aff)",
              color: "white",
              "&:hover": { backgroundColor: "#007aff" },
            }}
          >
            Send Password Reset Email
          </Button>
          <Button
            href="/login"
            variant="outlined"
            fullWidth
            size="large"
            sx={{
              py: 1.5,
              borderColor: "#007aff",
              color: "#007aff",
              "&:hover": { backgroundColor: "#e3f2fd", borderColor: "#007aff" },
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
