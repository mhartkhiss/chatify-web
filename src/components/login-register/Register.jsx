import React, { useState } from "react";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signOut } from "firebase/auth";
import { ref, set } from "firebase/database";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import { auth, database } from "../../firebaseConfig";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

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

          // Set registration success flag in sessionStorage
          sessionStorage.setItem("registered", "true");

          // Sign out the user after registration
          await signOut(auth);

          // Redirect to login page
          window.location.href = "/login";
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
          onSubmit={handleRegister}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Typography variant="h4" textAlign="center" gutterBottom>
            Register
          </Typography>

          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(emailError)}
            helperText={emailError || ""}
            required
            sx={{ boxShadow: 1, borderRadius: 1 }}
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
            sx={{ boxShadow: 1, borderRadius: 1 }}
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
            disabled={isCheckingEmail} // Disable button while checking email
          >
            {isCheckingEmail ? "Checking..." : "Register"}
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
            Login
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
