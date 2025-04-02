import axios from 'axios';
import { UltravoxSession, Medium } from 'ultravox-client';
import { API_BASE_URL } from '../utils/CONSTANTS';
import { updateOrderTool, orderCheckoutTool, hangUpTool, propertySearchTool } from './clientTools';
import { store } from '../store/store';

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
You are an AI voice agent for a real estate company. Your job is to help customers find properties based on their preferences.

Here are some guidelines:
1. Greet the customer warmly and ask how you can help them find their ideal property
2. When a customer searches for properties, use the "propertySearch" tool with their query
3. Help them search for properties based on:
   - Location (e.g., Dubai Marina, Palm Jumeirah)
   - Property type (apartment, villa, etc.)
   - Number of bedrooms and bathrooms
   - Price range
   - Rental vs Sale
   - Amenities
4. Listen carefully to their preferences and use the propertySearch tool to find matching properties
5. After showing search results, help answer questions about specific properties
6. If no properties match their criteria, suggest alternatives or ask them to modify their search
7. Be professional, friendly, and helpful
8. Stay engaged in the conversation and ask if they need to search for other properties
9. When the customer asks to end the call or hang up:
   - Thank them for their interest
   - Call the "hangUp" tool
   - Wait for confirmation that the call has ended
   - Do not start a new conversation after hanging up

Remember to:
- Be patient and professional
- Use the propertySearch tool whenever the user is looking for properties
- Provide clear, organized property information
- Help refine searches if initial results don't match preferences
- Maintain a helpful and knowledgeable demeanor

## Tool Usage Rules
- Call "propertySearch" when:
  - The user asks to find or search for properties
  - The user specifies property criteria
  - The user wants to see properties in a specific location

- Call "hangUp" when:
  - The user asks to end the call
  - The user says goodbye or indicates they're done
  - You're about to end the call yourself
`;

/**
 * Fetch available voices from the Ultravox API
 */
export const fetchAvailableVoices = async (): Promise<VoiceOption[]> => {
  try {
    console.log("Fetching available voices...");
    const response = await axios.get(
      `${API_BASE_URL}/api/voice-agent/voices`
    );
    
    console.log("Voice API response:", response.data);
    
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      // Transform the voice data into options format
      const voiceOptions = response.data.results.map((voice: any) => ({
        value: voice.voiceId,
        label: voice.name,
        description: voice.description
      }));
      
      console.log("Transformed voice options:", voiceOptions);
      return voiceOptions;
    }
    
    console.log("Using DEFAULT_VOICE_OPTIONS as fallback");
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
 * Create a new call to the Ultravox API via our backend proxy
 * @param initialMessages Optional array of previous conversation messages to provide context
 * @param priorCallId Optional ID of a previous call to resume
 */
export const createVoiceAgentCall = async (initialMessages?: Array<any>, priorCallId?: string) => {
  try {
    // Get settings from Redux store
    const systemPrompt = getSystemPrompt();
    const voiceModel = getVoiceModel();
    const state = store.getState();
    const settings = state.voiceAgentSettings;

    // Use the user's selected voice, or DEFAULT_VOICE_ID if none is set
    const voice = settings.voice || DEFAULT_VOICE_ID;
    console.log(`Using voice: ${voice}`);

    // Prepare the request payload
    const payload: any = {
      model: voiceModel,
      voice: voice,
      systemPrompt: systemPrompt,
      temperature: settings.temperature,
      recordingEnabled: settings.enableCallRecording,
      selectedTools: [
        {
          temporaryTool: {
            modelToolName: "propertySearch",
            description: "Search for properties based on user's criteria",
            dynamicParameters: [
              {
                name: "query",
                location: "PARAMETER_LOCATION_BODY",
                schema: {
                  type: "string",
                  description: "The search query with the user's property criteria"
                },
                required: true
              }
            ],
            client: {}
          }
        },
        {
          temporaryTool: {
            modelToolName: "hangUp",
            description: "End the current call and close the conversation window",
            client: {}
          }
        }
      ],
      // Add inactivity settings to automatically end call after periods of silence
      inactivityMessages: [
        {
          "duration": "30s",
          "message": "Are you still there? I can help you find real estate properties that match your preferences."
        },
        {
          "duration": "15s",
          "message": "If there's nothing else you need at the moment, I'll end this call."
        },
        {
          "duration": "10s",
          "message": "Thank you for calling Global Estates. Have a great day. Goodbye.",
          "endBehavior": "END_BEHAVIOR_HANG_UP_SOFT"
        }
      ]
    };

    // If priorCallId is NOT provided but initialMessages are, use the formatted messages
    if (!priorCallId && initialMessages && initialMessages.length > 0) {
      try {
        console.log('Using initial messages without priorCallId.');
        
        // Format the messages in a structured way that our backend can parse correctly
        const formattedMessages = initialMessages.map(msg => {
          if (!msg.text) {
            console.warn('Message missing text:', msg);
            return null;
          }
          
          return {
            role: msg.speaker === 'agent' ? 'assistant' : 'user',
            content: msg.text
          };
        }).filter(Boolean);
        
        if (formattedMessages.length > 0) {
          payload.messages = formattedMessages;
          console.log('Sending messages with proper format:', JSON.stringify(formattedMessages));
        }
      } catch (error) {
        console.error('Error formatting messages:', error);
      }
    }

    // If priorCallId is provided, add it to the payload
    // if (priorCallId) {
    //   payload.priorCallId = priorCallId;
    // }

    // Log the final payload for debugging
    console.log('Sending payload to create call:', JSON.stringify(payload, null, 2));

    // Make the API call to create a new voice agent call
    const response = await axios.post(
      `${API_BASE_URL}/api/voice-agent/calls`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error('Error creating voice agent call:', error);
    throw error;
  }
};

/**
 * Get call information from the Ultravox API via our backend proxy
 */
export const getCallInfo = async (callId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/voice-agent/calls/${callId}`
    );
    
    return response.data;
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
    
    // Register both tools immediately
    uvSession.registerToolImplementation('hangUp', hangUpTool);
    uvSession.registerToolImplementation('propertySearch', propertySearchTool);
    
    console.log('Ultravox session initialized with hangUp and propertySearch tools registered');
  }
  return uvSession;
};

// Check if the propertySearchTool is defined
const hasPropertySearch = typeof propertySearchTool === 'function';

// Register tool implementations with the Ultravox session
export const registerToolImplementations = () => {
  if (!uvSession) {
    console.error('Cannot register tools - session is not initialized');
    return;
  }
  
  console.log('Registering tool implementations with Ultravox...');
  
  // Register both hangUp and propertySearch tools
  if (hasPropertySearch) {
    console.log('Registering propertySearch tool implementation');
    uvSession.registerToolImplementation('propertySearch', propertySearchTool);
  } else {
    console.warn('propertySearch tool not available for registration - check if it exists in clientTools.ts');
  }
  
  console.log('Registering hangUp tool implementation');
  uvSession.registerToolImplementation('hangUp', hangUpTool);
  
  // Log all registered tools
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