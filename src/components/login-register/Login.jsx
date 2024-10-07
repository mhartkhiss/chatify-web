import React, { useState, useEffect } from "react";
import { Button, TextField, Container, Typography, Box, Snackbar, Alert, Link } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebaseConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false); // For showing snackbar
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
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      localStorage.setItem('currentUser', JSON.stringify(user)); // Store user session
      navigate('/chat'); // Redirect to chat page
    } catch (err) {
      setError(err.message);
    }
  };

  // Redirect to the Forgot Password page
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleLogin}
        sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" fullWidth>
          Login
        </Button>
        <Button href="/register" variant="outlined" fullWidth>
          Register
        </Button>
        
        {/* Centered Forgot Password Link */}
        <Link
          component="button"
          variant="body2"
          onClick={handleForgotPassword}
          sx={{ textAlign: "center", mt: 2 }}
        >
          Forgot Password?
        </Link>
      </Box>

      {/* Snackbar for Registration Success */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000} // Show for 5 seconds
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Registration Success!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;
