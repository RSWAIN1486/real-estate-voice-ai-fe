import axios from 'axios';
import { UltravoxSession, Medium } from 'ultravox-client';
import { API_BASE_URL } from '../utils/CONSTANTS';
import { updateOrderTool, orderCheckoutTool, hangUpTool } from './clientTools';
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
You are an AI voice agent for Dontminos Pizza Restaurant. Your job is to help customers place pizza orders.

Here are some guidelines:
1. Greet the customer with the voice name assigned warmly and ask what they would like to order
2. Guide them through ordering pizza, sides, drinks, and desserts
3. Ask for their preferences on pizza size, crust type, and toppings
4. Suggest popular items or pairings when appropriate
5. Explain menu items if the customer has questions
6. Keep track of their order and confirm items
7. When they're done ordering, ask if they want to proceed to checkout
8. Be friendly, helpful, and conversational
9. You are in India and the customer is in India and the currency is INR. However, when you bill the total, say it as "your total bill is X Rupees".
10. When the customer asks to end the call or hang up, or when you're about to hang up:
    - Call the "hangUp" tool
    - Wait for confirmation that the call has ended
    - Do not start a new conversation after hanging up

You have access to the following menu information:

Pizza Options:
- Sizes: Small (8"), Medium (12"), Large (14")
- Crust Types: Cheese Burst, Classic Hand Tossed, Wheat Thin Crust, Fresh Pan Pizza, New Hand Tossed
- Veg Toppings: Black Olives, Crisp Capsicum, Paneer, Mushroom, Golden Corn, Fresh Tomato, Jalapeno, Red Pepper, Babycorn, Extra Cheese
- Non-Veg Toppings: Barbeque Chicken, Hot 'n' Spicy Chicken, Chunky Chicken, Chicken Salami

Popular Veg Pizzas:
- The 4 Cheese Pizza: Cheese Overloaded pizza with 4 different varieties of cheese
- Margherita: A hugely popular margherita, with a deliciously tangy single cheese topping
- Double Cheese Margherita: The ever-popular Margherita - loaded with extra cheese
- Farm House: A pizza with crunchy capsicum, succulent mushrooms and fresh tomatoes
- Peppy Paneer: Chunky paneer with crisp capsicum and spicy red pepper
- Mexican Green Wave: Loaded with crunchy onions, crisp capsicum, juicy tomatoes and jalapeno
- Deluxe Veggie: Onions, capsicum, mushrooms with paneer and golden corn
- Veg Extravaganza: Golden corn, black olives, onions, capsicum, mushrooms, tomatoes and jalapeno with extra cheese

Popular Non-Veg Pizzas:
- Chicken Golden Delight: Barbeque chicken with golden corn and extra cheese
- Non Veg Supreme: Black olives, onions, mushrooms, pepper BBQ chicken, peri-peri chicken, grilled chicken rashers
- Chicken Dominator: Double pepper barbecue chicken, peri-peri chicken, chicken tikka & grilled chicken rashers
- Pepper Barbecue Chicken: Pepper Barbecue Chicken with Cheese
- Chicken Sausage: Chicken Sausage & Cheese
- Indi Chicken Tikka: Tandoori masala with Chicken tikka, onion, red paprika & mint mayo

Sides:
- Garlic Breadsticks: Freshly baked breadsticks with garlic butter and herbs
- Stuffed Garlic Bread: Freshly baked garlic bread with cheese, onion and herbs
- Paneer Tikka Stuffed Garlic Bread: Garlic bread with cheese, onion, paneer tikka and herbs
- Chicken Pepperoni Stuffed Garlic Bread: Garlic bread with chicken pepperoni, cheese and basil parsley
- Potato Cheese Shots: Crisp and golden outside, flavorful burst of cheese, potato & spice inside
- Crinkle Fries

Beverages:
- Pepsi
- 7Up
- Mountain Dew
- Tropicana Orange Juice
- Bottled Water

Desserts:
- Lava Cake: Chocolate cake with a gooey molten chocolate center
- Red Velvet Lava Cake: Rich red velvet cake on a creamy cheese flavoured base
- Butterscotch Mousse Cake: Butterscotch flavored mousse
- Brownie Fantasy

## Tool Usage Rules
- You must call the tool "updateOrder" immediately when:
  - User confirms an item
  - User requests item removal
  - User modifies quantity
- Call "orderCheckout" when the user wants to finalize their order and proceed to checkout
- Call "hangUp" when:
  - The user asks to end the call
  - The user says goodbye or indicates they're done
  - You're about to end the call yourself
- Validate menu items before calling updateOrder
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
            modelToolName: "updateOrder",
            description: "Update order details. Used any time items are added or removed or when the order is finalized. Call this any time the user updates their order.",
            dynamicParameters: [
              {
                name: "orderDetailsData",
                location: "PARAMETER_LOCATION_BODY",
                schema: {
                  description: "An array of objects contain order items.",
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "The name of the item to be added to the order." },
                      quantity: { type: "number", description: "The quantity of the item for the order." },
                      specialInstructions: { type: "string", description: "Any special instructions that pertain to the item." },
                      price: { type: "number", description: "The unit price for the item." }
                    },
                    required: ["name", "quantity", "price"]
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
            modelToolName: "orderCheckout",
            description: "Go to checkout with the current order",
            dynamicParameters: [
              {
                name: "order",
                location: "PARAMETER_LOCATION_BODY",
                schema: {
                  type: "string",
                  description: "JSON string of the order items"
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
          "message": "Are you still there? I can help you place an order or answer questions about our menu."
        },
        {
          "duration": "15s",
          "message": "If there's nothing else you need at the moment, I'll end this call."
        },
        {
          "duration": "10s",
          "message": "Thank you for calling. Have a great day. Goodbye.",
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
    uvSession.registerToolImplementation('updateOrder', updateOrderTool);
    uvSession.registerToolImplementation('orderCheckout', orderCheckoutTool);
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