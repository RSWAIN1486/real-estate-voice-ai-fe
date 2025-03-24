import { ClientToolImplementation } from 'ultravox-client';
import { store } from '../store/store';
import { addItem } from '../store/slices/orderSlice';

export const updatePreferencesTool: ClientToolImplementation = (parameters) => {
  const { preferences } = parameters;
  
  console.log('UPDATE PREFERENCES TOOL CALLED with parameters:', parameters);
  
  // Process and format the preferences
  const formattedPreferences = formatPreferences(preferences);
  console.log('Formatted preferences:', formattedPreferences);
  
  // Convert preferences to the filter format expected by the UI
  const convertedFilters = convertPreferencesToFilters(formattedPreferences);
  console.log('Converted to filter format:', convertedFilters);
  
  if (typeof window !== "undefined") {
    // Use updateFilters event for consistency with App.tsx event listeners
    const event = new CustomEvent("updateFilters", {
      detail: { filters: convertedFilters },
    });
    window.dispatchEvent(event);
    console.log('updateFilters event dispatched');
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

// Convert from the preferences format to the filters format used by the UI
function convertPreferencesToFilters(preferences: any) {
  if (!preferences) return preferences;
  
  const filters: any = { ...preferences };
  
  // Handle priceRange conversion to minPrice/maxPrice
  if (preferences.priceRange) {
    if (preferences.priceRange.min !== undefined) {
      filters.minPrice = preferences.priceRange.min;
    }
    if (preferences.priceRange.max !== undefined) {
      filters.maxPrice = preferences.priceRange.max;
    }
    delete filters.priceRange;
  }
  
  // Handle areaRange conversion to minArea/maxArea
  if (preferences.areaRange) {
    if (preferences.areaRange.min !== undefined) {
      filters.minArea = preferences.areaRange.min;
    }
    if (preferences.areaRange.max !== undefined) {
      filters.maxArea = preferences.areaRange.max;
    }
    delete filters.areaRange;
  }
  
  // Handle features conversion to selectedFeatures
  if (preferences.features && Array.isArray(preferences.features)) {
    filters.selectedFeatures = preferences.features;
    delete filters.features;
  }
  
  // Ensure location is processed correctly
  if (preferences.location && typeof preferences.location === 'string') {
    filters.location = preferences.location;
  }
  
  // Ensure property type is processed correctly
  if (preferences.propertyType && typeof preferences.propertyType === 'string') {
    filters.propertyType = preferences.propertyType;
  }
  
  return filters;
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
    
    // Convert to the filters format expected by the UI
    parsedCriteria = convertPreferencesToFilters(parsedCriteria);
    
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

  // Generate a dynamic response based on the search criteria
  const getSearchResponse = (criteria: any) => {
    const responses = [
      "Here are the properties I found that match what you're looking for.",
      "I've found some properties that might interest you based on your criteria.",
      "Take a look at these properties that match your search.",
      "Based on what you're looking for, I've found these properties for you.",
      "I think you'll like these properties that match your requirements."
    ];
    
    // Choose a random base response
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Build a more detailed response if we have specific criteria
    let detailedResponse = baseResponse;
    
    if (criteria) {
      const details = [];
      
      if (criteria.location) {
        details.push(`in ${criteria.location}`);
      }
      
      if (criteria.listingType) {
        const listingTypeMap: {[key: string]: string} = {
          'For Rent': 'for rent',
          'For Sale': 'for sale',
          'New Development': 'in new developments'
        };
        details.push(listingTypeMap[criteria.listingType] || criteria.listingType.toLowerCase());
      }
      
      if (criteria.minBedrooms || criteria.maxBedrooms) {
        if (criteria.minBedrooms && criteria.maxBedrooms) {
          details.push(`with ${criteria.minBedrooms}-${criteria.maxBedrooms} bedrooms`);
        } else if (criteria.minBedrooms) {
          details.push(`with at least ${criteria.minBedrooms} ${criteria.minBedrooms === 1 ? 'bedroom' : 'bedrooms'}`);
        } else if (criteria.maxBedrooms) {
          details.push(`with up to ${criteria.maxBedrooms} ${criteria.maxBedrooms === 1 ? 'bedroom' : 'bedrooms'}`);
        }
      }
      
      if (criteria.minPrice || criteria.maxPrice) {
        if (criteria.minPrice && criteria.maxPrice) {
          details.push(`priced between $${criteria.minPrice.toLocaleString()} and $${criteria.maxPrice.toLocaleString()}`);
        } else if (criteria.minPrice) {
          details.push(`starting from $${criteria.minPrice.toLocaleString()}`);
        } else if (criteria.maxPrice) {
          details.push(`under $${criteria.maxPrice.toLocaleString()}`);
        }
      }
      
      if (criteria.propertyType) {
        details.push(`of type ${criteria.propertyType.toLowerCase()}`);
      }
      
      // Add amenities if present
      if (criteria.features && criteria.features.length > 0) {
        details.push(`featuring ${criteria.features.join(', ')}`);
      }
      
      // Combine all details into a natural language sentence
      if (details.length > 0) {
        detailedResponse = `${baseResponse.replace(/\.$/, '')} ${details.join(', ')}.`;
      }
    }
    
    return detailedResponse;
  };

  return getSearchResponse(parsedCriteria);
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