import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signOut } from "firebase/auth"; // Import signOut
import { ref, set } from "firebase/database"; // Firebase database imports
import { auth, database } from "../../firebaseConfig"; // Include database
import { Button, TextField, Container, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { green, red } from '@mui/material/colors';

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [emailStatus, setEmailStatus] = useState(""); // For "Available" or "In Use" status
  const [isCheckingEmail, setIsCheckingEmail] = useState(false); // To show loading state
  const navigate = useNavigate();

  // Function to format the date to "YYYY-MM-DD HH:MM:SS"
  const formatDate = (date) => {
    const pad = (num) => (num < 10 ? '0' + num : num); // Pad single digits with leading zero
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Debounce mechanism to delay the email validation
  useEffect(() => {
    if (email && /\S+@\S+\.\S+/.test(email)) {
      const delayDebounceFn = setTimeout(() => {
        checkEmailAvailability(); // Call email availability check if email is valid
      }, 500);

      return () => clearTimeout(delayDebounceFn); // Cleanup timeout on each re-render
    } else {
      // Reset the status and error if email format is invalid
      setEmailStatus("");
      setEmailError("Please enter a valid email.");
    }
  }, [email]);

  // Function to check if the email is already in use
  const checkEmailAvailability = async () => {
    setIsCheckingEmail(true);
    setEmailStatus(""); // Reset email status

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        // If methods array is not empty, email already has an account
        setEmailError("Email is already in use.");
        setEmailStatus("In Use");
      } else {
        setEmailError(""); // Clear any previous error
        setEmailStatus("Available"); // Mark as available
      }
    } catch (err) {
      setEmailError("Invalid email format."); // Set error if Firebase fails
    }

    setIsCheckingEmail(false); // Stop showing the loading state
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Reset previous error messages
    setPasswordError("");
    setConfirmPasswordError("");

    let valid = true;

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }

    if (!valid || emailStatus !== "Available") return; // Prevent submission if not valid or email is in use

    // Proceed with Firebase registration if all validations are passed
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get the current date and time, formatted as a string
      const currentDate = new Date();
      const formattedDate = formatDate(currentDate); // Format current date

      // Prepare default user data like in your Android app
      const userData = {
        userId: user.uid,
        email: email,
        username: email, // You may add username field to the form if needed
        profileImageUrl: "none", // Default profile image
        accountType: "free", // Default account type
        language: null, // Default language is null
        createdAt: formattedDate, // Formatted createdAt date
        lastLoginDate: formattedDate, // Formatted last login date
        translator: "google" // Default translator
      };

      // Store user data in Firebase Realtime Database
      await set(ref(database, 'users/' + user.uid), userData);

      console.log("User registered successfully");

      // Sign the user out after registration
      await signOut(auth);

      // Store a flag in sessionStorage indicating successful registration
      sessionStorage.setItem("registered", "true");

      // Redirect to login page
      navigate("/login");
    } catch (err) {
      setEmailError(err.message); // Handle Firebase error
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleRegister}
        sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="h4" gutterBottom>
          Register
        </Typography>
        {/* Email Field with real-time availability check */}
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(emailError)} // Highlight field in red if error exists
          helperText={
            isCheckingEmail
              ? "Checking..."
              : emailError || (emailStatus === "Available" && (
                <span style={{ color: green[500] }}>Available</span>
              )) || (emailStatus === "In Use" && (
                <span style={{ color: red[500] }}>In Use</span>
              ))
          }
          required
        />
        {/* Password Field */}
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(passwordError)}
          helperText={passwordError}
          required
        />
        {/* Confirm Password Field */}
        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={Boolean(confirmPasswordError)}
          helperText={confirmPasswordError}
          required
        />
        <Button type="submit" variant="contained" fullWidth>
          Register
        </Button>
        <Button href="/login" variant="outlined" fullWidth>
          Login
        </Button>
      </Box>
    </Container>
  );
};

export default Register;
