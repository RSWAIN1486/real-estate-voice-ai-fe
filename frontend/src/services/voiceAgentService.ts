import axios from 'axios';
import { UltravoxSession, Medium } from 'ultravox-client';
import { API_BASE_URL } from '../utils/CONSTANTS';
import { updateOrderTool, orderCheckoutTool, hangUpTool, updatePreferencesTool, searchPropertiesTool } from './clientTools';
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

// Pizza ordering system prompt 
export const SYSTEM_PROMPT = `
You are an AI voice agent for Global Estates. Your job is to help customers find properties that match their criteria.

Here are some guidelines:
1. Greet the customer with the voice name assigned warmly and ask what they would like to search for
2. Ask for specific details about their property search such as location, bedrooms, price range, etc.
3. Recommend properties based on their criteria and suggest alternatives if needed
4. Answer any questions about properties, neighborhood amenities, or the buying/renting process
5. Be helpful, professional, and enthusiastic about finding them their perfect property

You have access to the following real estate information:

Property Types:
- Apartment: Residential units within a building with shared common areas
- Villa: Detached houses with private gardens and often high-end amenities
- Penthouse: Top-floor luxury apartments with premium views and features
- Townhouse: Multi-floor homes sharing walls with adjacent properties
- Duplex: Two-story homes with separate entrances for each floor

Locations:
- Dubai Marina: Waterfront community with high-rise towers and marina views
- Downtown Dubai: Central district featuring Burj Khalifa and Dubai Mall
- Palm Jumeirah: Iconic palm-shaped artificial island with luxury properties
- Arabian Ranches: Family-friendly villa community with golf course
- Jumeirah Lake Towers (JLT): Mixed-use development with residential towers
- Business Bay: Commercial and residential area near Dubai Canal
- Jumeirah Beach Residence (JBR): Beachfront community with apartments
- Dubai Hills Estate: New development with luxury villas and apartments
- Mirdif: Affordable family-friendly area with villas and townhouses
- Damac Hills: Integrated community with Trump International Golf Club

Features:
- Balcony/Terrace: Outdoor space directly accessible from the property
- Swimming Pool: Private or communal swimming facility
- Gym: Private or communal fitness facility
- Parking: Dedicated parking space(s) for residents
- Security: 24/7 security service, CCTV, or gated community
- Sea View: Property offers views of the sea
- City View: Property offers views of the city skyline
- Garden: Private or communal garden areas
- Smart Home: Property equipped with smart technology features
- Furnished: Property comes with furniture and basic appliances

## Tool Usage Rules
- Call "hangUp" when:
  - The user asks to end the call
  - The user says goodbye or indicates they're done
  - You're about to end the call yourself
- Call "UpdatePreferences" when the user specifies property search preferences
- Call "SearchProperties" after collecting user preferences to search for matching properties. Call this whenever user asks to search or shortlist or show properties during the conversation.
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
            modelToolName: "hangUp",
            description: "End the current call and close the conversation window",
            client: {}
          }
        },
        {
          temporaryTool: {
            modelToolName: "UpdatePreferences",
            description: "Update user preferences for property search. Call this any time the user specifies or changes their property requirements.",
            dynamicParameters: [
              {
                name: "preferences",
                location: "PARAMETER_LOCATION_BODY",
                schema: {
                  type: "object",
                  properties: {
                    location: { 
                      type: "string", 
                      description: "The preferred location or area for the property search." 
                    },
                    propertyType: { 
                      type: "string", 
                      description: "The type of property, such as Apartment, Villa, Penthouse, etc." 
                    },
                    bedrooms: { 
                      type: "string", 
                      description: "Number of bedrooms required, can be a specific number or range like '2-3' or '3+'" 
                    },
                    bathrooms: { 
                      type: "string", 
                      description: "Number of bathrooms required, can be a specific number or range like '2-3' or '2+'" 
                    },
                    priceRange: { 
                      type: "object", 
                      description: "The minimum and maximum price range",
                      properties: {
                        min: { type: "number", description: "Minimum price in the range" },
                        max: { type: "number", description: "Maximum price in the range" }
                      }
                    },
                    listingType: { 
                      type: "string", 
                      description: "Type of listing, such as 'For Sale', 'For Rent', or 'New Development'" 
                    },
                    features: { 
                      type: "array", 
                      description: "List of desired property features",
                      items: { type: "string" }
                    },
                    viewType: { 
                      type: "string", 
                      description: "Preferred view type, such as 'Sea View', 'City View', etc." 
                    },
                    areaRange: { 
                      type: "object", 
                      description: "The minimum and maximum area size in square feet",
                      properties: {
                        min: { type: "number", description: "Minimum area in square feet" },
                        max: { type: "number", description: "Maximum area in square feet" }
                      }
                    },
                    nearbyAmenities: { 
                      type: "array", 
                      description: "List of desired nearby amenities",
                      items: { type: "string" }
                    },
                    isPetFriendly: { 
                      type: "boolean", 
                      description: "Whether the property needs to be pet-friendly" 
                    },
                    isFurnished: { 
                      type: "boolean", 
                      description: "Whether the property needs to be furnished" 
                    },
                    yearBuilt: { 
                      type: "string", 
                      description: "Preferred construction year range, such as '2020-2023' or 'After 2015'" 
                    }
                  }
                },
                required: true
              }
            ],
            client: {}
          }
        },
        {
          temporaryTool: {
            modelToolName: "SearchProperties",
            description: "Search for properties based on the collected user preferences. Call this after gathering sufficient preferences to find matching properties.",
            dynamicParameters: [
              {
                name: "searchCriteria",
                location: "PARAMETER_LOCATION_BODY",
                schema: {
                  type: "string",
                  description: "JSON string of the search criteria containing all relevant preferences"
                },
                required: true
              }
            ],
            client: {}
          }
        }
      ],
      // Add inactivity settings to automatically end call after periods of silence
      inactivity_messages: [
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
        // Backend expects 'speaker', 'text', and 'type' fields
        const formattedMessages = initialMessages.map(msg => {
          // Ensure we have all required fields
          if (!msg.text) {
            console.warn('Message missing text:', msg);
            return null;
          }
          
          // Normalize the speaker value: could be 'speaker' or 'role'
          let speaker = 'user'; // Default
          if (msg.speaker) {
            speaker = msg.speaker === 'agent' || msg.speaker === 'assistant' ? 'assistant' : 'user';
          } else if (msg.role) {
            speaker = msg.role === 'ASSISTANT' || msg.role === 'assistant' ? 'assistant' : 'user';
          }
          
          // Normalize the medium/type value
          let type = 'text'; // Default
          if (msg.medium) {
            type = typeof msg.medium === 'string' 
              ? (msg.medium.toLowerCase() === 'voice' ? 'voice' : 'text')
              : (msg.medium === Medium.VOICE ? 'voice' : 'text');
          } else if (msg.type) {
            type = msg.type.toLowerCase() === 'voice' ? 'voice' : 'text';
          }
          
          // Return a consistently formatted message object
          return {
            text: msg.text,
            speaker: speaker,
            type: type
          };
        }).filter(Boolean); // Remove any null entries
        
        if (formattedMessages.length > 0) {
          payload.initialMessages = formattedMessages;
          console.log('Sending initialMessages with proper format:', JSON.stringify(formattedMessages));
        } else {
          console.warn('No valid initial messages to send');
        }
      } catch (error) {
        console.error('Error formatting initialMessages:', error);
        // Continue without initialMessages if there was an error
        delete payload.initialMessages;
      }
    }

    // Construct the API endpoint - add priorCallId as a query parameter if provided
    let endpoint = `${API_BASE_URL}/api/voice-agent/calls`;
    if (priorCallId) {
      console.log(`Resuming previous conversation with priorCallId: ${priorCallId} (as query parameter)`);
      endpoint += `?priorCallId=${encodeURIComponent(priorCallId)}`;
    }

    const response = await axios.post(endpoint, payload);
    
    return response.data;
  } catch (error) {
    console.error('Error creating Ultravox call:', error);
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
    
    // Register client tools
    uvSession.registerToolImplementation('UpdatePreferences', updatePreferencesTool);
    uvSession.registerToolImplementation('SearchProperties', searchPropertiesTool);
    uvSession.registerToolImplementation('hangUp', hangUpTool);
    
    console.log('Ultravox session initialized with all tools registered');
  }
  return uvSession;
};

export const registerToolImplementations = (
  session: UltravoxSession, 
  orderCheckoutCallback: (orderItems: any) => void
) => {
  // Register the orderCheckout tool
  session.registerToolImplementation('orderCheckout', (parameters) => {
    const { order } = parameters;
    try {
      // Parse the order JSON
      const orderItems = JSON.parse(order);
      // Call the callback function to handle the checkout
      orderCheckoutCallback(orderItems);
      return 'Order has been added to cart and navigating to checkout.';
    } catch (error) {
      console.error('Error processing order checkout:', error);
      return 'There was an error processing your order. Please try again.';
    }
  });
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