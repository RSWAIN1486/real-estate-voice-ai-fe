import { ThemeProvider, CssBaseline, createTheme, Container, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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

// Extend VoiceFilterCriteria to include searchParams
interface ExtendedVoiceFilterCriteria extends VoiceFilterCriteria {
  searchParams?: Partial<Filters>;
}

// Main content component to use the router hooks
function MainContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const [filters, setFilters] = useState<Filters>({
    location: "",
    minPrice: 0,
    maxPrice: 10000000,
    bedrooms: "",
    bathrooms: "",
    propertyType: "",
    listingType: "",
    minArea: 0,
    maxArea: 10000,
    selectedFeatures: [],
    viewType: "",
    nearbyAmenities: [],
    yearBuilt: "",
    isPetFriendly: false,
    isFurnished: false,
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
        console.error('Failed to initialize auth:', error);
      }
    };
    
    initializeAuth();
  }, [dispatch]);

  useEffect(() => {
    // Listen for voice search events
    const handleVoiceSearch = (event: CustomEvent) => {
      if (event.detail && typeof event.detail === 'object') {
        const { location, resetAll, searchParams } = event.detail as ExtendedVoiceFilterCriteria;
        
        // Handle resetAll flag from clear button in hero section
        if (resetAll) {
          // Reset all filters to initial values
          setFilters({
            location: "",
            minPrice: 0,
            maxPrice: 10000000,
            bedrooms: "",
            bathrooms: "",
            propertyType: "",
            listingType: "",
            minArea: 0,
            maxArea: 10000,
            selectedFeatures: [],
            viewType: "",
            nearbyAmenities: [],
            yearBuilt: "",
            isPetFriendly: false,
            isFurnished: false,
          });
          return;
        }
        
        // If we have location only, reset other filters and set location
        if (location && !searchParams) {
          // Create new filters object with just the location changed
          const newFilters = {
            ...filters,
            location
          };
          setFilters(newFilters);
        }
        
        // If we have searchParams, update the filters object
        if (searchParams) {
          setFilters(prev => ({
            ...prev,
            ...searchParams
          }));
        }
      }
    };
    
    // Listen for property preference updates from voice agent
    const handlePropertyPreferences = (event: CustomEvent) => {
      console.log('App received updateFilters event:', event.detail);
      
      if (event.detail && event.detail.filters) {
        console.log('Received property preferences update:', event.detail.filters);
        
        // Properly merge the existing filters with the new ones
        const newFilters = { 
          ...filters, 
          ...event.detail.filters 
        };
        
        console.log('Updated filters state:', newFilters);
        setFilters(newFilters);
        
        // Scroll to the filter section
        setTimeout(() => {
          const filtersElement = document.querySelector('.search-filters-container');
          if (filtersElement) {
            filtersElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    };
    
    // Listen for search execution requests from voice agent
    const handleSearchExecution = (event: CustomEvent) => {
      console.log('App received executeSearch event:', event.detail);
      if (event.detail) {
        console.log('Executing property search with criteria:', event.detail.criteria);
        
        // Extract the criteria from the event detail
        const criteria = event.detail.criteria || {};
        
        // Check if this is a "show all" request with no specific filters
        if (criteria.showAll) {
          console.log('Showing all properties (no filters)');
          // Reset filters to show all properties
          setFilters({} as Filters);
        } else {
          // Update filters with the search criteria 
          console.log('Updating filters with criteria:', criteria);
          setFilters(prev => ({
            ...prev,
            ...criteria
          }));
        }
        
        // Scroll to the property list section to show results
        setTimeout(() => {
          const propertyListElement = document.querySelector('.property-list-container');
          if (propertyListElement) {
            propertyListElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
        
        // Don't navigate away from the home page
      }
    };
    
    window.addEventListener('voiceSearch', handleVoiceSearch as EventListener);
    window.addEventListener('updateFilters', handlePropertyPreferences as EventListener);
    window.addEventListener('executeSearch', handleSearchExecution as EventListener);
    
    return () => {
      window.removeEventListener('voiceSearch', handleVoiceSearch as EventListener);
      window.removeEventListener('updateFilters', handlePropertyPreferences as EventListener);
      window.removeEventListener('executeSearch', handleSearchExecution as EventListener);
    };
  }, [navigate, location.pathname, filters]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleVoiceSearch = (criteria: VoiceFilterCriteria) => {
    console.log('Voice search criteria:', criteria);
    
    // If criteria includes a location or other search params, update filters
    if (criteria.location) {
      const event = new CustomEvent('voiceSearch', {
        detail: criteria
      });
      window.dispatchEvent(event);
    }
  };

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#1a246a',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Box sx={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={
              <Box>
                <HeroSection onVoiceSearch={handleVoiceSearch} />
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                  <SearchFilters onFilterChange={handleFilterChange} initialFilters={filters} />
                  <PropertyList filters={filters} />
                </Container>
              </Box>
            } />
            <Route path="/properties" element={
              <Container maxWidth="lg" sx={{ mt: 4 }}>
                <SearchFilters onFilterChange={handleFilterChange} initialFilters={filters} />
                <PropertyList filters={filters} />
              </Container>
            } />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  );
}

export default App;
