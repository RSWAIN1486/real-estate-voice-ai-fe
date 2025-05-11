import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { RootState } from '../../store/store';
import { VoiceAgentStatusEnum } from '../../store/slices/voiceAgentSlice';
import { addTranscript, clearTranscripts } from '../../store/slices/voiceAgentSlice';
import { Medium } from 'ultravox-client';
import * as voiceAgentService from '../../services/voiceAgentService';

interface VoiceAgentProps {
  open: boolean;
  onClose: () => void;
  showSettings?: boolean;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ open, onClose, showSettings = false }) => {
  const dispatch = useDispatch();
  const { status, transcripts, error } = useSelector((state: RootState) => state.voiceAgent);
  const settings = useSelector((state: RootState) => state.voiceAgentSettings);
  const [isInitializing, setIsInitializing] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(showSettings ? 1 : 0);
  const sessionRef = useRef<any>(null);

  // Update sessionRef when session changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Rest of your component code...

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px'
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Voice Agent</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {/* Your dialog content */}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAgent; 