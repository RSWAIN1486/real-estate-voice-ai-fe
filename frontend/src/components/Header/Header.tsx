import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Badge, 
  Box,
  Button,
  Container,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  AccountBalance as BuildingIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { RootState } from '../../store/store';
import { toggleTheme } from '../../store/slices/themeSlice';
import VoiceAgentSettings from '../VoiceAgent/VoiceAgentSettings';
import styles from './Header.module.css';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const cartItems = useSelector((state: RootState) => state.order.items);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCartClick = () => {
    navigate('/cart');
    setMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    navigate('/');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, onClick: handleHomeClick },
    { 
      text: 'Cart', 
      icon: (
        <Badge badgeContent={totalItems} color="error">
          <ShoppingCartIcon />
        </Badge>
      ), 
      onClick: handleCartClick 
    }
  ];

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: 'transparent',
        boxShadow: 'none',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo/Home Section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={() => navigate('/')}
              sx={{ 
                color: 'white',
                mr: 1,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <HomeIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: '.02em',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': { opacity: 0.9 },
              }}
              onClick={() => navigate('/')}
            >
              DUBAI ESTATES
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              sx={{
                color: 'white',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
                textTransform: 'none',
                fontSize: '1rem',
              }}
              onClick={() => navigate('/buy')}
            >
              Buy
            </Button>
            <Button
              sx={{
                color: 'white',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
                textTransform: 'none',
                fontSize: '1rem',
              }}
              onClick={() => navigate('/rent')}
            >
              Rent
            </Button>
            <Button
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                },
                textTransform: 'none',
                fontSize: '1rem',
                ml: 2,
              }}
              onClick={() => navigate('/contact')}
            >
              Contact Us
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 