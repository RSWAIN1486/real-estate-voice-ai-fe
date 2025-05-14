import axios from 'axios';
import { UltravoxSession, Medium } from 'ultravox-client';
import { API_BASE_URL } from '../utils/CONSTANTS';
import { hangUpTool } from './clientTools';
// import { store } from '../store/store'; // Unused

// Constants for system prompt, voice ID, model, and options are no longer needed
// as they are configured on the Ultravox platform per agent.

/**
 * Create a new call to the Ultravox API via our backend proxy using the Agent API
 * @param initialMessages Optional array of previous conversation messages to provide context
 */
export const createVoiceAgentCall = async (initialMessages?: Array<any>) => {
  try {
    // Payload for the new Agent API.
    // Fields like voice, model, systemPrompt, temperature are configured on the Ultravox platform.
    const payload: any = {
      recordingEnabled: false, // Default to false, can be made configurable if needed
      // templateContext: {}, // Add if specific template context is needed
      // metadata: {}, // Add if metadata is needed
    };

    // If initialMessages are provided, format and add them to the payload.
    if (initialMessages && initialMessages.length > 0) {
      try {
        console.log('Using initial messages for new agent call.');
        
        const formattedMessages = initialMessages.map(msg => {
          if (!msg.text) {
            console.warn('Message missing text:', msg);
            return null;
          }
          
          // Ensure role is one of the accepted values by Ultravox Agent API
          // MESSAGE_ROLE_UNSPECIFIED, MESSAGE_ROLE_USER, MESSAGE_ROLE_ASSISTANT
          // We'll map our 'agent' to 'ASSISTANT' and 'user' to 'USER'
          let role = 'MESSAGE_ROLE_USER'; // Default to user
          if (msg.speaker === 'agent' || msg.role?.toUpperCase() === 'ASSISTANT') {
            role = 'MESSAGE_ROLE_AGENT';
          }

          return {
            role: role,
            text: msg.text,
            // medium: msg.medium === Medium.VOICE ? 'MESSAGE_MEDIUM_VOICE' : 'MESSAGE_MEDIUM_TEXT' // Optional, let Ultravox handle or set explicitly if needed
          };
        }).filter(Boolean);
        
        if (formattedMessages.length > 0) {
          payload.initialMessages = formattedMessages;
          console.log('Sending formatted initialMessages for agent call:', JSON.stringify(formattedMessages, null, 2));
        }
      } catch (error) {
        console.error('Error formatting initialMessages for agent call:', error);
      }
    }

    console.log('Sending payload to create agent call:', JSON.stringify(payload, null, 2));

    // Make the API call to the new backend endpoint for agent calls
    const response = await axios.post(
      `${API_BASE_URL}/api/voice-agent/agent-calls`, // Updated endpoint
      payload
    );

    return response.data;
  } catch (error) {
    console.error('Error creating voice agent call (agent API):', error);
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
    uvSession = null;
    console.log('🔊🔊 ENDCALL SERVICE: Reset uvSession to null');
    
    // Try one last method to forcibly clean up the session
    try {
      // Access destroy method using type assertion
      const session = uvSession as any;
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
    // const oldSession = uvSession; // Unused
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
  // fetchAvailableVoices, // This function is being removed
}; 