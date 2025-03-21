import { ThemeProvider, CssBaseline, createTheme, Container, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { RootState } from './store/store';
import { setUser } from './store/slices/authSlice';
import { getCurrentUser } from './services/authService';
import Menu from './components/Menu/Menu';
import Cart from './components/Cart/Cart';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Profile/Profile';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

function App() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem('token');
        if (token) {
          // Try to get user data
          const userData = await getCurrentUser();
          dispatch(setUser(userData));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // If there's an error (like invalid/expired token), the getCurrentUser function
        // will already handle clearing the token from localStorage
      }
    };

    initializeAuth();
  }, [dispatch]);

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#e53935', // Vibrant pizza sauce red
        light: '#ff6f60',
        dark: '#ab000d',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#fdd835', // Cheese yellow
        light: '#ffff6b',
        dark: '#c6a700',
        contrastText: '#000000',
      },
      background: {
        default: themeMode === 'light' ? '#f9f9f9' : '#121212',
        paper: themeMode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      error: {
        main: '#d50000',
      },
      success: {
        main: '#2e7d32',
      },
    },
    typography: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 500,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--primary-color': '#e53935',
            '--secondary-color': '#fdd835',
            '--background-light': '#f9f9f9',
            '--card-hover-shadow': '0 8px 24px rgba(0, 0, 0, 0.12)',
          },
          body: {
            scrollBehavior: 'smooth',
          },
          a: {
            textDecoration: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '50px',
            padding: '8px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease-in-out',
          },
          contained: {
            '&:hover': {
              boxShadow: '0 6px 12px rgba(229, 57, 53, 0.25)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            overflow: 'hidden',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: 'var(--card-hover-shadow)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
          }}
        >
          <Header />
          <Container 
            component="main" 
            sx={{ 
              flex: 1,
              py: 4,
              maxWidth: { xs: 'lg', lg: 'xl' },
            }}
          >
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Container>
          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
