import { Box, Container, Typography, Paper, InputBase, IconButton, Button } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useState } from "react";
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
}

interface HeroSectionProps {
  onVoiceSearch?: (criteria: VoiceFilterCriteria) => void;
}

const HeroSection = ({ onVoiceSearch }: HeroSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim() && onVoiceSearch) {
      // Convert text search to filter criteria
      onVoiceSearch({
        location: searchQuery
      });
    }
  };

  const handleVoiceIconClick = () => {
    setVoiceAgentOpen(true);
  };

  const handleVoiceAgentClose = () => {
    setVoiceAgentOpen(false);
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
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
          backgroundColor: "rgba(0, 0, 0, 0.65)", // Darker overlay for better text visibility
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ maxWidth: 800, mx: "auto", textAlign: "center" }}>
          <Typography 
            variant="h2" 
            gutterBottom 
            fontWeight="bold"
            sx={{ 
              color: "#ffffff",
              textShadow: "2px 2px 8px rgba(0,0,0,0.5)", // Enhanced text shadow
              mb: 3,
              letterSpacing: "-0.02em"
            }}
          >
            Find Your Dream Property
          </Typography>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              mb: 6, 
              color: "rgba(255,255,255,0.95)", // Brighter text
              textShadow: "1px 1px 4px rgba(0,0,0,0.4)", // Enhanced text shadow
              fontWeight: 400
            }}
          >
            Explore Dubai's finest properties with our AI-powered voice assistant
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 3, maxWidth: 700, mx: "auto" }}>
            <Paper
              elevation={3}
              sx={{
                p: "2px",
                display: "flex",
                alignItems: "center",
                flexGrow: 1,
                borderRadius: 50,
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(255,255,255,0.95)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <IconButton sx={{ p: "10px", ml: 1, color: "primary.main" }}>
                <LocationOnIcon />
              </IconButton>
              <InputBase
                sx={{ 
                  ml: 1, 
                  flex: 1,
                  py: 1.5,
                  fontSize: "1.1rem",
                  color: "text.primary",
                  "& input::placeholder": {
                    color: "text.secondary",
                    opacity: 0.8,
                  }
                }}
                placeholder="Enter a location or property type"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button
                variant="contained"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: "0 50px 50px 0",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  background: "linear-gradient(45deg, #2B4162 30%, #385F71 90%)",
                  boxShadow: "0 4px 15px rgba(43,65,98,0.3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1B2845 30%, #2B4162 90%)",
                    boxShadow: "0 6px 20px rgba(43,65,98,0.4)",
                  }
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