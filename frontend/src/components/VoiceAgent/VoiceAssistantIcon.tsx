import { Fab, /*useTheme,*/ Box } from "@mui/material";
// import MicIcon from "@mui/icons-material/Mic";
import voiceAgentGif from "../../assets/voice_agent4.gif";

interface VoiceAssistantIconProps {
  onClick: () => void;
  size?: number;
}

const VoiceAssistantIcon: React.FC<VoiceAssistantIconProps> = ({ onClick, size = 56 }) => {
  // const theme = useTheme(); // Unused

  return (
    <Fab
      onClick={onClick}
      sx={{
        position: "relative",
        width: size * 1.2, // Increased size to make it larger than search bar
        height: size * 1.2,
        p: 0,
        borderRadius: "50%",
        overflow: "visible",
        backgroundColor: "transparent",
        transition: "transform 0.3s ease",
        "&:hover": {
          transform: "scale(1.05)"
        }
      }}
    >
      <Box
        component="img"
        src={voiceAgentGif}
        alt="Voice Assistant"
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
        }}
      />
    </Fab>
  );
};

export default VoiceAssistantIcon; 