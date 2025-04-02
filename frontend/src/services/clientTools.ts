import { ClientToolImplementation } from 'ultravox-client';
import { store } from '../store/store';
import { addItem } from '../store/slices/orderSlice';
import axios from 'axios';
import { API_BASE_URL } from '../utils/CONSTANTS';

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

export const propertySearchTool: ClientToolImplementation = async (parameters) => {
  console.log('🏠 PROPERTY SEARCH TOOL: Searching for properties with query:', parameters.query);
  
  try {
    // Call the backend API to search for properties
    console.log('🏠 PROPERTY SEARCH TOOL: Calling backend API with query:', parameters.query);
    const response = await axios.post(
      `${API_BASE_URL}/api/voice-agent/property-search`,
      {
        query: parameters.query
      }
    );
    
    // Get the results from the response
    const { results, total_count, search_parameters } = response.data;
    
    console.log(`🏠 PROPERTY SEARCH TOOL: Found ${total_count} properties, showing top ${results.length}`);
    console.log('🏠 PROPERTY SEARCH TOOL: Search parameters:', search_parameters);
    console.log('🏠 PROPERTY SEARCH TOOL: Sample result:', results.length > 0 ? results[0] : 'No results');
    
    // Format the results to be displayed in the chat
    let formattedResults = '';
    
    if (results && results.length > 0) {
      // Dispatch a custom event to display properties in the UI
      console.log('🏠 PROPERTY SEARCH TOOL: Dispatching propertySearchResults event with', results.length, 'properties');
      window.dispatchEvent(new CustomEvent('propertySearchResults', {
        detail: { 
          results,
          search_parameters
        }
      }));
      
      // Return a summary message for the voice agent to read
      return `I found ${total_count} properties matching your criteria. Here are the top ${results.length} matches. I've displayed them in the chat window for you to review.`;
    } else {
      console.log('🏠 PROPERTY SEARCH TOOL: No matching properties found');
      return "I couldn't find any properties matching your criteria. Could you try with different search parameters?";
    }
  } catch (error) {
    console.error('🏠 PROPERTY SEARCH TOOL: Error searching for properties:', error);
    
    // More detailed error logging
    if (axios.isAxiosError(error)) {
      console.error('🏠 PROPERTY SEARCH TOOL: Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    
    return "I'm sorry, I encountered an error while searching for properties. Could you try again with a different query?";
  }
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