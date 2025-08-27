import React, { useState } from "react";
import { TextField, Button, Link, Box } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig.js";
import { useNavigate, Link as RouterLink } from "react-router-dom";

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful');
      navigate('/home');
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        alert('Please enter a valid email address.'); 
      } else {
        alert('Wrong email or password');
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <TextField 
          label="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          fullWidth
        />

        <br/><br/>

        <TextField
          label="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />

        <br/><br/>

        <Box mt={2} mb={2}>
          <Link 
            component={RouterLink}
            to="/signup"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Don't have an account? Sign up!
          </Link>
        </Box>

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Login
        </Button>
      </form>
    </div>
  );
}