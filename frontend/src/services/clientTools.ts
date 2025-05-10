import { ClientToolImplementation } from 'ultravox-client';
import { store } from '../store/store';
import { addItem } from '../store/slices/orderSlice';
import axios from 'axios';
import { API_BASE_URL } from '../utils/CONSTANTS';

export const hangUpTool = async () => {
  console.log('🔊🔊 HANGUP TOOL: Hangup tool called by agent');
  
  try {
    // Get the current call ID from Redux
    const currentState = store.getState();
    const callId = currentState.voiceAgent.callId;
    
    if (callId) {
      console.log(`🔊🔊 HANGUP TOOL: Ending call ${callId}`);
      
      // Dispatch a custom event that the VoiceAgent component will listen for
      window.dispatchEvent(new CustomEvent('agentRequestedHangup', {
        detail: { callId }
      }));
      
      return "Call ended successfully";
    } else {
      console.warn('🔊🔊 HANGUP TOOL: No active call ID found');
      return "No active call to end";
    }
  } catch (error) {
    console.error('🔊🔊 HANGUP TOOL: Error in hangup tool:', error);
    return "Error ending call";
  }
}; 