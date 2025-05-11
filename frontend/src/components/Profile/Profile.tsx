import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { RootState } from '../../store/store';
import { getCurrentUser } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(true);
        try {
          const userData = await getCurrentUser();
          dispatch(setUser(userData));
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load user data. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [dispatch, user]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      {/* User info */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          User Information
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : user ? (
          <Box>
            <List>
              <ListItem>
                <ListItemText primary="Name" secondary={user.name} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Email" secondary={user.email} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Role" secondary={user.role || 'User'} />
              </ListItem>
            </List>
          </Box>
        ) : (
          <Alert severity="info">
            Please log in to view your profile.
          </Alert>
        )}
      </Paper>
      
      {/* Address placeholder */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Address Information
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Address update functionality is not available in this version.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Profile; 