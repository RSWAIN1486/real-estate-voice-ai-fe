import { ThemeProvider, CssBaseline, createTheme, Container, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import HeroSection, { VoiceFilterCriteria } from './components/HeroSection';
import SearchFilters, { Filters } from './components/SearchFilters';
import PropertyList from './components/PropertyList';

function App() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const [filters, setFilters] = useState<Filters>({
    location: "",
    minPrice: 0,
    maxPrice: 10000000,
    bedrooms: "",
    bathrooms: "",
    propertyType: "",
    listingType: "",
  });

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

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleVoiceSearch = (criteria: VoiceFilterCriteria) => {
    const updatedFilters = { ...filters };

    if (criteria.location) {
      updatedFilters.location = criteria.location;
    }

    if (criteria.bedrooms) {
      updatedFilters.bedrooms = criteria.bedrooms;
    }

    if (criteria.propertyType) {
      updatedFilters.propertyType = criteria.propertyType;
    }

    if (criteria.listingType) {
      updatedFilters.listingType = criteria.listingType;
    }

    if (criteria.priceRange) {
      updatedFilters.minPrice = criteria.priceRange[0];
      updatedFilters.maxPrice = criteria.priceRange[1];
    }

    setFilters(updatedFilters);
  };

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#2B4162', // Deep blue
        light: '#385F71', // Light blue
        dark: '#1B2845', // Dark blue
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#F5853F', // Orange
        light: '#FF9B54', // Light orange
        dark: '#D65A31', // Dark orange
        contrastText: '#000000',
      },
      background: {
        default: themeMode === 'light' ? '#F5F5F5' : '#121212',
        paper: themeMode === 'light' ? '#FFFFFF' : '#1e1e1e',
      },
      error: {
        main: '#d50000',
      },
      success: {
        main: '#2e7d32',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
            '--primary-color': '#2B4162',
            '--secondary-color': '#F5853F',
            '--background-light': '#F5F5F5',
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
            borderRadius: '8px',
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
              boxShadow: '0 6px 12px rgba(43, 65, 98, 0.25)',
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
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection onVoiceSearch={handleVoiceSearch} />
                <Container 
                  component="main" 
                  sx={{ 
                    flex: 1,
                    py: 4,
                    maxWidth: { xs: 'lg', lg: 'xl' },
                  }}
                >
                  <SearchFilters onFilterChange={handleFilterChange} />
                  <Box sx={{ mt: 4 }}>
                    <PropertyList filters={filters} />
                  </Box>
                </Container>
              </>
            } />
            <Route path="/menu" element={
              <Container 
                component="main" 
                sx={{ 
                  flex: 1,
                  py: 4,
                  maxWidth: { xs: 'lg', lg: 'xl' },
                }}
              >
                <Menu />
              </Container>
            } />
            <Route path="/cart" element={
              <Container 
                component="main" 
                sx={{ 
                  flex: 1,
                  py: 4,
                  maxWidth: { xs: 'lg', lg: 'xl' },
                }}
              >
                <Cart />
              </Container>
            } />
            <Route path="/login" element={
              <Container 
                component="main" 
                sx={{ 
                  flex: 1,
                  py: 4,
                  maxWidth: { xs: 'lg', lg: 'xl' },
                }}
              >
                <Login />
              </Container>
            } />
            <Route path="/register" element={
              <Container 
                component="main" 
                sx={{ 
                  flex: 1,
                  py: 4,
                  maxWidth: { xs: 'lg', lg: 'xl' },
                }}
              >
                <Register />
              </Container>
            } />
            <Route path="/profile" element={
              <Container 
                component="main" 
                sx={{ 
                  flex: 1,
                  py: 4,
                  maxWidth: { xs: 'lg', lg: 'xl' },
                }}
              >
                <Profile />
              </Container>
            } />
          </Routes>
          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
