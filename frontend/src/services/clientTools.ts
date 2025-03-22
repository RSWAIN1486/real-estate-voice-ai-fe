import { ClientToolImplementation } from 'ultravox-client';
import { store } from '../store/store';
import { addItem } from '../store/slices/orderSlice';

export const updatePreferencesTool: ClientToolImplementation = (parameters) => {
  const { preferences } = parameters;
  
  if (typeof window !== "undefined") {
    const event = new CustomEvent("propertyPreferencesUpdated", {
      detail: preferences,
    });
    window.dispatchEvent(event);
  }

  return "Updated your property preferences.";
};

export const searchPropertiesTool: ClientToolImplementation = (parameters) => {
  const { searchCriteria } = parameters;
  
  let parsedCriteria;
  try {
    // Try to parse if it's a string
    if (typeof searchCriteria === 'string') {
      parsedCriteria = JSON.parse(searchCriteria);
    } else {
      parsedCriteria = searchCriteria;
    }
  } catch (error) {
    console.error('Error parsing search criteria:', error);
    parsedCriteria = searchCriteria;
  }
  
  if (typeof window !== "undefined") {
    const event = new CustomEvent("searchPropertiesRequested", {
      detail: parsedCriteria,
    });
    window.dispatchEvent(event);
  }

  return "Searching for properties based on your preferences.";
};

export const updateOrderTool: ClientToolImplementation = (parameters) => {
  const { orderDetailsData } = parameters;
  
  if (typeof window !== "undefined") {
    const event = new CustomEvent("orderDetailsUpdated", {
      detail: orderDetailsData,
    });
    window.dispatchEvent(event);
  }

  return "Updated the order details.";
};

export const orderCheckoutTool: ClientToolImplementation = (parameters) => {
  const { order } = parameters;
  
  if (typeof window !== "undefined") {
    const event = new CustomEvent("orderCheckout", {
      detail: order,
    });
    window.dispatchEvent(event);
  }

  return "Order has been added to cart and navigating to checkout.";
};

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