import { ThemeProvider, CssBaseline, createTheme, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { RootState } from './store/store';
import { initializeAuth } from './store/slices/authSlice';
import HeroSection, { VoiceFilterCriteria } from './components/HeroSection';
import Header from './components/Header/Header';

function App() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const handleVoiceSearch = (criteria: VoiceFilterCriteria) => {
    // Handle voice search criteria if needed in the future
    console.log("Voice search criteria:", criteria);
  };

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#2B4162',
        light: '#385F71',
        dark: '#1B2845',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#385F71',
        light: '#5C89A0',
        dark: '#1B3947',
        contrastText: '#000000',
      },
      background: {
        default: '#F5F7FA',
        paper: '#FFFFFF',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        fontSize: "3.5rem",
        lineHeight: 1.2,
        "@media (max-width:600px)": {
          fontSize: "2.5rem",
        },
      },
      h5: {
        fontWeight: 500,
        fontSize: "1.5rem",
        lineHeight: 1.4,
        "@media (max-width:600px)": {
          fontSize: "1.25rem",
        },
      },
      h6: {
        fontWeight: 700,
        fontSize: "1.25rem",
        letterSpacing: "0.02em",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ minHeight: '100vh', position: 'relative' }}>
          <Header />
          <HeroSection onVoiceSearch={handleVoiceSearch} />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
