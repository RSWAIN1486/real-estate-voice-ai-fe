import axios from 'axios';
import { UltravoxSession, Medium } from 'ultravox-client';
import { ULTRAVOX_BASE_URL, FRONTEND_ONLY_MODE } from '../utils/CONSTANTS';
import { hangUpTool } from './clientTools';
import { store } from '../store/store';

// Add these environment variables at the top of the file
const ULTRAVOX_API_KEY = import.meta.env.VITE_ULTRAVOX_API_KEY;
const ULTRAVOX_AGENT_ID = import.meta.env.VITE_ULTRAVOX_AGENT_ID;

// Default voice options with preselected female voice
export const DEFAULT_VOICE_ID = 'Emily-English'; // Default to Emily-English

// Available voice options based on the available Ultravox voices
export interface VoiceOption {
  value: string;
  label: string;
  description?: string;
}

export const DEFAULT_VOICE_OPTIONS: VoiceOption[] = [
  { value: 'Emily-English', label: 'Emily-English', description: 'Female English voice' },
  { value: 'Steve-English-Australian', label: 'Steve-English-Australian', description: 'Male Australian English voice' },
  { value: 'Tanya-English', label: 'Tanya-English', description: 'Female English voice' },
  { value: 'Aaron-English', label: 'Aaron-English', description: 'Male English voice' },
  { value: 'echo', label: 'Echo', description: 'Female English voice (OpenAI)' },
  { value: 'nova', label: 'Nova', description: 'Female English voice (OpenAI)' },
  { value: 'shimmer', label: 'Shimmer', description: 'Female English voice (OpenAI)' },
  { value: 'fable', label: 'Fable', description: 'Male English voice (OpenAI)' },
  { value: 'onyx', label: 'Onyx', description: 'Male English voice (OpenAI)' },
  { value: 'alloy', label: 'Alloy', description: 'Neutral English voice (OpenAI)' }
];

// System prompt for real estate property search
export const SYSTEM_PROMPT = `
You are an AI voice agent for a real estate company. Your role is to help customers find properties based on their preferences using your knowledge.

Core Functions:
1. Answer property queries based on:
   - Location
   - Property type
   - Bedrooms/bathrooms
   - Price range
   - Rental vs Sale
   - Amenities

Response Guidelines:
1. For property searches:
   - Provide brief property summaries with location, price, and key features
   - Only detail specific amenities when asked
   - Suggest 2-3 matching properties initially
   - Offer alternatives if no exact matches

2. Communication:
   - Keep responses concise and relevant
   - Ask clarifying questions when needed
   - End conversations professionally when requested

Tool Usage:
- Use "hangUp" tool when:
  - User requests to end call
  - Conversation naturally concludes
`;

/**
 * Fetch available voices from the Ultravox API
 */
export const fetchAvailableVoices = async (): Promise<VoiceOption[]> => {
  try {
    console.log("Fetching available voices...");
    
    // In frontend-only mode, just return the default voices
    // since we don't have direct access to the Ultravox voices API
    console.log("Using DEFAULT_VOICE_OPTIONS in frontend-only mode");
    return DEFAULT_VOICE_OPTIONS;
  } catch (error) {
    console.error('Error fetching available voices:', error);
    console.log("Using DEFAULT_VOICE_OPTIONS due to error");
    return DEFAULT_VOICE_OPTIONS;
  }
};

/**
 * Get the system prompt based on voice agent settings
 */
export const getSystemPrompt = () => {
  const state = store.getState();
  const settings = state.voiceAgentSettings;

  // If custom prompt is empty, return the default
  if (!settings.customSystemPrompt) {
    return SYSTEM_PROMPT;
  }

  // Return custom system prompt
  return settings.customSystemPrompt;
};

/**
 * Get the voice model based on voice agent settings
 */
export const getVoiceModel = () => {
  const state = store.getState();
  const settings = state.voiceAgentSettings;
  
  return settings.voiceModel;
};

/**
 * Create a new call directly to the Ultravox Agent API without using our backend
 * @param initialMessages Optional array of previous conversation messages to provide context
 * @param priorCallId Optional ID of a previous call to resume
 */
export const createAgentCallDirect = async (initialMessages?: Array<any>, priorCallId?: string) => {
  try {
    // Check if API key and agent ID are available
    if (!ULTRAVOX_API_KEY || !ULTRAVOX_AGENT_ID) {
      throw new Error('Ultravox API key or agent ID not configured. Please set VITE_ULTRAVOX_API_KEY and VITE_ULTRAVOX_AGENT_ID in your environment.');
    }

    // Get settings from Redux store
    const state = store.getState();
    const settings = state.voiceAgentSettings;

    // Use the user's selected voice, or DEFAULT_VOICE_ID if none is set
    const voice = settings.voice || DEFAULT_VOICE_ID;
    console.log(`Using voice: ${voice}`);

    // Prepare the request payload
    const payload: any = {
      templateContext: {},
      initialOutputMedium: "MESSAGE_MEDIUM_VOICE",
      recordingEnabled: settings.enableCallRecording,
      medium: {
        webRtc: {}
      },
      firstSpeakerSettings: {
        agent: {
          text: "Hello, I'm your real estate assistant. How can I help you find your ideal property today?",
          uninterruptible: true
        }
      }
    };

    // If priorCallId is provided, use it as a query parameter
    // Use the Vite proxy path instead of direct Ultravox URL to avoid CORS issues
    let url = `/ultravox-api/api/agents/${ULTRAVOX_AGENT_ID}/calls`;
    if (priorCallId) {
      url += `?priorCallId=${priorCallId}`;
    }

    // If initialMessages are provided, format and include them
    if (initialMessages && initialMessages.length > 0 && !priorCallId) {
      try {
        const formattedMessages = initialMessages.map(msg => {
          if (!msg.text) {
            console.warn('Message missing text:', msg);
            return null;
          }
          
          return {
            role: msg.speaker === 'agent' ? 'MESSAGE_ROLE_AGENT' : 'MESSAGE_ROLE_USER',
            text: msg.text,
            medium: msg.medium === 'voice' ? 'MESSAGE_MEDIUM_VOICE' : 'MESSAGE_MEDIUM_TEXT'
          };
        }).filter(Boolean);
        
        if (formattedMessages.length > 0) {
          payload.initialMessages = formattedMessages;
        }
      } catch (error) {
        console.error('Error formatting messages:', error);
      }
    }

    // Log the final payload for debugging
    console.log('Sending payload directly to Ultravox Agent API via proxy:', JSON.stringify(payload, null, 2));

    // Make the API call through our Vite proxy
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ULTRAVOX_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ultravox API error (${response.status}): ${errorText}`);
    }

    // Get the response data
    const data = await response.json();
    
    // Fix the joinUrl to use the proxy as well
    if (data.joinUrl) {
      // Replace the original Ultravox API URL with our proxy URL
      data.joinUrl = data.joinUrl.replace(
        'https://api.ultravox.ai', 
        window.location.origin + '/ultravox-api'
      );
      console.log('Modified joinUrl to use proxy:', data.joinUrl);
    }

    return data;
  } catch (error) {
    console.error('Error creating voice agent call directly:', error);
    throw error;
  }
};

/**
 * Create a new call to the Ultravox API directly
 * @param initialMessages Optional array of previous conversation messages to provide context
 * @param priorCallId Optional ID of a previous call to resume
 */
export const createVoiceAgentCall = async (initialMessages?: Array<any>, priorCallId?: string) => {
  try {
    // Always use direct API call in frontend-only mode
    console.log('Using frontend-only mode: calling Ultravox Agent API directly');
    return await createAgentCallDirect(initialMessages, priorCallId);
  } catch (error) {
    console.error('Error creating voice agent call:', error);
    throw error;
  }
};

/**
 * Get call information from the Ultravox API directly
 */
export const getCallInfo = async (callId: string) => {
  try {
    // Use the Vite proxy to avoid CORS issues
    const response = await fetch(`/ultravox-api/api/calls/${callId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ultravox API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting call info:', error);
    throw error;
  }
};

/**
 * End a call using only the Ultravox SDK with multiple safeguards
 */
export const endCall = async (callId: string) => {
  console.log(`🔊🔊 ENDCALL SERVICE: Starting hangup process for call ID: ${callId}`);
  
  try {
    if (!uvSession) {
      console.log('🔊🔊 ENDCALL SERVICE: No active session found to end');
      return { status: "success", callEnded: true, message: "No active session to end" };
    }
    
    console.log(`🔊🔊 ENDCALL SERVICE: Using SDK's leaveCall method to end the call`);
    
    // First try to leave the call through the SDK directly
    try {
      // Try immediate termination with a timeout
      const leavePromise = uvSession.leaveCall();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('leaveCall timeout')), 2000);
      });
      
      // Race the promises to ensure we don't hang
      await Promise.race([leavePromise, timeoutPromise])
        .catch(error => {
          console.warn('🔊🔊 ENDCALL SERVICE: leaveCall timed out or failed:', error);
        });
      
      console.log('🔊🔊 ENDCALL SERVICE: Successfully executed leaveCall via Ultravox SDK');
    } catch (leaveError) {
      console.error('🔊🔊 ENDCALL SERVICE: Error in uvSession.leaveCall():', leaveError);
      // Continue execution - we'll try other methods
    }
    
    // Force terminate any media connections that might be keeping the call alive
    try {
      // Access peerConnection using type assertion
      const session = uvSession as any;
      if (session.peerConnection) {
        console.log('🔊🔊 ENDCALL SERVICE: Found active peer connection, forcing close');
        session.peerConnection.close();
        console.log('🔊🔊 ENDCALL SERVICE: Peer connection closed');
      }
    } catch (peerError) {
      console.error('🔊🔊 ENDCALL SERVICE: Error closing peer connection:', peerError);
    }
    
    // Dispatch callEnded event to notify other parts of the application
    window.dispatchEvent(new CustomEvent('callEnded', { detail: { callId } }));
    console.log('🔊🔊 ENDCALL SERVICE: Dispatched callEnded event with callId:', callId);
    
    // Reset our session reference
    const oldSession = uvSession;
    uvSession = null;
    console.log('🔊🔊 ENDCALL SERVICE: Reset uvSession to null');
    
    // Try one last method to forcibly clean up the session
    try {
      // Access destroy method using type assertion
      const session = oldSession as any;
      if (session && typeof session.destroy === 'function') {
        console.log('🔊🔊 ENDCALL SERVICE: Found destroy method, calling it as last resort');
        session.destroy();
        console.log('🔊🔊 ENDCALL SERVICE: Successfully called destroy');
      }
    } catch (destroyError) {
      console.error('🔊🔊 ENDCALL SERVICE: Error in destroy() method:', destroyError);
    }
    
    return { status: "success", callEnded: true, message: "Call ended successfully" };
  } catch (error) {
    console.error('🔊🔊 ENDCALL SERVICE: Error ending call via SDK:', error);
    
    // Even if there was an error, set uvSession to null
    uvSession = null;
    console.log('🔊🔊 ENDCALL SERVICE: Reset uvSession to null despite error');
    
    // Still dispatch callEnded event as we're considering the call ended
    window.dispatchEvent(new CustomEvent('callEnded', { detail: { callId, error: true } }));
    console.log('🔊🔊 ENDCALL SERVICE: Dispatched callEnded event despite error');
    
    return { status: "error", callEnded: true, message: "Error ending call, but session has been cleared" };
  }
};

// Create and initialize the Ultravox client session
let uvSession: UltravoxSession | null = null;

export const initializeUltravoxSession = () => {
  if (!uvSession) {
    uvSession = new UltravoxSession();
    uvSession.registerToolImplementation('hangUp', hangUpTool);
    console.log('Ultravox session initialized with hangUp tool registered');
  }
  return uvSession;
};

export const registerToolImplementations = () => {
  if (!uvSession) {
    console.error('Cannot register tools - session is not initialized');
    return;
  }
  console.log('Registering hangUp tool implementation with Ultravox...');
  uvSession.registerToolImplementation('hangUp', hangUpTool);
  const registeredTools = Object.keys((uvSession as any).toolImplementations || {});
  console.log(`Currently registered tools: ${registeredTools.join(', ')}`);
};

export const joinCall = (joinUrl: string) => {
  try {
    console.log('Joining Ultravox call with URL:', joinUrl);
    if (!uvSession) {
      console.log('No session found, initializing new Ultravox session');
      uvSession = initializeUltravoxSession();
    }
    
    // If we're in frontend-only mode, ensure the URL uses the original Ultravox domain
    // because the Ultravox SDK expects the real domain, not our proxy
    if (FRONTEND_ONLY_MODE && joinUrl.includes('/ultravox-api')) {
      joinUrl = joinUrl.replace(
        window.location.origin + '/ultravox-api', 
        'https://api.ultravox.ai'
      );
      console.log('Modified joinUrl to use original domain for SDK:', joinUrl);
    }
    
    uvSession.joinCall(joinUrl);
    console.log('Successfully joined call');
    
    // Ensure microphone is unmuted when joining
    setTimeout(() => {
      if (uvSession && uvSession.isMicMuted) {
        console.log('Ensuring microphone is unmuted after join');
        uvSession.unmuteMic();
      }
    }, 1000);
    
    return uvSession;
  } catch (error) {
    console.error('Error joining call:', error);
    throw error;
  }
};

/**
 * Leave the current call and clean up resources with multiple safeguards
 */
export const leaveCurrentCall = async () => {
  console.log('🔊🔊 LEAVE CALL SERVICE: Starting force cleanup process');
  
  try {
    if (!uvSession) {
      console.log('🔊🔊 LEAVE CALL SERVICE: No active session to leave');
      return true;
    }
    
    console.log('🔊🔊 LEAVE CALL SERVICE: Active session found, forcing termination');
    
    // First try to leave the call through the SDK
    try {
      await uvSession.leaveCall();
      console.log('🔊🔊 LEAVE CALL SERVICE: Successfully left call via SDK');
    } catch (leaveError) {
      console.error('🔊🔊 LEAVE CALL SERVICE: Error in leaveCall:', leaveError);
      // Continue execution even if this fails
    }
    
    // Try to directly close any peer connections that might be keeping the call alive
    try {
      // Access peerConnection using type assertion
      const session = uvSession as any;
      if (session.peerConnection) {
        console.log('🔊🔊 LEAVE CALL SERVICE: Found active peer connection, forcing close');
        session.peerConnection.close();
        console.log('🔊🔊 LEAVE CALL SERVICE: Peer connection closed');
      }
    } catch (peerError) {
      console.error('🔊🔊 LEAVE CALL SERVICE: Error closing peer connection:', peerError);
    }
    
    // Try one last method to forcibly clean up the session
    try {
      // Access destroy method using type assertion
      const session = uvSession as any;
      if (typeof session.destroy === 'function') {
        console.log('🔊🔊 LEAVE CALL SERVICE: Found destroy method, calling it as last resort');
        session.destroy();
        console.log('🔊🔊 LEAVE CALL SERVICE: Successfully called destroy');
      }
    } catch (destroyError) {
      console.error('🔊🔊 LEAVE CALL SERVICE: Error in destroy() method:', destroyError);
    }
    
    // Final step - completely replace the session reference
    const oldSession = uvSession;
    uvSession = null;
    console.log('🔊🔊 LEAVE CALL SERVICE: Reset session reference to null');
    
    // Dispatch event for any listeners
    window.dispatchEvent(new CustomEvent('callEnded'));
    console.log('🔊🔊 LEAVE CALL SERVICE: Dispatched callEnded event');
    
    return true;
  } catch (error) {
    console.error('🔊🔊 LEAVE CALL SERVICE: Error in leaveCurrentCall:', error);
    
    // Force reset the session even if there was an error
    uvSession = null;
    console.log('🔊🔊 LEAVE CALL SERVICE: Reset session reference despite error');
    
    // Still dispatch event
    window.dispatchEvent(new CustomEvent('callEnded', { detail: { error: true } }));
    
    return false;
  }
};

export const setOutputMedium = (medium: Medium) => {
  if (uvSession) {
    uvSession.setOutputMedium(medium);
  }
};

export const sendText = (text: string) => {
  if (uvSession) {
    uvSession.sendText(text);
  }
};

export const muteMic = () => {
  try {
    console.log('Muting microphone in Ultravox session');
    if (uvSession) {
      uvSession.muteMic();
      console.log('Microphone muted successfully');
      return true;
    } else {
      console.error('Cannot mute mic: No active Ultravox session');
      return false;
    }
  } catch (error) {
    console.error('Error muting microphone:', error);
    return false;
  }
};

export const unmuteMic = () => {
  try {
    console.log('Unmuting microphone in Ultravox session');
    if (uvSession) {
      uvSession.unmuteMic();
      console.log('Microphone unmuted successfully');
      return true;
    } else {
      console.error('Cannot unmute mic: No active Ultravox session');
      return false;
    }
  } catch (error) {
    console.error('Error unmuting microphone:', error);
    return false;
  }
};

export const muteSpeaker = () => {
  if (uvSession) {
    uvSession.muteSpeaker();
  }
};

export const unmuteSpeaker = () => {
  if (uvSession) {
    uvSession.unmuteSpeaker();
  }
};

export const isMicMuted = () => {
  return uvSession ? uvSession.isMicMuted : false;
};

export const isSpeakerMuted = () => {
  return uvSession ? uvSession.isSpeakerMuted : false;
};

export default {
  createVoiceAgentCall,
  getCallInfo,
  endCall,
  initializeUltravoxSession,
  registerToolImplementations,
  joinCall,
  leaveCurrentCall,
  setOutputMedium,
  sendText,
  muteMic,
  unmuteMic,
  muteSpeaker,
  unmuteSpeaker,
  isMicMuted,
  isSpeakerMuted,
  fetchAvailableVoices
}; 