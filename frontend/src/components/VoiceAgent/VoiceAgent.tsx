import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogProps,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Avatar,
  Divider,
  Button,
  Stack,
  Fab,
  Tooltip,
  useTheme,
  Tabs,
  Tab,
  Badge,
  ButtonGroup,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Close as CloseIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  SmartToy as SmartToyIcon,
  Settings as SettingsIcon,
  RestartAlt as RestartIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material';
import { UltravoxSession, Medium } from 'ultravox-client';

import { RootState, store } from '../../store/store';
import { 
  setActive, 
  setCallInfo, 
  setStatus, 
  addTranscript, 
  clearTranscripts, 
  setError,
  resetAgent,
  VoiceAgentStatus
} from '../../store/slices/voiceAgentSlice';
import { setVoice } from '../../store/slices/voiceAgentSettingsSlice';
import voiceAgentService from '../../services/voiceAgentService';
import { addItem } from '../../store/slices/orderSlice';
import VoiceAgentSettings from './VoiceAgentSettings';

import styles from './VoiceAgent.module.css';

// Extend Window interface to add our temporary audio stream
declare global {
  interface Window {
    temporaryAudioStream?: MediaStream;
    savedTranscripts?: Array<any>; // For storing past conversations
    lastCallId?: string; // For storing the last call ID
  }
}

interface VoiceAgentProps {
  open: boolean;
  onClose: () => void;
  showSettings?: boolean;
}

// Custom DialogTitle that ensures close button triggers proper cleanup
interface CustomDialogTitleProps {
  children: React.ReactNode;
  onClose: () => void;
}

const CustomDialogTitle = (props: CustomDialogTitleProps) => {
  const { children, onClose } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>{children}</div>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ color: (theme) => theme.palette.grey[500] }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
  );
};

const VoiceAgent: React.FC<VoiceAgentProps> = ({ open, onClose, showSettings = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { status, transcripts, error, isActive } = useSelector((state: RootState) => state.voiceAgent);
  const settings = useSelector((state: RootState) => state.voiceAgentSettings);
  const [isInitializing, setIsInitializing] = useState(false);
  const [session, setSession] = useState<UltravoxSession | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [currentText, setCurrentText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(showSettings ? 1 : 0);
  
  // Add audio level detection
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioDataArray = useRef<Uint8Array | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Initialize and clean up the agent when the dialog opens/closes
  useEffect(() => {
    if (open) {
      // Always reset the conversation when the dialog opens
      dispatch(resetAgent());
      dispatch(clearTranscripts());
      
      // Comment out previous conversation loading
      /*
      // Check if we have a previous conversation to load
      const lastCallId = window.lastCallId || sessionStorage.getItem('lastVoiceAgentCallId') || localStorage.getItem('lastVoiceAgentCallId');
      const savedTranscripts = window.savedTranscripts || JSON.parse(localStorage.getItem('savedTranscripts') || '[]');
      
      if ((lastCallId || (savedTranscripts && Array.isArray(savedTranscripts) && savedTranscripts.length > 0))) {
        console.log('Found previous conversation, attempting to load it');
        
        // Validate saved transcripts
        const validatedTranscripts = validateTranscripts(savedTranscripts);
        
        // Start a new call with previous context
        initializeAgent(validatedTranscripts);
      } else {
        // Start a completely new call
        console.log('No previous conversation found, starting new conversation');
        initializeAgent();
      }
      */
      
      // Always start a new conversation
      console.log('Starting a new conversation (ignoring previous conversations)');
      initializeAgent();
      
    } else {
      // Clean up if the dialog closes
      if (status === VoiceAgentStatus.ACTIVE) {
        handleEndCall();
      }
    }
    
    return () => {
      if (status === VoiceAgentStatus.ACTIVE) {
        handleEndCall();
      }
    };
  }, [open]);
  
  const initializeAgent = async (pastTranscripts?: Array<any>) => {
    try {
      setIsInitializing(true);
      dispatch(setError(null));
      dispatch(setStatus(VoiceAgentStatus.INITIALIZING));
      
      // Request microphone permissions explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Keep the stream active until the call is initialized
        const audioTracks = stream.getAudioTracks();
        console.log('Microphone permission granted:', audioTracks[0].label);
        
        // Don't stop the stream here - the Ultravox SDK needs it
        // We'll store it temporarily for cleanup later
        window.temporaryAudioStream = stream;
      } catch (permissionError) {
        console.error('Microphone permission denied:', permissionError);
        dispatch(setError('Microphone access denied. Please allow microphone access and try again.'));
        setIsInitializing(false);
        return;
      }
      
      // Create a new call (with past transcripts if provided)
      let callData;
      
      // Comment out previous call ID usage for now, as requested
      /*
      // Check if we have a previous call ID in session or local storage
      const lastCallId = window.lastCallId || sessionStorage.getItem('lastVoiceAgentCallId') || localStorage.getItem('lastVoiceAgentCallId');
      
      if (lastCallId && pastTranscripts && pastTranscripts.length > 0) {
        // If we have both transcripts and a callId, prefer using callId for resuming
        console.log('Resuming conversation with previous call ID:', lastCallId);
        callData = await voiceAgentService.createVoiceAgentCall(undefined, lastCallId);
      } else if (pastTranscripts && pastTranscripts.length > 0) {
        // If we only have transcripts, use them
        console.log('Initializing with past transcripts');
        callData = await voiceAgentService.createVoiceAgentCall(pastTranscripts);
      } else {
        // Start a completely new conversation
        console.log('Starting new conversation');
        callData = await voiceAgentService.createVoiceAgentCall();
      }
      */
      
      // Always start a completely new conversation for now
      console.log('Starting new conversation (ignoring previous call IDs as requested)');
      callData = await voiceAgentService.createVoiceAgentCall();
      
      // Store the new call ID for future use (commented out, but keep generated ID in Redux)
      const newCallId = callData.callId;
      
      // Comment out localStorage/sessionStorage usage
      /*
      window.lastCallId = newCallId;
      sessionStorage.setItem('lastVoiceAgentCallId', newCallId);
      localStorage.setItem('lastVoiceAgentCallId', newCallId);
      */
      
      // Store call info in Redux
      dispatch(setCallInfo({
        callId: callData.callId,
        joinUrl: callData.joinUrl
      }));
      
      // Initialize the Ultravox session
      const newSession = voiceAgentService.initializeUltravoxSession();
      
      // Join the call
      voiceAgentService.joinCall(callData.joinUrl);
      
      // Set the session
      setSession(newSession);
      
      // Set active state
      dispatch(setActive(true));
      
      // Comment out message about resuming previous conversation
      /*
      // If we don't have past transcripts but used a callId, we need to show a message
      // that we're continuing a previous conversation
      if (lastCallId && (!pastTranscripts || pastTranscripts.length === 0)) {
        // Add a system message that we're resuming a previous conversation
        dispatch(addTranscript({
          text: "Resuming your previous conversation...",
          isFinal: true,
          speaker: "agent",
          medium: Medium.TEXT
        }));
      }
      */
      
      setIsInitializing(false);
    } catch (error) {
      console.error('Error initializing voice agent:', error);
      dispatch(setError('Failed to initialize voice agent. Please try again.'));
      setIsInitializing(false);
    }
  };
  
  const handleSessionStatus = (event: Event) => {
    if (session) {
      // Map Ultravox session status to our VoiceAgentStatus
      let agentStatus: VoiceAgentStatus;
      
      // Use string comparison since the types might not match exactly
      const status = String(session.status);
      
      switch (status) {
        case 'connecting':
          agentStatus = VoiceAgentStatus.CONNECTING;
          break;
        case 'connected':
          agentStatus = VoiceAgentStatus.CONNECTED;
          break;
        case 'active':
          agentStatus = VoiceAgentStatus.ACTIVE;
          break;
        case 'error':
          agentStatus = VoiceAgentStatus.ERROR;
          break;
        case 'disconnected':
          agentStatus = VoiceAgentStatus.DISCONNECTED;
          break;
        default:
          agentStatus = VoiceAgentStatus.IDLE;
      }
      
      dispatch(setStatus(agentStatus));
    }
  };
  
  const handleTranscripts = (event: Event) => {
    if (session) {
      // Get all transcripts from the session
      const ultravoxTranscripts = session.transcripts;
      
      // Process both agent and user transcripts
      if (ultravoxTranscripts.length > 0) {
        // Clear existing transcripts and rebuild the list to ensure we have both user and agent messages
        dispatch(clearTranscripts());
        
        // First, add all final transcripts
        ultravoxTranscripts
          .filter(transcript => transcript.isFinal)
          .forEach(transcript => {
            // Convert API medium format to our internal format
            let medium: Medium;
            if (transcript.medium === 'voice') {
              medium = Medium.VOICE;
            } else {
              medium = Medium.TEXT;
            }
            
            // Only add if the transcript has text content
            if (transcript.text && transcript.text.trim()) {
              dispatch(addTranscript({
                text: transcript.text,
                isFinal: transcript.isFinal,
                speaker: transcript.speaker,
                medium: medium
              }));
            }
          });
          
        // For user transcripts, only show the most recent final transcript or a high-confidence non-final
        // This helps prevent showing random incomplete sentences
        const userTranscripts = ultravoxTranscripts.filter(t => t.speaker === 'user');
        
        // First try to find the most recent final user transcript
        const latestUserFinal = [...userTranscripts]
          .reverse()
          .find(transcript => transcript.isFinal);
        
        // If we have a final transcript, show it
        if (latestUserFinal && latestUserFinal.text && latestUserFinal.text.trim()) {
          let medium: Medium;
          if (latestUserFinal.medium === 'voice') {
            medium = Medium.VOICE;
          } else {
            medium = Medium.TEXT;
          }
          
          // Only add if not already added (avoid duplication)
          const alreadyAdded = ultravoxTranscripts
            .filter(t => t.isFinal)
            .some(t => t.speaker === 'user' && t.text === latestUserFinal.text);
            
          if (!alreadyAdded) {
            dispatch(addTranscript({
              text: latestUserFinal.text,
              isFinal: true,
              speaker: 'user',
              medium: medium
            }));
          }
        } 
        // Otherwise, only show non-final transcripts if they seem complete enough
        else {
          const latestUserNonFinal = [...userTranscripts]
            .reverse()
            .find(transcript => !transcript.isFinal);
            
          if (latestUserNonFinal && 
              latestUserNonFinal.text && 
              latestUserNonFinal.text.trim() && 
              latestUserNonFinal.text.trim().length > 10) { // Only show if it's substantial
            
            let medium: Medium;
            if (latestUserNonFinal.medium === 'voice') {
              medium = Medium.VOICE;
            } else {
              medium = Medium.TEXT;
            }
            
            dispatch(addTranscript({
              text: latestUserNonFinal.text,
              isFinal: false,
              speaker: 'user',
              medium: medium
            }));
          }
        }
        
        // Finally, add the latest non-final transcript from the agent (if it exists)
        const latestAgentNonFinal = [...ultravoxTranscripts]
          .reverse()
          .find(transcript => transcript.speaker === 'agent' && !transcript.isFinal);
        
        if (latestAgentNonFinal && latestAgentNonFinal.text && latestAgentNonFinal.text.trim()) {
          let medium: Medium;
          if (latestAgentNonFinal.medium === 'voice') {
            medium = Medium.VOICE;
          } else {
            medium = Medium.TEXT;
          }
          
          dispatch(addTranscript({
            text: latestAgentNonFinal.text,
            isFinal: latestAgentNonFinal.isFinal,
            speaker: latestAgentNonFinal.speaker,
            medium: medium
          }));
          
          // Also update current text with the agent's message
          setCurrentText(latestAgentNonFinal.text);
        } else {
          // If no non-final agent transcript, use the latest final one for current text
          const latestAgentFinal = [...ultravoxTranscripts]
            .reverse()
            .find(transcript => transcript.speaker === 'agent' && transcript.isFinal);
            
          if (latestAgentFinal && latestAgentFinal.text) {
            setCurrentText(latestAgentFinal.text);
          }
        }
      }
    }
  };
  
  const handleEndCall = async () => {
    if (status === VoiceAgentStatus.ACTIVE || status === VoiceAgentStatus.CONNECTED) {
      try {
        console.log('Ending active call');
        setStatus(VoiceAgentStatus.ENDING);
        
        // Get the call ID from Redux
        const currentState = store.getState();
        const callId = currentState.voiceAgent.callId;
        
        if (callId) {
          console.log(`Terminating call ${callId}`);
          // Simply call the SDK method through our service
          const result = await voiceAgentService.endCall(callId);
          console.log('Call termination result:', result);
          
          // If call ended successfully, close the dialog automatically
          if (result.callEnded) {
            console.log('Call successfully terminated, closing dialog window');
            setTimeout(() => {
              onClose();
            }, 1000); // Small delay to ensure any final messages are seen
          }
        } else {
          console.warn('No call ID found to terminate');
          // Try to leave the call anyway
          await voiceAgentService.leaveCurrentCall();
        }
      } catch (error) {
        console.error('Error ending call:', error);
        // Try one more time to clean up
        try {
          await voiceAgentService.leaveCurrentCall();
        } catch (secondError) {
          console.error('Second attempt to end call failed:', secondError);
        }
      } finally {
        // Always reset the Redux state
        dispatch(setStatus(VoiceAgentStatus.IDLE));
        dispatch(setActive(false));
      }
    } else {
      // No active call, just close the dialog
      onClose();
    }
  };
  
  const handleMicToggle = () => {
    try {
      console.log('Toggling microphone state, current state:', micMuted);
      if (micMuted) {
        console.log('Unmuting microphone...');
        voiceAgentService.unmuteMic();
      } else {
        console.log('Muting microphone...');
        voiceAgentService.muteMic();
      }
      setMicMuted(!micMuted);
      
      // Provide user feedback
      if (micMuted) {
        console.log('Microphone has been unmuted');
      } else {
        console.log('Microphone has been muted');
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      // Show a user-friendly error message
      dispatch(setError('Failed to toggle microphone. Please try again.'));
    }
  };
  
  const handleSpeakerToggle = () => {
    if (speakerMuted) {
      voiceAgentService.unmuteSpeaker();
    } else {
      voiceAgentService.muteSpeaker();
    }
    setSpeakerMuted(!speakerMuted);
  };
  
  const handleCheckout = (orderItems: any) => {
    try {
      // Process the order items and add them to the cart
      const parsedItems = typeof orderItems === 'string' ? JSON.parse(orderItems) : orderItems;
      
      parsedItems.forEach((item: any) => {
        dispatch(addItem({
          id: item.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        }));
      });
      
      // Close the voice agent dialog
      onClose();
      
      // Navigate to the cart page
      navigate('/cart');
    } catch (error) {
      console.error('Error handling checkout:', error);
    }
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const renderStatusMessage = () => {
    switch (status) {
      case VoiceAgentStatus.INITIALIZING:
        return 'Initializing...';
      case VoiceAgentStatus.CONNECTING:
        return 'Connecting...';
      case VoiceAgentStatus.CONNECTED:
        return 'Connected';
      case VoiceAgentStatus.DISCONNECTED:
        return 'Disconnected';
      case VoiceAgentStatus.ERROR:
        return 'Error';
      default:
        return 'Waiting for your voice...';
    }
  };
  
  useEffect(() => {
    if (session) {
      // Add event listeners
      session.addEventListener('status', handleSessionStatus);
      session.addEventListener('transcripts', handleTranscripts);
      
      // Add event listener for property search tools - using the CORRECT event names
      window.addEventListener('updateFilters', ((event: CustomEvent) => {
        handlePropertyPreferencesUpdate(event.detail);
      }) as EventListener);
      
      window.addEventListener('executeSearch', ((event: CustomEvent) => {
        handleSearchProperties(event.detail);
      }) as EventListener);
      
      // Add event listener for orderCheckout (kept for backward compatibility)
      window.addEventListener('orderCheckout', ((event: CustomEvent) => {
        handleCheckout(event.detail);
      }) as EventListener);
      
      // Clean up
      return () => {
        session.removeEventListener('status', handleSessionStatus);
        session.removeEventListener('transcripts', handleTranscripts);
        window.removeEventListener('updateFilters', ((event: CustomEvent) => {
          handlePropertyPreferencesUpdate(event.detail);
        }) as EventListener);
        window.removeEventListener('executeSearch', ((event: CustomEvent) => {
          handleSearchProperties(event.detail);
        }) as EventListener);
        window.removeEventListener('orderCheckout', ((event: CustomEvent) => {
          handleCheckout(event.detail);
        }) as EventListener);
      };
    }
  }, [session]);
  
  // Replace the handleClose function with an enhanced version
  // that ensures proper call termination in all scenarios
  const handleClose = async () => {
    console.log('Handling dialog close - cleaning up voice agent');
    
    try {
      // Always terminate the call if we have an active callId
      const currentState = store.getState();
      const currentCallId = currentState.voiceAgent.callId;
      
      // First check if there's an active call based on redux state
      if (status === VoiceAgentStatus.ACTIVE || 
          status === VoiceAgentStatus.CONNECTED || 
          currentCallId) {
        console.log('Active call detected, ending call before closing dialog');
        
        if (currentCallId) {
          try {
            // Use the simplified SDK-based approach
            await voiceAgentService.endCall(currentCallId);
            console.log('Call terminated successfully');
          } catch (error) {
            console.error('Error ending call:', error);
            // Try to leave the call directly as a fallback
            try {
              await voiceAgentService.leaveCurrentCall();
            } catch (secondError) {
              console.error('Error in fallback call termination:', secondError);
            }
          }
        }
      }
      
      // Reset the Redux state to ensure clean slate
      dispatch(setStatus(VoiceAgentStatus.IDLE));
      dispatch(setActive(false));
      
      // Clean up audio resources regardless of call status
      if (window.temporaryAudioStream) {
        console.log('Cleaning up temporary audio stream');
        window.temporaryAudioStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Audio track ${track.label} stopped`);
        });
        delete window.temporaryAudioStream;
      }
      
      // Clean up audio context if it exists
      if (audioContext.current && audioContext.current.state !== 'closed') {
        try {
          await audioContext.current.close();
          console.log('Audio context closed');
        } catch (error) {
          console.error('Error closing audio context:', error);
        }
      }
      
      // Cancel any animation frames
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        console.log('Animation frame canceled');
      }
      
      // Apply a small delay before notifying parent to ensure cleanup is complete
      setTimeout(() => {
        // Finally, notify the parent component
        console.log('Notifying parent component of dialog close');
        onClose();
      }, 100);
    } catch (error) {
      console.error('Unexpected error during dialog close:', error);
      // Still notify the parent even if there was an error
      onClose();
    }
  };
  
  const requestMicrophoneAccess = async () => {
    try {
      dispatch(setError(null));
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTracks = stream.getAudioTracks();
      console.log('Microphone permission granted:', audioTracks[0].label);
      
      // Store the stream for later cleanup
      window.temporaryAudioStream = stream;
      
      // Re-initialize after getting mic permission
      initializeAgent();
      
      return true;
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      dispatch(setError('Microphone access was denied. Please check your browser settings and try again.'));
      return false;
    }
  };
  
  // Add diagnostic function to check audio devices
  const checkAudioDevices = async () => {
    console.log('Checking available audio devices...');
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.error('MediaDevices API not supported in this browser');
        return false;
      }
      
      // Get all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter for audio input devices
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      
      console.log('Available audio input devices:', audioInputDevices);
      
      if (audioInputDevices.length === 0) {
        console.warn('No audio input devices found');
        dispatch(setError('No microphone detected. Please connect a microphone and try again.'));
        return false;
      }
      
      console.log(`Found ${audioInputDevices.length} audio input devices`);
      return true;
    } catch (error) {
      console.error('Error checking audio devices:', error);
      return false;
    }
  };

  // Call the diagnostic function when component mounts
  useEffect(() => {
    if (open) {
      checkAudioDevices();
    }
  }, [open]);
  
  // Set up audio analysis when mic is active
  useEffect(() => {
    if (!micMuted && session && window.temporaryAudioStream) {
      // Set up audio analysis
      if (!audioContext.current) {
        try {
          // Create audio context
          audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Create analyzer
          analyser.current = audioContext.current.createAnalyser();
          analyser.current.fftSize = 256;
          
          // Create audio source from stream
          microphone.current = audioContext.current.createMediaStreamSource(window.temporaryAudioStream);
          
          // Connect source to analyzer
          microphone.current.connect(analyser.current);
          
          // Set up data array for analysis
          audioDataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
          
          console.log('Audio analysis setup complete');
        } catch (error) {
          console.error('Failed to set up audio analysis:', error);
        }
      }
      
      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyser.current && audioDataArray.current) {
          analyser.current.getByteFrequencyData(audioDataArray.current);
          
          // Calculate average volume level
          const average = audioDataArray.current.reduce((sum, value) => sum + value, 0) / 
                         audioDataArray.current.length;
          
          // Scale to 0-100 for easier use
          const scaledLevel = Math.min(100, Math.max(0, average * 2));
          setAudioLevel(scaledLevel);
        }
        
        // Continue monitoring
        animationFrameId.current = requestAnimationFrame(updateAudioLevel);
      };
      
      // Start the monitoring loop
      updateAudioLevel();
      
    } else {
      // Clean up when mic is muted
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      setAudioLevel(0);
    }
    
    // Clean up on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      if (microphone.current) {
        microphone.current.disconnect();
        microphone.current = null;
      }
      
      if (audioContext.current && audioContext.current.state !== 'closed') {
        // Close audio context when component unmounts
        audioContext.current.close().catch(console.error);
      }
    };
  }, [micMuted, session]);
  
  // If showSettings is true, switch to settings tab
  useEffect(() => {
    if (showSettings) {
      setActiveTab(1);
    } else {
      setActiveTab(0);
    }
  }, [showSettings]);
  
  /**
   * Reset the conversation - clears transcripts and starts a new call
   */
  const handleResetConversation = async () => {
    if (status === VoiceAgentStatus.ACTIVE) {
      // End the current call
      await handleEndCall();
    }
    
    // Clear the transcripts
    dispatch(clearTranscripts());
    
    // Start a new agent
    initializeAgent();
  };
  
  /**
   * Exit call and close dialog
   */
  const handleExitCall = async () => {
    console.log('🔊🔊 EXIT CALL: User clicked Exit Call button');
    try {
      // Get the call ID from Redux before we do anything else
      const currentState = store.getState();
      const callId = currentState.voiceAgent.callId;
      
      if (callId) {
        console.log(`🔊🔊 EXIT CALL: Terminating call ${callId}`);
        
        // First, make sure we're in the right state for proper cleanup
        dispatch(setStatus(VoiceAgentStatus.ENDING));
        
        // Use the SDK method directly to ensure immediate hanging up
        if (session) {
          console.log('🔊🔊 EXIT CALL: Using session directly to leave call');
          try {
            await session.leaveCall();
            console.log('🔊🔊 EXIT CALL: Successfully left call via direct session');
          } catch (sessionError) {
            console.error('🔊🔊 EXIT CALL: Error using direct session.leaveCall():', sessionError);
          }
        }
        
        // Also use the service method for additional cleanup
        try {
          console.log('🔊🔊 EXIT CALL: Using service to end call');
          await voiceAgentService.endCall(callId);
          console.log('🔊🔊 EXIT CALL: Service.endCall completed');
        } catch (serviceError) {
          console.error('🔊🔊 EXIT CALL: Error using service.endCall:', serviceError);
        }
        
        // Clean up audio resources immediately
        if (window.temporaryAudioStream) {
          console.log('🔊🔊 EXIT CALL: Cleaning up temporary audio stream');
          window.temporaryAudioStream.getTracks().forEach(track => {
            track.stop();
            console.log(`🔊🔊 EXIT CALL: Audio track ${track.label} stopped`);
          });
          delete window.temporaryAudioStream;
        }
        
        // Force the active Ultravox session to null in the service
        try {
          console.log('🔊🔊 EXIT CALL: Forcing session cleanup');
          await voiceAgentService.leaveCurrentCall();
          console.log('🔊🔊 EXIT CALL: leaveCurrentCall completed');
        } catch (cleanupError) {
          console.error('🔊🔊 EXIT CALL: Error in leaveCurrentCall:', cleanupError);
        }
        
        // Dispatch event for call ended
        window.dispatchEvent(new CustomEvent('callEnded', { detail: { callId } }));
        console.log('🔊🔊 EXIT CALL: Dispatched callEnded event');
      } else {
        console.warn('🔊🔊 EXIT CALL: No call ID found, but still proceeding with cleanup');
        await voiceAgentService.leaveCurrentCall();
      }
    } catch (error) {
      console.error('🔊🔊 EXIT CALL: Top-level error in handleExitCall:', error);
    } finally {
      // Always reset the Redux state
      dispatch(setStatus(VoiceAgentStatus.IDLE));
      dispatch(setActive(false));
      console.log('🔊🔊 EXIT CALL: Redux state reset to IDLE');
      
      // Always close the dialog
      console.log('🔊🔊 EXIT CALL: Calling onClose to close dialog');
      onClose();
    }
  };
  
  // Get call info from Redux
  const callInfo = useSelector((state: RootState) => state.voiceAgent);

  // Set up cleanup for component unmount
  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      console.log('VoiceAgent component unmounting, performing cleanup');
      
      try {
        // Get current call state
        const currentState = store.getState();
        const currentCallId = currentState.voiceAgent.callId;
        
        // Clean up any active call
        if (currentCallId) {
          console.log(`Component unmounting - terminating call ${currentCallId}`);
          
          // End call on server (don't await to ensure this runs)
          voiceAgentService.endCall(currentCallId)
            .then(() => console.log('Call terminated on server during unmount'))
            .catch(err => console.error('Error ending call on server during unmount:', err));
            
          // End call on client (don't await to ensure this runs)
          voiceAgentService.leaveCurrentCall()
            .then(() => console.log('Client call session cleaned up during unmount'))
            .catch(err => console.error('Error cleaning client session during unmount:', err));
        }
        
        // Clean up audio resources
        if (window.temporaryAudioStream) {
          console.log('Cleaning up temporary audio stream during unmount');
          window.temporaryAudioStream.getTracks().forEach(track => {
            track.stop();
          });
          delete window.temporaryAudioStream;
        }
        
        // Clean up audio context
        if (audioContext.current && audioContext.current.state !== 'closed') {
          audioContext.current.close()
            .then(() => console.log('Audio context closed during unmount'))
            .catch(err => console.error('Error closing audio context during unmount:', err));
        }
        
        // Cancel any animation frames
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        
        // Ensure Redux state is reset
        dispatch(setStatus(VoiceAgentStatus.IDLE));
        dispatch(setActive(false));
        
      } catch (error) {
        console.error('Unexpected error during component unmount cleanup:', error);
      }
    };
  }, []);
  
  /**
   * Validate and format transcripts to ensure they're in the correct format
   */
  const validateTranscripts = (transcripts: any[]): any[] => {
    if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
      return [];
    }
    
    return transcripts.map((transcript: any) => {
      // Skip invalid transcripts
      if (!transcript || !transcript.text) {
        console.warn('Skipping invalid transcript:', transcript);
        return null;
      }
      
      // Ensure each transcript has a valid speaker value (either 'user' or 'agent')
      const speaker = transcript.speaker === 'agent' || transcript.speaker === 'user' 
        ? transcript.speaker 
        : transcript.role === 'ASSISTANT' || transcript.role === 'assistant' ? 'agent' : 'user';
      
      // Ensure each transcript has a valid medium value
      let medium;
      if (typeof transcript.medium === 'string') {
        medium = transcript.medium.toLowerCase() === 'voice' ? Medium.VOICE : Medium.TEXT;
      } else if (transcript.medium === Medium.VOICE || transcript.medium === Medium.TEXT) {
        medium = transcript.medium;
      } else if (transcript.type) {
        medium = transcript.type.toLowerCase() === 'voice' ? Medium.VOICE : Medium.TEXT;
      } else {
        medium = Medium.TEXT; // Default
      }
      
      // Return the validated transcript with consistent structure
      return {
        text: transcript.text,
        speaker,
        medium,
        isFinal: true // Ensure all loaded transcripts are marked as final
      };
    }).filter(Boolean); // Remove any null/invalid entries
  };
  
  // When a call ends, save the transcripts
  useEffect(() => {
    const saveCurrentTranscripts = () => {
      if (transcripts && transcripts.length > 0) {
        // Make sure we save transcripts in a format that can be loaded later
        const formattedTranscripts = transcripts.map(transcript => ({
          text: transcript.text,
          speaker: transcript.speaker === 'agent' || transcript.speaker === 'user' 
            ? transcript.speaker 
            : 'user',
          medium: typeof transcript.medium === 'string' 
            ? transcript.medium 
            : Medium.TEXT,
          isFinal: true // All saved transcripts should be marked as final
        }));
        
        window.savedTranscripts = formattedTranscripts;
        
        try {
          localStorage.setItem('savedTranscripts', JSON.stringify(formattedTranscripts));
          console.log('Saved transcripts to localStorage:', formattedTranscripts.length);
        } catch (e) {
          console.warn('Could not save transcripts to localStorage:', e);
        }
      }
    };

    window.addEventListener('callEnded', saveCurrentTranscripts);
    
    return () => {
      window.removeEventListener('callEnded', saveCurrentTranscripts);
    };
  }, [transcripts]);

  // When transcripts change, check for property listings in text
  useEffect(() => {
    if (transcripts.length > 0) {
      const latestAgentTranscript = [...transcripts]
        .reverse()
        .find(transcript => transcript.speaker === 'agent');
      
      if (latestAgentTranscript) {
        setCurrentText(latestAgentTranscript.text);
        
        // Check if the AI is trying to list properties and intercept
        const text = latestAgentTranscript.text.toLowerCase();
        
        // Only intercept when text clearly indicates property listing
        // Modified to be more specific to avoid false positives on greetings
        const propertyListingIndicators = [
          "i've found some properties",
          "i have found some properties",
          "here are some properties",
          "here are a few options",
          "bedroom apartment in",
          "bedroom villa in",
          "bedroom penthouse in",
          "with a price of $",
          "with a rent of $"
        ];
        
        const isListingProperties = propertyListingIndicators.some(indicator => 
          text.includes(indicator.toLowerCase())
        );
        
        if (isListingProperties) {
          console.log('INTERCEPTED: AI tried to list properties in text. Triggering SearchProperties tool instead.');
          
          // Extract location if possible
          let location = '';
          const locationMatch = text.match(/in\s+([A-Za-z\s]+)\b/);
          if (locationMatch && locationMatch[1]) {
            location = locationMatch[1].trim();
          }
          
          // Force trigger the search properties tool
          const searchCriteria = location ? { location } : { showAll: true };
          
          // Dispatch the executeSearch event directly
          window.dispatchEvent(new CustomEvent("executeSearch", { 
            detail: { criteria: searchCriteria }
          }));
          
          // Generate a dynamic response based on the location
          const getDynamicResponse = (loc?: string) => {
            const responses = [
              "I'm showing you properties",
              "Here are some properties",
              "I've found properties",
              "Let me show you properties",
              "Take a look at these properties"
            ];
            
            const baseResponse = responses[Math.floor(Math.random() * responses.length)];
            
            if (loc) {
              return `${baseResponse} in ${loc} that match your criteria.`;
            } else {
              return `${baseResponse} that match your criteria.`;
            }
          };
          
          // Add a transcript showing we're searching
          dispatch(addTranscript({
            text: getDynamicResponse(location),
            isFinal: true,
            speaker: "agent",
            medium: Medium.TEXT
          }));
          
          // Don't automatically close the dialog here
          // The handleSearchProperties function will determine if closing is appropriate
        }
      }
    }
  }, [transcripts, dispatch]);
  
  // Add event listener for agent-requested hangup
  useEffect(() => {
    const handleAgentHangup = async (event: Event) => {
      console.log('🔊🔊 AGENT HANGUP: Agent requested call termination');
      
      try {
        // Call the exit function that handles both call termination and dialog closure
        await handleExitCall();
        console.log('🔊🔊 AGENT HANGUP: Call terminated and dialog closed');
      } catch (error) {
        console.error('🔊🔊 AGENT HANGUP: Error handling agent hangup:', error);
      }
    };

    // Add event listener
    window.addEventListener('agentRequestedHangup', handleAgentHangup as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('agentRequestedHangup', handleAgentHangup as EventListener);
    };
  }, [handleExitCall]);  // Include handleExitCall in dependencies
  
  // Add the handlers for the property search tools
  const handlePropertyPreferencesUpdate = (preferences: any) => {
    try {
      console.log('Property preferences update received:', preferences);
      
      // Extract the filters object from event.detail.filters
      const filters = preferences.filters || preferences;
      console.log('Extracted filters:', filters);
      
      // Update Redux state with property preferences by dispatching updateFilters event
      window.dispatchEvent(new CustomEvent('updateFilters', { 
        detail: { filters }
      }));
      
    } catch (error) {
      console.error('Error handling property preferences update:', error);
    }
  };

  // Function to handle search properties request
  const handleSearchProperties = (searchData: any) => {
    try {
      console.log('Search properties event received:', searchData);
      
      // Extract the criteria from event.detail.criteria
      const criteria = searchData.criteria || searchData;
      console.log('Extracted search criteria:', criteria);
      
      // IMPORTANT: Add a debugging log to track all calls to this function
      console.log('handleSearchProperties called with:', JSON.stringify(criteria), 
                  'from caller:', new Error().stack);
      
      // Format the criteria to ensure it matches the filter UI expectations
      const formattedCriteria = { ...criteria };
      
      // Import the reference arrays from SearchFilters component 
      // Need to hardcode these since we can't import directly
      const nearbyAmenitiesOptions = [
        "Supermarket", "Metro Station", "School", "Hospital", "Shopping Mall", 
        "Beach", "Restaurant", "Pharmacy", "Gym", "Park", "Airport", "Bus Station"
      ];
      
      const featuresOptions = [
        "Balcony", "Private Pool", "Garden", "Gym", "Smart Home", "Walk-in Closet",
        "Parking", "Concierge", "24/7 Security", "Elevator", "Storage Room", 
        "Maid's Room", "Study Room"
      ];
      
      const propertyTypesOptions = [
        "Apartment", "Villa", "Townhouse", "Penthouse", "Office", 
        "Retail", "Duplex", "Land", "House", "Condo"
      ];
      
      const viewTypesOptions = [
        "Sea View", "City View", "Garden View", "Mountain View", 
        "Pool View", "Lake View", "Golf Course View", "Park View"
      ];
      
      // Format nearbyAmenities to match the exact case of the options in the dropdown
      if (criteria.nearbyAmenities && Array.isArray(criteria.nearbyAmenities)) {
        formattedCriteria.nearbyAmenities = criteria.nearbyAmenities.map((amenity: string) => {
          // Remove "Near " prefix if it exists
          const cleanAmenity = amenity.replace(/^Near\s+/i, '');
          
          // Find matching amenity with correct case from the reference array
          const exactMatchAmenity = nearbyAmenitiesOptions.find(option => 
            option.toLowerCase() === cleanAmenity.toLowerCase()
          );
          
          // Use the exact match if found, otherwise keep the original (but cleaned)
          return exactMatchAmenity || cleanAmenity;
        });
        console.log('Formatted nearbyAmenities for UI with exact case:', formattedCriteria.nearbyAmenities);
      }
      
      // Format selectedFeatures to match the exact case of the options in the dropdown
      if (criteria.selectedFeatures && Array.isArray(criteria.selectedFeatures)) {
        formattedCriteria.selectedFeatures = criteria.selectedFeatures.map((feature: string) => {
          // Find matching feature with correct case from the reference array
          const exactMatchFeature = featuresOptions.find(option => 
            option.toLowerCase() === feature.toLowerCase()
          );
          
          // Use the exact match if found, otherwise keep the original
          return exactMatchFeature || feature;
        });
        console.log('Formatted selectedFeatures for UI with exact case:', formattedCriteria.selectedFeatures);
      }
      
      // Format listingType to exactly match one of the options in the dropdown
      if (criteria.listingType) {
        // Ensure listing type is properly capitalized
        const listingTypeMap: { [key: string]: string } = {
          'for rent': 'For Rent',
          'for sale': 'For Sale',
          'new development': 'New Development',
          'rent': 'For Rent',
          'sale': 'For Sale'
        };
        
        const normalizedType = criteria.listingType.toLowerCase();
        formattedCriteria.listingType = listingTypeMap[normalizedType] || criteria.listingType;
        console.log('Formatted listingType:', formattedCriteria.listingType);
      }
      
      // Format propertyType to match dropdown options exactly
      if (criteria.propertyType) {
        // Find matching property type with correct case from the reference array
        const exactMatchPropertyType = propertyTypesOptions.find(option => 
          option.toLowerCase() === criteria.propertyType.toLowerCase()
        );
        
        // Use the exact match if found, otherwise capitalize first letter
        formattedCriteria.propertyType = exactMatchPropertyType || 
                                         (criteria.propertyType.charAt(0).toUpperCase() + 
                                         criteria.propertyType.slice(1).toLowerCase());
        
        console.log('Formatted propertyType:', formattedCriteria.propertyType);
      }
      
      // Format viewType to match dropdown options exactly
      if (criteria.viewType) {
        // Find matching view type with correct case from the reference array
        const exactMatchViewType = viewTypesOptions.find(option => 
          option.toLowerCase() === criteria.viewType.toLowerCase()
        );
        
        // Use the exact match if found, otherwise keep as is
        formattedCriteria.viewType = exactMatchViewType || criteria.viewType;
        console.log('Formatted viewType:', formattedCriteria.viewType);
      }
      
      // Flag to indicate this is coming from voice search and should update UI
      formattedCriteria.updateUIFilters = true;
      
      // Trigger property search with the formatted criteria
      window.dispatchEvent(new CustomEvent('executeSearch', { 
        detail: { criteria: formattedCriteria }
      }));
      
      // Display user feedback that search is being performed
      dispatch(addTranscript({
        text: "Searching for properties matching your criteria now.",
        isFinal: true,
        speaker: "agent",
        medium: Medium.TEXT
      }));
      
      // Only close the dialog if this is an actual property search (not just a greeting)
      // Check if the criteria has meaningful search parameters with stricter conditions
      const hasSearchCriteria = criteria && (
        (criteria.location && criteria.location.length > 0) || 
        (criteria.propertyType && criteria.propertyType.length > 0) || 
        (criteria.bedrooms && criteria.bedrooms.length > 0) || 
        (criteria.bathrooms && criteria.bathrooms.length > 0) ||
        (typeof criteria.minPrice === 'number' && criteria.minPrice > 0) || 
        (typeof criteria.maxPrice === 'number' && criteria.maxPrice > 0) ||
        criteria.showAll === true
      );
      
      console.log('Has search criteria:', hasSearchCriteria, 'Criteria:', formattedCriteria);
      
      if (hasSearchCriteria) {
        // Close the voice agent dialog after a short delay
        // This gives time for the event to be processed and the transcript to be seen
        console.log('Will close dialog in 1.5 seconds due to property search');
        setTimeout(() => {
          console.log('Closing voice agent dialog after search execution');
          onClose();
        }, 1500);
      } else {
        console.log('Not closing dialog - no search criteria detected or insufficient criteria');
      }
      
    } catch (error) {
      console.error('Error handling property search:', error);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      className={styles.dialog}
      onClose={(event, reason) => {
        console.log('Dialog onClose triggered with reason:', reason);
        // In MUI v5, we can prevent certain close reasons by checking here
        if (reason === 'backdropClick') {
          console.log('Preventing dialog close from backdrop click');
          return; // Don't close on backdrop click
        }
        // Only proceed with close for explicit actions like close button
        handleClose();
      }}
      // Prevent escape key from closing dialog
      disableEscapeKeyDown={true}
    >
      <CustomDialogTitle onClose={handleClose}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">
            Voice Agent
          </Typography>
          {activeTab === 0 && (
            <Typography variant="caption" className={styles.statusText}>
              {renderStatusMessage()}
            </Typography>
          )}
        </Box>
      </CustomDialogTitle>
      
      <Divider />
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="voice agent tabs"
        textColor="inherit"
        className={styles.tabs}
      >
        <Tab label="Agent" />
        <Tab label="Settings" />
      </Tabs>
      
      <DialogContent className={styles.dialogContent}>
        {activeTab === 0 ? (
          // Voice Agent Tab
          isInitializing ? (
            <Box className={styles.loadingContainer}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Initializing voice agent...
              </Typography>
            </Box>
          ) : error ? (
            <Box className={styles.errorContainer}>
              <Typography variant="body1" color="error">
                {error}
              </Typography>
              {error?.includes('microphone') || error?.includes('Microphone') ? (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={requestMicrophoneAccess}
                  sx={{ mt: 2 }}
                >
                  Grant Microphone Access
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={(e) => {
                    e.preventDefault();
                    initializeAgent();
                  }}
                  sx={{ mt: 2 }}
                >
                  Retry
                </Button>
              )}
            </Box>
          ) : (
            // Main voice agent interface
            <>
              <Box className={styles.transcriptContainer}>
                {transcripts.length === 0 ? (
                  <Box className={styles.emptyTranscriptContainer}>
                    <Typography variant="body1" color="textSecondary">
                      Say something like "I am looking for a 3 bedroom apartment in Dubai" to start your search.
                    </Typography>
                  </Box>
                ) : (
                  <Box className={styles.transcriptList}>
                    {transcripts.map((transcript, index) => (
                      <Paper
                        key={index}
                        elevation={1}
                        className={`${styles.transcriptItem} ${
                          transcript.speaker === 'agent' ? styles.agentTranscript : styles.userTranscript
                        }`}
                      >
                        <Typography variant="body1">
                          {transcript.text}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" className={styles.transcriptSpeaker}>
                          {transcript.speaker === 'agent' ? 'Alice' : 'You'}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
              
              <Stack direction="row" spacing={3} className={styles.controls} sx={{ mt: 2 }}>
                <Tooltip title={micMuted ? "Unmute Microphone" : "Mute Microphone"}>
                  <Fab 
                    color={micMuted ? "default" : "primary"} 
                    size="medium" 
                    onClick={handleMicToggle}
                    className={styles.controlButton}
                    sx={{
                      position: 'relative',
                      ...(audioLevel > 5 && !micMuted ? {
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          bottom: -4,
                          left: -4,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          opacity: audioLevel / 200 + 0.5,
                          animation: 'pulse 1.5s infinite',
                        }
                      } : {})
                    }}
                  >
                    {micMuted ? <MicOffIcon /> : <MicIcon />}
                  </Fab>
                </Tooltip>
                
                <Tooltip title={speakerMuted ? "Unmute Speaker" : "Mute Speaker"}>
                  <Fab 
                    color={speakerMuted ? "default" : "primary"} 
                    size="medium" 
                    onClick={handleSpeakerToggle}
                    className={styles.controlButton}
                  >
                    {speakerMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  </Fab>
                </Tooltip>
              </Stack>

              <Box mt={2} display="flex" justifyContent="space-between" className={styles.conversationControls}>
                <Button 
                  startIcon={<RestartIcon />}
                  onClick={handleResetConversation}
                  className={styles.actionButton}
                  variant="outlined"
                  size="small"
                >
                  Reset Conversation
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<ExitIcon />}
                  onClick={handleExitCall}
                  className={`${styles.actionButton} ${styles.exitButton}`}
                  size="small"
                >
                  Exit Call
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />
            </>
          )
        ) : (
          // Settings Tab
          <VoiceAgentSettings open={true} onClose={() => setActiveTab(0)} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAgent; 