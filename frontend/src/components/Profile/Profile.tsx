import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { RootState } from '../../store/store';
import { getCurrentUser } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';
import { updateUserAddress } from '../../services/userService';
import styles from './Profile.module.css';

interface AddressForm {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  landmark: string;
}

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    landmark: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated) {
        try {
          setLoading(true);
          const userData = await getCurrentUser();
          dispatch(setUser(userData));
          
          // Initialize form with user's address if available
          if (userData.address) {
            setAddressForm({
              street: userData.address.street || '',
              city: userData.address.city || '',
              state: userData.address.state || '',
              zipCode: userData.address.zipCode || '',
              phone: userData.address.phone || '',
              landmark: userData.address.landmark || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load user profile. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [dispatch, isAuthenticated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Call API to update user address
      await updateUserAddress(addressForm);
      
      // Show success message
      setSuccess('Address updated successfully!');
      
      // Refresh user data
      const userData = await getCurrentUser();
      dispatch(setUser(userData));
    } catch (error) {
      console.error('Error updating address:', error);
      setError('Failed to update address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
  };

  if (loading && !user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Please log in to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} className={styles.profilePaper}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Profile
        </Typography>
        
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Name:</strong> {user?.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Email:</strong> {user?.email}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box>
          <Typography variant="h6" gutterBottom>
            Delivery Address
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="street"
                  label="Street Address"
                  name="street"
                  value={addressForm.street}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  inputProps={{ pattern: '[6-9][0-9]{9}' }}
                  helperText="Enter a 10-digit phone number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="city"
                  label="City"
                  name="city"
                  value={addressForm.city}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="state"
                  label="State"
                  name="state"
                  value={addressForm.state}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="zipCode"
                  label="ZIP Code"
                  name="zipCode"
                  value={addressForm.zipCode}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="landmark"
                  label="Landmark (Optional)"
                  name="landmark"
                  value={addressForm.landmark}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Address'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={success}
      />
    </Container>
  );
};

export default Profile; 