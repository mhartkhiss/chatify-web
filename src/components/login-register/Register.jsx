import React, { useState } from "react";
import { TextField, Button, Container, Typography, Box, Link as MuiLink } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signOut } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "../../firebaseConfig";
import PageTransition from "../PageTransition";
import AuthBackground from "../AuthBackground";

const Register = () => {
  console.log("Register component rendered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const navigate = useNavigate();

  // Function to handle registration
  const handleRegister = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    // Check if email is already in use
    setIsCheckingEmail(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      setIsCheckingEmail(false);

      if (methods.length > 0) {
        // If methods exist, the email is already in use
        setEmailError("Email is already in use.");
      } else {
        // Proceed with registration if the email is available
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Get the current date and time in the desired format
          const currentDate = new Date();
          const formattedDate = currentDate.toISOString();

          // Prepare user data to save in the database
          const userData = {
            userId: user.uid,
            email: email,
            username: email,
            profileImageUrl: "none",
            accountType: "free",
            language: null,
            createdAt: formattedDate,
            lastLoginDate: formattedDate,
            translator: "google",
          };

          // Save user data to Firebase Database
          const userRef = ref(database, `users/${user.uid}`);
          await set(userRef, userData);

          // Sign out the user immediately after registration
          await signOut(auth);

          // Set registration success flag in sessionStorage
          sessionStorage.setItem("registered", "true");

          // Redirect to login page
          navigate("/login");
        } catch (registrationError) {
          // Handle Firebase auth-specific errors
          if (registrationError.code === "auth/email-already-in-use") {
            setEmailError("Email is already in use.");
          } else if (registrationError.code === "auth/invalid-email") {
            setEmailError("Invalid email address.");
          } else {
            setPasswordError(registrationError.message);
          }
        }
      }
    } catch (error) {
      setIsCheckingEmail(false);
      setEmailError("Error checking email availability.");
    }
  };

  return (
    <AuthBackground label="Sign up"> 
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
            onSubmit={handleRegister}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >

            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={Boolean(emailError)}
              helperText={emailError || ""}
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
              error={Boolean(passwordError)}
              helperText={passwordError || ""}
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
              label="Confirm Password"
              type="password"
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(confirmPasswordError)}
              helperText={confirmPasswordError || ""}
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
              disabled={isCheckingEmail}
              sx={{
                py: 1.5,
                backgroundColor: "#7E5A9B",
                color: "white",
                "&:hover": { backgroundColor: "#9D7BB0" },
              }}
            >
              {isCheckingEmail ? "Signing up..." : "Sign up"} 
            </Button>

            <Button
              component={RouterLink}
              to="/login"
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
          
        </PageTransition>
      </Container>
    </AuthBackground>
  );
};

export default Register;