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
import UserMenu from '../Auth/UserMenu';
import VoiceAgentSettings from '../VoiceAgent/VoiceAgentSettings';
import styles from './Header.module.css';
import { logout } from '../../store/slices/authSlice';

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
    <AppBar position="sticky" className={styles.header}>
      <Container maxWidth="xl">
        <Toolbar disableGutters className={styles.toolbar}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open menu"
              edge="start"
              onClick={toggleMobileMenu}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box 
            className={styles.logoContainer}
            onClick={handleHomeClick}
            sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}
          >
            <BuildingIcon sx={{ mr: 1, fontSize: '2rem' }} />
            <Typography
              variant="h5"
              component="div"
              className={styles.logoText}
              sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                letterSpacing: '.1rem',
                cursor: 'pointer'
              }}
            >
              Global Estates
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Button 
                color="inherit" 
                component={Link} 
                to="/"
                className={location.pathname === '/' ? styles.activeLink : ''}
              >
                Buy
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/menu"
                className={location.pathname === '/menu' ? styles.activeLink : ''}
              >
                Rent
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/cart"
                className={location.pathname === '/cart' ? styles.activeLink : ''}
              >
                Sell
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/profile"
                className={location.pathname === '/profile' ? styles.activeLink : ''}
              >
                About
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/contact"
                className={location.pathname === '/contact' ? styles.activeLink : ''}
              >
                Contact
              </Button>
            </Box>
          )}

          {/* Right Side Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Voice Agent Settings */}
            <Tooltip title="Voice Agent Settings">
              <IconButton
                color="inherit"
                onClick={handleOpenSettings}
                className={styles.actionButton}
                sx={{ backgroundColor: 'rgba(245, 133, 63, 0.3)', '&:hover': { backgroundColor: 'rgba(245, 133, 63, 0.5)' } }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle */}
            <IconButton 
              color="inherit"
              onClick={() => dispatch(toggleTheme())}
              className={styles.actionButton}
            >
              {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            
            {/* User Menu */}
            <UserMenu />
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          '& .MuiDrawer-paper': {
            width: '80%',
            maxWidth: '300px',
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BuildingIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" color="primary.main" fontWeight="bold">Global Estates</Typography>
          </Box>
          <IconButton onClick={toggleMobileMenu}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          <ListItem button onClick={handleHomeClick} selected={location.pathname === '/'}>
            <ListItemIcon><HomeIcon color={location.pathname === '/' ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Buy" />
          </ListItem>
          <ListItem button onClick={() => { navigate('/menu'); setMobileMenuOpen(false); }} selected={location.pathname === '/menu'}>
            <ListItemIcon><HomeIcon color={location.pathname === '/menu' ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Rent" />
          </ListItem>
          <ListItem button onClick={handleCartClick} selected={location.pathname === '/cart'}>
            <ListItemIcon>
              <BuildingIcon color={location.pathname === '/cart' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Sell" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
            selected={location.pathname === '/profile'}
          >
            <ListItemIcon>
              <BuildingIcon color={location.pathname === '/profile' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="About" />
          </ListItem>
          <ListItem 
            button 
            onClick={() => { navigate('/contact'); setMobileMenuOpen(false); }}
            selected={location.pathname === '/contact'}
          >
            <ListItemIcon>
              <BuildingIcon color={location.pathname === '/contact' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Contact" />
          </ListItem>
        </List>
      </Drawer>

      {/* Voice Agent Settings Dialog */}
      <VoiceAgentSettings open={settingsOpen} onClose={handleCloseSettings} />
    </AppBar>
  );
};

export default Header; 