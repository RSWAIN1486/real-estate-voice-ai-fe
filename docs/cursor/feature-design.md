# Real Estate Voice Agent Feature Design

## Overview

This document outlines the design and architecture for converting the existing restaurant voice agent into a real estate property search voice agent. The conversion focuses primarily on the frontend components while maintaining the existing voice agent functionality.

## Core Components

### 1. Frontend UI Components

- **HeroSection**: Large banner with search functionality and voice assistant access
  - Background image of luxury property
  - Search bar with location input
  - Quick city selection buttons
  - Voice agent access button

- **SearchFilters**: Comprehensive property search filters
  - Location search
  - Price range slider
  - Bedrooms/bathrooms filters
  - Property type selection
  - Listing type filter (Buy/Rent/New Development)
  - Advanced filter options (toggle-able)

- **PropertyList**: Display of property listings
  - Property cards with images
  - Property details (price, location, beds, baths, sqft)
  - Status tags (For Rent, New Development, etc.)
  - Loading states with skeletons
  - Empty state messaging

- **Header/Footer**: Site navigation and branding
  - Global Estates branding
  - Navigation links (Buy, Rent, Sell, About, Contact)
  - Theme toggle functionality
  - Voice agent settings access

### 2. Voice Agent Integration

We'll maintain the core voice agent functionality while adapting it to understand and respond to real estate queries:

- Keep the existing voice recognition and synthesis technology
- Adapt the interface to match the real estate aesthetic
- Update voice agent responses to be contextually appropriate for real estate
- Enable the voice agent to understand property search criteria:
  - Locations
  - Price ranges
  - Number of bedrooms/bathrooms
  - Property types
  - Specific amenities

### 3. Data Flow

1. User initiates voice search via the voice agent
2. Voice input is processed and converted to structured filter criteria
3. Filter criteria are passed to the search system
4. Results are displayed in the PropertyList component
5. User can further refine results using the SearchFilters component

## Design Choices

- **Colors**: Blue and orange color scheme (primary: #2B4162, secondary: #F5853F)
  - Blue conveys trust and professionalism
  - Orange adds warmth and approachability
  - High contrast for accessibility

- **Typography**: 
  - Clean, modern sans-serif (Inter) for readability
  - Bold headings for emphasis
  - Consistent type scale for hierarchy

- **Layout**:
  - Hero section with search prominently featured
  - Filters panel at top of results
  - 3-column grid of property cards on desktop
  - Responsive design that adapts to mobile devices

## Implementation Strategy

Rather than rebuilding the entire application, we're taking an incremental approach:

1. Update the theme and styling to match real estate branding
2. Create new React components for property search UI
3. Implement the components in the existing app structure
4. Maintain existing voice agent functionality but adapt the UI

This approach allows us to leverage the robust voice agent technology while providing a new user experience focused on real estate property search.

## Core Features

### 1. Voice Conversations
- Natural language voice recognition for customer input
- Text-to-speech capabilities for agent responses
- Real-time audio level visualization for microphone activity
- Support for muting/unmuting microphone and speaker

### 2. Conversation History
- Maintains a transcript of the entire conversation
- Supports loading previous conversations
- Automatically saves conversation history for future reference
- Provides a visual distinction between user and agent messages

### 3. Order Processing
- Integrates with the existing order management system
- Recognizes food items, quantities, and special instructions
- Confirms orders with the customer
- Manages the checkout process

### 4. Voice Customization
- Allows selection of different voices for the agent
- Supports configuration of voice settings (temperature, model)
- Provides a settings interface for customization

## Technical Architecture

### Frontend Components
- `VoiceAgent.tsx`: Main component managing the agent UI
- `VoiceAgentSettings.tsx`: Settings dialog for customizing the agent
- `voiceAgentService.ts`: Service layer for API communication

### Backend Components 
- `voice_agent.py`: API endpoints for Ultravox proxy
- Message transformation for proper API formatting

### External APIs
- Ultravox API for voice recognition and synthesis

## Optimization Features

### Image Loading Optimization
- Efficient image loading with proper caching
- Error handling for missing images with fallbacks
- Memory caching system to reduce redundant requests

### Message Format Handling
- Robust validation and transformation of message formats
- Support for backward compatibility with different versions
- Error handling for malformed messages

## User Experience Considerations
- Microphone access permission handling
- Clear status indicators
- Error recovery mechanisms
- Audio level visualization for feedback

## Security Considerations
- Secure API key management
- Proper error handling without exposing sensitive information
- Content validation before sending to external services 

## Feature: RAG-based Property Search with DeepInfra API

### Purpose

Implement a Retrieval-Augmented Generation (RAG) system that uses DeepInfra's Llama 3.2 model to understand property search queries and extract structured parameters for property filtering. This implementation replaces the previous basic property search approach with a more sophisticated AI-powered system.

### Components

1. **Backend Endpoint**: A new `/property-search` endpoint in the `voice_agent.py` file that:
   - Accepts natural language search queries
   - Uses DeepInfra's API to extract search parameters
   - Performs structured search on the property database
   - Returns matching properties as JSON

2. **Frontend Tool Implementation**: 
   - Add a `propertySearchTool` in `clientTools.ts` that calls the backend endpoint
   - Register this tool with the Ultravox session
   - Process the results and display them in the chat window

3. **Voice Agent Integration**:
   - Update the system prompt to instruct the agent to use the property search tool
   - Ensure proper handling of property search results
   - Display property cards in the UI for good user experience

### Technical Design

#### Backend Implementation

1. **RAG Endpoint**:
   ```python
   @router.post("/property-search")
   async def search_properties(request: PropertySearchRequest):
       # Initialize DeepInfra client
       # Process query with Llama 3.2 model
       # Extract search parameters
       # Search property database
       # Return results
   ```

2. **Data Flow**:
   - User query → Voice Agent → Backend API → DeepInfra Llama 3.2 → Parameter Extraction → Database Search → Results → Frontend Display

3. **Parameter Extraction**:
   The system extracts the following parameters from natural language queries:
   - Location
   - Property type
   - Number of bedrooms
   - Number of bathrooms
   - Price range
   - Rental vs. Sale
   - Amenities

#### Frontend Implementation

1. **Property Search Tool**:
   ```typescript
   export const propertySearchTool: ClientToolImplementation = async (parameters) => {
     // Call backend API
     // Process results
     // Display in UI
     // Return summary message
   };
   ```

2. **Property Cards UI**:
   - Display property information in card format
   - Show key details like price, location, bedrooms, bathrooms
   - Include amenities and property type
   - Provide visual distinction between rental and sale properties

3. **Tool Registration**:
   ```typescript
   uvSession.registerToolImplementation('propertySearch', propertySearchTool);
   ```

### Design Considerations

1. **User Experience**:
   - Voice Agent should provide clear feedback about search results
   - Property cards should be visually appealing and easy to scan
   - Agent should be able to answer follow-up questions about properties

2. **Performance**:
   - DeepInfra API calls optimize for low latency
   - Property database queries are efficient for quick results
   - Frontend caches results to avoid redundant searches

3. **Error Handling**:
   - Handle cases where no properties match the criteria
   - Provide graceful error messages for API failures
   - Fall back to simpler search if DeepInfra is unavailable

### Future Enhancements

1. **Search Refinement**: Allow users to refine their search results with follow-up queries
2. **Property Comparison**: Enable comparing multiple properties side by side
3. **Saved Searches**: Let users save their property searches for later
4. **Image Gallery**: Show multiple property images in a gallery view
5. **Map Integration**: Display property locations on an interactive map

## Integration with Existing System

- The RAG-based search integrates with the existing Ultravox voice agent
- The system maintains the conversation history for context-aware responses
- The UI adapts to show property cards within the chat interface
- The search parameters flow seamlessly from voice input to property results

## Implementation Timeline

1. **Backend RAG Endpoint**: Implement the property search endpoint with DeepInfra integration
2. **Frontend Tool Implementation**: Create the property search tool in the frontend
3. **UI Updates**: Design and implement property cards in the voice agent interface
4. **Testing**: Test various property search queries and refine the system
5. **Deployment**: Deploy the complete system with the new RAG-based search functionality 