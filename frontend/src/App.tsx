import { ThemeProvider, CssBaseline, createTheme, Box } from '@mui/material';
// import { useDispatch, useSelector } from 'react-redux'; // useSelector unused, useDispatch also unused
import { BrowserRouter } from 'react-router-dom';
// import { useEffect } from 'react'; // Unused
// import { RootState } from './store/store'; // Unused
import HeroSection, { VoiceFilterCriteria } from './components/HeroSection';
import Header from './components/Header/Header';

function App() {
  // const dispatch = useDispatch(); // dispatch is unused

  // Define a default theme or determine it some other way if needed
  const currentTheme = createTheme({
    palette: {
      mode: 'dark', // Hardcoding to dark mode as an example, or could be light
      primary: {
        main: '#0D47A1', // Example: A deep blue
      },
      secondary: {
        main: '#FF6F00', // Example: A vibrant orange
      },
      background: {
        default: '#121212', // Dark background
        paper: '#1E1E1E',   // Slightly lighter paper background
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  const handleVoiceSearch = (criteria: VoiceFilterCriteria) => {
    // Handle voice search criteria if needed in the future
    console.log("Voice search criteria:", criteria);
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Header />
        <Box component="main" sx={{ pt: 8 /* Adjust based on Header height */ }}>
          <HeroSection onVoiceSearch={handleVoiceSearch} />
          {/* Other routes and components would go here if we had them */}
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
