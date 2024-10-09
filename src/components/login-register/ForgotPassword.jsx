import React, { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth"; // Firebase function for password reset
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";
import { auth } from "../../firebaseConfig";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval;
    if (isButtonDisabled && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsButtonDisabled(false);
      setTimer(60);
    }
    return () => clearInterval(interval);
  }, [isButtonDisabled, timer]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("If an account exists for this email, a password reset link will be sent shortly.");
      setError("");
      setIsButtonDisabled(true);
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#F9F3D7", // Pale Yellow background
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
          <Typography variant="h4" textAlign="center" gutterBottom color="#7E5A9B">
            Forgot Password
          </Typography>
          {message && <Alert severity="info">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{
              boxShadow: 1,
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#9D7BB0',
                },
                '&:hover fieldset': {
                  borderColor: '#7E5A9B',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#7E5A9B',
                },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isButtonDisabled}
            sx={{
              py: 1.5,
              backgroundColor: "#7E5A9B",
              color: "white",
              "&:hover": { backgroundColor: "#9D7BB0" },
              "&:disabled": { backgroundColor: "#9D7BB0", color: "white" },
            }}
          >
            {isButtonDisabled ? `Resend in ${timer}s` : "Send Password Reset Email"}
          </Button>
          <Button
            href="/login"
            variant="outlined"
            fullWidth
            size="large"
            sx={{
              py: 1.5,
              borderColor: "#9D7BB0",
              color: "#7E5A9B",
              "&:hover": { backgroundColor: "#E0B1CB", borderColor: "#7E5A9B" },
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
