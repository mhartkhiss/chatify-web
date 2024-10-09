import React, { useState, useEffect } from "react";
import { Button, TextField, Container, Typography, Box, Snackbar, Alert, Link as MuiLink } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { auth } from "../../firebaseConfig";
import PageTransition from "../PageTransition";
import AuthBackground from "../AuthBackground";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false); // For showing snackbar
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  // Check if registration success flag exists in sessionStorage
  useEffect(() => {
    const registered = sessionStorage.getItem("registered");
    if (registered) {
      setOpenSnackbar(true); // Show success snackbar
      sessionStorage.removeItem("registered"); // Remove flag so it doesn't persist
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      localStorage.setItem('currentUser', JSON.stringify(user)); // Store user session
      navigate('/chat'); // Redirect to chat page
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Redirect to the Forgot Password page
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <AuthBackground label="Login">
      <Container
        maxWidth="xs"
        sx={{
          pt: 4,  // Reduced top padding
          pb: 4,
          px: 4,
          boxShadow: 3,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderRadius: 2,
        }}
      >
        <PageTransition>
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            {error && <Typography color="error">{error}</Typography>}
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
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              disabled={isLoggingIn}
              sx={{
                py: 1.5,
                backgroundColor: "#7E5A9B",
                color: "white",
                "&:hover": { backgroundColor: "#9D7BB0" },
              }}
            >
              {isLoggingIn ? "Logging in..." : "Login"}
            </Button>
            <Button
              component={RouterLink}
              to="/register"
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
              Sign up
            </Button>

            <MuiLink
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              sx={{ textAlign: "center", mt: 2, color: "#7E5A9B" }}
            >
              Forgot Password?
            </MuiLink>
          </Box>
        </PageTransition>
      </Container>

      {/* Snackbar remains outside PageTransition */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000} // Show for 5 seconds
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Sign up successful! Please log in.  {/* Changed from "Registration successful!" */}
        </Alert>
      </Snackbar>
    </AuthBackground>
  );
};

export default Login;
