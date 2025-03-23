import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  Paper,
  ListItemIcon,
  useTheme,
} from '@mui/material';
import {
  AccountCircle,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Logout as LogoutIcon,
  Person as ProfileIcon,
  Home as PropertyIcon,
} from '@mui/icons-material';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import styles from './Auth.module.css';

const UserMenu: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    console.log('Logging out user...');
    
    // Dispatch logout action
    dispatch(logout());
    
    // Force clear any remaining tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    console.log('User logged out, auth state cleared');
    
    // Close the menu and navigate to login page
    handleClose();
    navigate('/login', { replace: true });
  };
  
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleRegister = () => {
    navigate('/register');
  };
  
  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  // Generate random avatar background color based on name
  const getAvatarColor = (name: string) => {
    if (!name) return theme.palette.primary.main;
    
    // Simple hash function to generate a consistent hue from a name
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          color="inherit"
          startIcon={<LoginIcon />}
          onClick={handleLogin}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
          className={styles.authButton}
        >
          Login
        </Button>
        <Button
          color="inherit"
          startIcon={<RegisterIcon />}
          onClick={handleRegister}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
          className={styles.authButton}
        >
          Register
        </Button>
        <IconButton
          color="inherit"
          onClick={handleLogin}
          sx={{ display: { xs: 'flex', sm: 'none' } }}
          className={styles.authIconButton}
        >
          <LoginIcon />
        </IconButton>
      </Box>
    );
  }
  
  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        color="inherit"
        className={styles.userAvatarButton}
      >
        {user?.name ? (
          <Avatar 
            sx={{ 
              width: 38, 
              height: 38,
              bgcolor: getAvatarColor(user.name),
              fontWeight: 'bold', 
              border: '2px solid white'
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
        ) : (
          <AccountCircle />
        )}
      </IconButton>
      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            mt: 1.5,
            borderRadius: 2,
            width: 220,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar 
              sx={{ 
                width: 42, 
                height: 42, 
                mr: 1.5, 
                bgcolor: getAvatarColor(user?.name || ''),
                fontWeight: 'bold',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 140 }}>
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 1 }} />
        
        <MenuItem onClick={handleProfile} className={styles.menuItem}>
          <ListItemIcon>
            <ProfileIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <Typography variant="body2">My Profile</Typography>
        </MenuItem>
        
        <MenuItem onClick={handleLogout} className={styles.menuItem}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
        
        <Box sx={{ p: 1.5, pt: 1 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              bgcolor: 'primary.light', 
              p: 1.5, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <PropertyIcon sx={{ color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
              My Saved Properties
            </Typography>
          </Paper>
        </Box>
      </Menu>
    </Box>
  );
};

export default UserMenu; 