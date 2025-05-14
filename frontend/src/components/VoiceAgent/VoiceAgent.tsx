import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Button,
  Stack,
  Fab,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
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
import voiceAgentService from '../../services/voiceAgentService';
import { AppDispatch } from '../../store/store';
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
  const dispatch = useDispatch<AppDispatch>();
  
  const { status, transcripts, error } = useSelector((state: RootState) => state.voiceAgent);
  // Placeholder for settings - these would ideally come from a config or a simplified local state if needed
  // const hardcodedSettings = { // REMOVED as it's unused
  //   voice: 'Emily-English', // Default voice
  //   temperature: 0.7,
  //   enableCallRecording: false,
  //   customSystemPrompt: ''
  //   // voiceModel is handled by voiceAgentService directly now
  // };

  const [isInitializing, setIsInitializing] = useState(false);
  const [session, setSession] = useState<UltravoxSession | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(showSettings ? 1 : 0);
  
  // Add audio level detection
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioDataArray = useRef<Uint8Array | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Session ref to access the current session in effects
  const sessionRef = useRef<UltravoxSession | null>(null);
  
  // Update sessionRef when session changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Add a useEffect specifically for checking tool registrations
  useEffect(() => {
    if (session) {
      console.log('🔊 VoiceAgent: Checking tool registrations with session');
      // Force re-register tools to ensure they're properly set up
      voiceAgentService.registerToolImplementations();
      
      // Log registered tools (if the API exposes this)
      if (session.hasOwnProperty('toolImplementations')) {
        console.log('🔊 VoiceAgent: Registered tools:', Object.keys((session as any).toolImplementations || {}));
      }
    }
  }, [session]);
  
  // Initialize and clean up the agent when the dialog opens/closes
  useEffect(() => {
    if (open) {
      // Always reset the conversation when the dialog opens
      dispatch(resetAgent());
      dispatch(clearTranscripts());
      
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
    } else {
      // Clean up if the dialog closes
      if (status === VoiceAgentStatus.ACTIVE || status === VoiceAgentStatus.CONNECTED || status === VoiceAgentStatus.INITIALIZING || status === VoiceAgentStatus.CONNECTING) {
        handleEndCall();
      }
    }
    
    return () => {
      if (status === VoiceAgentStatus.ACTIVE || status === VoiceAgentStatus.CONNECTED || status === VoiceAgentStatus.INITIALIZING || status === VoiceAgentStatus.CONNECTING) {
        handleEndCall();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // dispatch, resetAgent, clearTranscripts, initializeAgent, handleEndCall, status were implicitly dependencies remove them to avoid loops
  
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
      
      // Store the new call ID for future use
      const newCallId = callData.callId;
      window.lastCallId = newCallId;
      sessionStorage.setItem('lastVoiceAgentCallId', newCallId);
      localStorage.setItem('lastVoiceAgentCallId', newCallId);
      
      // Store call info in Redux
      dispatch(setCallInfo({
        callId: callData.callId,
        joinUrl: callData.joinUrl
      }));
      
      // Initialize the Ultravox session
      const newSession = voiceAgentService.initializeUltravoxSession();
      
      // Register tool implementations
      voiceAgentService.registerToolImplementations();
      
      // Join the call
      voiceAgentService.joinCall(callData.joinUrl);
      
      // Set the session
      setSession(newSession);
      
      // Set active state
      dispatch(setActive(true));
      
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
      
      setIsInitializing(false);
    } catch (error) {
      console.error('Error initializing voice agent:', error);
      dispatch(setError('Failed to initialize voice agent. Please try again.'));
      setIsInitializing(false);
    }
  };
  
  const handleSessionStatus = (/*event: Event*/) => {
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
  
  const handleTranscripts = async (/*event: Event*/) => {
    if (session) {
      // Get all transcripts from the session
      const ultravoxTranscripts = session.transcripts;
      
      // Process both agent and user transcripts
      if (ultravoxTranscripts.length > 0) {
        // Clear existing transcripts and rebuild the list
        dispatch(clearTranscripts());
        
        // Add all final transcripts
        ultravoxTranscripts
          .filter(transcript => transcript.isFinal)
          .forEach(transcript => {
            let medium: Medium;
            if (transcript.medium === 'voice') {
              medium = Medium.VOICE;
            } else {
              medium = Medium.TEXT;
            }
            
            dispatch(addTranscript({
              text: transcript.text,
              isFinal: transcript.isFinal,
              speaker: transcript.speaker,
              medium: medium
            }));
          });
          
        // Then, add the latest non-final transcript from the user (if it exists)
        const latestUserNonFinal = [...ultravoxTranscripts]
          .reverse()
          .find(transcript => transcript.speaker === 'user' && !transcript.isFinal);
          
        if (latestUserNonFinal) {
          let medium: Medium;
          if (latestUserNonFinal.medium === 'voice') {
            medium = Medium.VOICE;
          } else {
            medium = Medium.TEXT;
          }
          
          dispatch(addTranscript({
            text: latestUserNonFinal.text,
            isFinal: latestUserNonFinal.isFinal,
            speaker: latestUserNonFinal.speaker,
            medium: medium
          }));
        }
        
        // Finally, add the latest non-final transcript from the agent (if it exists)
        const latestAgentNonFinal = [...ultravoxTranscripts]
          .reverse()
          .find(transcript => transcript.speaker === 'agent' && !transcript.isFinal);
        
        if (latestAgentNonFinal) {
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
      
      // Clean up
      return () => {
        session.removeEventListener('status', handleSessionStatus);
        session.removeEventListener('transcripts', handleTranscripts);
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
  // const callInfo = useSelector((state: RootState) => state.voiceAgent);

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

  // Add event listener for agent-requested hangup
  useEffect(() => {
    const handleAgentHangup = async (/*event: Event*/) => {
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
    window.addEventListener('agentRequestedHangup', handleAgentHangup);

    // Cleanup
    return () => {
      window.removeEventListener('agentRequestedHangup', handleAgentHangup);
    };
  }, []);  // Empty dependency array since we don't need any props/state
  
  // Add effect for handling property search results
  useEffect(() => {
    const handlePropertySearchResults = (event: any) => {
      try {
        console.log('🏠 Received property search results event:', event);
        const { results, search_parameters, resolved_location /*, no_results_reason*/ } = event.detail; // no_results_reason unused
        
        // Validate results
        if (!results || !Array.isArray(results)) {
          console.error('🏠 Invalid property search results received:', results);
          return;
        }
        
        console.log('🏠 Setting property results:', results.length, 'properties');
        console.log('🏠 Setting search parameters:', search_parameters);
        console.log('🏠 Setting resolved location:', resolved_location);
        
        // Create a text representation of the properties
        let propertiesText = `## ${results.length} Properties Found\n\n`;
        
        if (resolved_location) {
          propertiesText += `**Location**: ${resolved_location}\n\n`;
        }
        
        results.forEach((property, index) => {
          propertiesText += `### Property ${index + 1}\n`;
          propertiesText += `- **Type**: ${property.property_type} in ${property.location}\n`;
          propertiesText += `- **Price**: ${property.price_display}${property.is_rental ? ' (Rental)' : ' (For Sale)'}\n`;
          propertiesText += `- **Size**: ${property.area_display}\n`;
          propertiesText += `- **Bedrooms**: ${property.bedrooms}, **Bathrooms**: ${property.bathrooms}\n`;
          
          if (property.amenities) {
            propertiesText += `- **Amenities**: ${property.amenities}\n`;
          }
          
          propertiesText += `- **Available from**: ${property.available_from}\n\n`;
        });
        
        // Add a system message with the formatted property list
        dispatch(addTranscript({
          text: propertiesText,
          isFinal: true,
          speaker: "agent",
          medium: Medium.TEXT
        }));
        
        console.log('🏠 Property results displayed as text in the transcript');
      } catch (error) {
        console.error('🏠 Error handling property search results:', error);
      }
    };

    window.addEventListener('propertySearchResults', handlePropertySearchResults);
    return () => {
      window.removeEventListener('propertySearchResults', handlePropertySearchResults);
    };
  }, [dispatch]);

  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      className={styles.dialog}
      onClose={(/*event, reason*/) => {
        handleClose();
      }}
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
                      Say something like "Show me properties for rent in Dubai Marina" or "Find villas for sale in Palm Jumeirah" to start searching.
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
                        <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
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
          <Box p={3}><Typography>Settings will be configured here later.</Typography></Box> // Placeholder
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceAgent; 