import { ClientToolImplementation } from 'ultravox-client';
import { store } from '../store/store';
import { addItem } from '../store/slices/orderSlice';

export const updatePreferencesTool: ClientToolImplementation = (parameters) => {
  const { preferences } = parameters;
  
  // Process and format the preferences
  const formattedPreferences = formatPreferences(preferences);
  
  if (typeof window !== "undefined") {
    // Use updateFilters event for consistency with App.tsx event listeners
    const event = new CustomEvent("updateFilters", {
      detail: { filters: formattedPreferences },
    });
    window.dispatchEvent(event);
  }

  return "Updated your property preferences.";
};

// Helper function to format preferences, especially price values
function formatPreferences(preferences: any) {
  if (!preferences) return preferences;
  
  const formatted = { ...preferences };
  
  // Handle price range formatting
  if (formatted.priceRange) {
    // Process min price if it exists
    if (formatted.priceRange.min !== undefined) {
      if (typeof formatted.priceRange.min === 'string') {
        formatted.priceRange.min = convertPriceStringToNumber(formatted.priceRange.min);
      }
    }
    
    // Process max price if it exists
    if (formatted.priceRange.max !== undefined) {
      if (typeof formatted.priceRange.max === 'string') {
        formatted.priceRange.max = convertPriceStringToNumber(formatted.priceRange.max);
      }
    }
  }
  
  return formatted;
}

// Helper function to convert price strings to numbers
function convertPriceStringToNumber(priceStr: string): number {
  if (typeof priceStr !== 'string') return priceStr;
  
  // Clean the string
  const cleanedStr = priceStr.toLowerCase().replace(/[$,]/g, '');
  
  // Check for million
  if (cleanedStr.includes('million') || cleanedStr.includes('m')) {
    const match = cleanedStr.match(/(\d+(\.\d+)?)/);
    if (match && match[1]) {
      return parseFloat(match[1]) * 1000000;
    }
  }
  
  // Check for thousand
  if (cleanedStr.includes('thousand') || cleanedStr.includes('k')) {
    const match = cleanedStr.match(/(\d+(\.\d+)?)/);
    if (match && match[1]) {
      return parseFloat(match[1]) * 1000;
    }
  }
  
  // Just try to parse as a number
  const numberMatch = cleanedStr.match(/(\d+(\.\d+)?)/);
  if (numberMatch && numberMatch[1]) {
    return parseFloat(numberMatch[1]);
  }
  
  return 0; // Default fallback
}

export const searchPropertiesTool: ClientToolImplementation = (parameters) => {
  console.log('SEARCH PROPERTIES TOOL CALLED with parameters:', parameters);
  const { searchCriteria } = parameters;
  
  let parsedCriteria;
  try {
    // Try to parse if it's a string
    if (typeof searchCriteria === 'string') {
      try {
        parsedCriteria = JSON.parse(searchCriteria);
        console.log('Successfully parsed string criteria:', parsedCriteria);
      } catch (parseError) {
        console.error('Error parsing search criteria string:', parseError);
        // If it's not valid JSON, use it as a location string
        parsedCriteria = { location: searchCriteria };
        console.log('Using string as location:', parsedCriteria);
      }
    } else if (!searchCriteria || Object.keys(searchCriteria).length === 0) {
      // Handle empty criteria - use default to show all properties
      parsedCriteria = { showAll: true };
      console.log('No criteria provided, using showAll flag');
    } else {
      parsedCriteria = searchCriteria;
      console.log('Using provided object criteria:', parsedCriteria);
    }
    
    // Format the criteria, especially prices
    parsedCriteria = formatPreferences(parsedCriteria);
    
    // Ensure we always have a valid object
    if (!parsedCriteria || typeof parsedCriteria !== 'object') {
      console.warn('Invalid search criteria, creating default object');
      parsedCriteria = { showAll: true };
    }
    
    // Log the final criteria being used
    console.log('Formatted search criteria being dispatched:', parsedCriteria);
    
  } catch (error) {
    console.error('Error processing search criteria:', error);
    // Use a default object that will show properties
    parsedCriteria = { showAll: true };
    console.log('Error occurred, using default criteria:', parsedCriteria);
  }
  
  if (typeof window !== "undefined") {
    // Use executeSearch event for consistency with App.tsx event listeners
    const event = new CustomEvent("executeSearch", {
      detail: { criteria: parsedCriteria },
    });
    window.dispatchEvent(event);
    
    // Log that the event was dispatched
    console.log('executeSearch event dispatched with criteria', parsedCriteria);
    
    // Show confirmation in console that's easy to see
    console.log('%c 🏠 SEARCH PROPERTIES TOOL EXECUTED 🏠 ', 'background: #4CAF50; color: white; padding: 4px; border-radius: 4px;');
  }

  return "I'm showing you properties that match your criteria now.";
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