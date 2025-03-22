import { Box, Container, Typography, Paper, InputBase, IconButton, Button } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ClearIcon from '@mui/icons-material/Clear';
import { useState, useEffect } from "react";
import VoiceAgent from "./VoiceAgent/VoiceAgent";
import VoiceAssistantIcon from "./VoiceAgent/VoiceAssistantIcon";
import heroBgImage from "../assets/images/hero-bg.jpg";

// Interface for voice search criteria
export interface VoiceFilterCriteria {
  location?: string;
  bedrooms?: string;
  propertyType?: string;
  listingType?: string;
  priceRange?: [number, number];
  features?: string[];
  viewType?: string;
  isPetFriendly?: boolean;
  isFurnished?: boolean;
  yearBuilt?: string;
  areaRange?: [number, number];
  nearbyAmenities?: string[];
  resetAll?: boolean; // New flag to signal a full reset
}

interface HeroSectionProps {
  onVoiceSearch?: (criteria: VoiceFilterCriteria) => void;
}

const HeroSection = ({ onVoiceSearch }: HeroSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Apply search filter when input changes (with debounce)
  const handleSearchChange = (newQuery: string) => {
    setSearchQuery(newQuery);
    
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set a new timeout to trigger search after typing stops
    const timeout = setTimeout(() => {
      if (newQuery.trim() && onVoiceSearch) {
        onVoiceSearch({
          location: newQuery
        });
      } else if (newQuery === "" && onVoiceSearch) {
        // If search is cleared, reset the location filter
        onVoiceSearch({
          location: "",
        });
      }
    }, 500); // 500ms debounce
    
    setTypingTimeout(timeout);
  };

  // Clear search and reset filters
  const handleClearSearch = () => {
    setSearchQuery("");
    if (onVoiceSearch) {
      onVoiceSearch({
        location: "",
        resetAll: true
      });
    }
  };

  // Immediate search on button click
  const handleSearch = () => {
    if (searchQuery.trim() && onVoiceSearch) {
      onVoiceSearch({
        location: searchQuery
      });
    }
  };

  // Immediate search when a city button is clicked
  const handleCityClick = (city: string) => {
    setSearchQuery(city);
    if (onVoiceSearch) {
      onVoiceSearch({
        location: city
      });
    }
  };

  const handleVoiceIconClick = () => {
    setVoiceAgentOpen(true);
  };

  const handleVoiceAgentClose = () => {
    setVoiceAgentOpen(false);
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return (
    <Box
      sx={{
        position: "relative",
        height: "70vh",
        display: "flex",
        alignItems: "center",
        backgroundImage: `url(${heroBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: -1,
        },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          maxWidth: 800,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          p: 4,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <Typography variant="h2" gutterBottom fontWeight="bold" color="#1A1A1A">
            Find Your Dream Property
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ mb: 4, color: "#333333" }}>
            Explore properties across multiple countries with our AI-powered voice assistant
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3, maxWidth: 700 }}>
            <Paper
              elevation={3}
              sx={{
                p: "2px",
                display: "flex",
                alignItems: "center",
                flexGrow: 1,
                borderRadius: 50,
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
                border: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              <IconButton sx={{ p: "10px", ml: 1, color: "text.secondary" }}>
                <LocationOnIcon />
              </IconButton>
              <InputBase
                sx={{ 
                  ml: 1, 
                  flex: 1,
                  py: 1,
                  fontSize: "1rem",
                }}
                placeholder="Enter a location, property type, or keyword"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              {searchQuery && (
                <IconButton 
                  sx={{ p: "10px", color: "text.secondary" }}
                  onClick={handleClearSearch}
                  aria-label="clear search"
                >
                  <ClearIcon />
                </IconButton>
              )}
              <Button
                variant="contained"
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: "0 50px 50px 0",
                  textTransform: "none",
                  fontSize: "1rem",
                  boxShadow: "none",
                }}
                startIcon={<SearchIcon />}
                onClick={handleSearch}
              >
                Search
              </Button>
            </Paper>
            
            {/* Voice Assistant Icon */}
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center",
                position: "relative",
              }}
            >
              <VoiceAssistantIcon onClick={handleVoiceIconClick} size={64} />
            </Box>
          </Box>

          <Box sx={{ mt: 5, display: "flex", gap: 2, flexWrap: "wrap" }}>
            {["Dubai", "New York", "London", "Abu Dhabi", "Manchester"].map((city) => (
              <Button
                key={city}
                variant="outlined"
                sx={{
                  borderRadius: 30,
                  px: 3,
                  py: 0.75,
                  color: "#1A1A1A",
                  borderColor: "rgba(0, 0, 0, 0.3)",
                  bgcolor: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                  },
                }}
                onClick={() => handleCityClick(city)}
              >
                {city}
              </Button>
            ))}
            <Button
              variant="outlined"
              sx={{
                borderRadius: 30,
                px: 3,
                py: 0.75,
                color: "#1A1A1A",
                borderColor: "rgba(0, 0, 0, 0.3)",
                bgcolor: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                },
              }}
              onClick={handleClearSearch}
            >
              Show All
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Voice Agent Dialog */}
      <VoiceAgent
        open={voiceAgentOpen}
        onClose={handleVoiceAgentClose}
        showSettings={false}
      />
    </Box>
  );
};

export default HeroSection; 