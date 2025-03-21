import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { RootState } from '../../store/store';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/slices/authSlice';
import { login, getCurrentUser } from '../../services/authService';
import styles from './Auth.module.css';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
    
    // Clear any previous errors
    dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      dispatch(loginStart());
      
      console.log('Login form submitted with:', { email: formData.email });
      
      // Call login API
      const tokenData = await login({
        username: formData.email, // API expects username field for email
        password: formData.password,
      });
      
      console.log('Login successful, token received');
      
      try {
        // Get user data
        const userData = await getCurrentUser();
        
        dispatch(loginSuccess({ 
          token: tokenData.access_token,
          user: userData
        }));
        
        navigate('/');
      } catch (userError) {
        console.error('Error fetching user data after login:', userError);
        // Still consider login successful even if we couldn't fetch user data
        dispatch(loginSuccess({ 
          token: tokenData.access_token,
          user: null
        }));
        
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch(loginFailure(error instanceof Error ? error.message : 'Login failed'));
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} className={styles.authForm}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
          
          <Box textAlign="center">
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link to="/register" className={styles.authLink}>
                Register
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 