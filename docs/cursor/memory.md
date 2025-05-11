# Project Memory

This document captures learnings and key insights from the development of the Restaurant Voice Agent, serving as a reference for future development and to avoid repeating mistakes.

## Technical Learnings

### Resource Cleanup and Call Termination

**Issue:** The voice agent continued to run and talk in the background even after the user exited the call or closed the dialog.

**Root Cause:** The call was not being properly terminated on the server side, and only the local client session was being disconnected. This meant the Ultravox AI continued processing on the server side.

**Solution:** Implemented a multi-layered cleanup approach:

1. **Proper server-side call termination:**
   ```typescript
   if (callId) {
     console.log(`Terminating Ultravox call on server: ${callId}`);
     await voiceAgentService.endCall(callId);
   }
   ```

2. **Enhanced client-side cleanup:**
   ```typescript
   // Handle both success and failure cases
   try {
     await voiceAgentService.leaveCurrentCall();
     // Reset the session reference 
     uvSession = null;
   } catch (error) {
     // Force reset the session even if there was an error
     uvSession = null;
   }
   ```

3. **Better component lifecycle management:**
   ```typescript
   useEffect(() => {
     // Capture resources that need cleanup
     const currentCallId = useSelector((state: RootState) => state.voiceAgent.callId);
     
     return () => {
       // Use captured resources for cleanup
       if (currentCallId) {
         voiceAgentService.endCall(currentCallId);
       }
       // Additional resource cleanup...
     };
   }, [status]);
   ```

**Learning:** When working with external services like voice APIs, it's essential to implement proper cleanup at multiple levels:
1. Send termination signals to the server
2. Clean up client-side resources
3. Handle both normal and error paths
4. Implement safeguards in component lifecycle methods

### React Hooks Usage in Cleanup Functions

**Issue:** The application crashed on startup with an "Invalid hook call" error because we were using the `useSelector` hook inside the cleanup function of a `useEffect`.

**Root Cause:** React enforces strict rules for hooks, including that they can only be called at the top level of React function components. We were violating this rule by trying to access Redux state using `useSelector` inside a cleanup function.

**Solution:** Implemented a safer approach to access Redux state in cleanup functions:

1. **Incorrect approach (causing errors):**
   ```typescript
   useEffect(() => {
     // This will cause a React hooks violation
     return () => {
       const callId = useSelector((state: RootState) => state.voiceAgent.callId);
       // Use callId for cleanup
     };
   }, []);
   ```

2. **Correct approach using store directly:**
   ```typescript
   useEffect(() => {
     return () => {
       // Get the state directly from the store object
       // This is safe as it doesn't use React hooks
       const currentState = store.getState();
       const currentCallId = currentState.voiceAgent.callId;
       
       // Use currentCallId for cleanup
     };
   }, []);
   ```

**Learning:** When handling cleanup in React components:
1. Never use hooks inside cleanup functions
2. Use the Redux store directly to access state in cleanup functions
3. Capture values in the effect setup that will be needed during cleanup
4. If state changes between setup and cleanup are important, include those values in the dependency array

### Message Format Transformation

**Issue:** The Ultravox API requires specific message formats for roles and media types, but our frontend was sending inconsistent formats.

**Solution:** Initially implemented robust transformation logic in both the frontend and backend, but later discovered a more elegant solution using `priorCallId`:

1. **Original approach with manual transformation:**
   ```typescript
   const formattedMessages = initialMessages.map(msg => {
     // Normalize the speaker value
     let speaker = msg.speaker === 'agent' ? 'assistant' : 'user';
     
     // Normalize the medium value
     let type = typeof msg.medium === 'string' 
       ? (msg.medium.toLowerCase() === 'voice' ? 'voice' : 'text')
       : (msg.medium === Medium.VOICE ? 'voice' : 'text');
     
     return { text: msg.text, speaker, type };
   });
   ```

2. **Improved approach using priorCallId:**
   ```typescript
   // If we have a previous call ID, use it to resume the conversation
   if (lastCallId) {
     console.log('Resuming conversation with previous call ID:', lastCallId);
     callData = await voiceAgentService.createVoiceAgentCall(undefined, lastCallId);
   }
   ```

**Learning:** Always check the API documentation thoroughly for cleaner solutions. The Ultravox API provides the `priorCallId` parameter specifically to handle conversation continuity without manually managing message history.

### Conversation State Persistence

**Issue:** We needed a way to persist conversation state between sessions without implementing a full backend database.

**Solution:** Implemented a multi-layered approach using browser storage:

1. Store the call ID in multiple places for redundancy:
   ```typescript
   // Store in memory for the current session
   window.lastCallId = newCallId;
   
   // Store in sessionStorage (persists until browser tab is closed)
   sessionStorage.setItem('lastVoiceAgentCallId', newCallId);
   
   // Store in localStorage (persists between browser sessions)
   localStorage.setItem('lastVoiceAgentCallId', newCallId);
   ```

2. Create a fallback mechanism that tries different storage methods:
   ```typescript
   // Check multiple storage locations
   const lastCallId = window.lastCallId || 
                      sessionStorage.getItem('lastVoiceAgentCallId') || 
                      localStorage.getItem('lastVoiceAgentCallId');
   ```

**Learning:** Implement redundant storage strategies for critical user experience data, with graceful fallbacks when primary storage methods fail.

### Image Loading Optimization

**Issue:** Images were being loaded inefficiently, causing unnecessary API calls and poor performance.

**Solution:** Implemented a memory caching system and standardized error handling for images:

1. Created a shared utility function:
   ```typescript
   export const getOptimizedImageUrl = (baseUrl, imageName, directory = 'imagedump') => {
     // Cache management logic
     return `${baseUrl}/public/${directory}/${imageName}`;
   };
   ```

2. Added consistent error handling:
   ```typescript
   export const handleImageError = (event, itemName, logDetails = false) => {
     // Standardized error handling
   };
   ```

**Learning:** Standardize resource handling functions across the application to ensure consistent behavior and easier maintenance.

### Browser API Compatibility

**Issue:** Audio context and microphone handling varies across browsers, causing inconsistent behavior.

**Solution:** Implemented graceful fallbacks and clear error messages:

```typescript
try {
  audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  // Setup logic
} catch (error) {
  console.error('Failed to set up audio analysis:', error);
  // Show user-friendly message
}
```

**Learning:** Always provide graceful fallbacks and clear error messages for browser-specific APIs.

### API Parameter Placement: Body vs. Query String

**Issue:** Our application was failing with a 400 error because we were incorrectly placing the `priorCallId` in the request body instead of as a query parameter.

**Root Cause:** Misunderstanding of the Ultravox API documentation - the error message was clear: `Message type "ultravox.v1.StartCallRequest" has no field named "priorCallId"`.

**Solution:** Updated both frontend and backend to use `priorCallId` as a query parameter:

1. **Frontend change:**
   ```typescript
   // Correct approach - using priorCallId as query parameter
   let endpoint = `${API_BASE_URL}/api/voice-agent/calls`;
   if (priorCallId) {
     endpoint += `?priorCallId=${encodeURIComponent(priorCallId)}`;
   }
   const response = await axios.post(endpoint, payload);
   ```

2. **Backend change:**
   ```python
   # Parse query parameters
   query_params = dict(request.query_items())
   prior_call_id = query_params.get("priorCallId")
   
   # Construct the correct Ultravox API endpoint
   endpoint = f"{ULTRAVOX_BASE_URL}/api/calls"
   if prior_call_id:
     endpoint += f"?priorCallId={prior_call_id}"
   
   # Forward to Ultravox API
   response = requests.post(endpoint, headers=headers, json=payload)
   ```

**Learning:** When integrating with external APIs:
1. Carefully distinguish between query parameters and request body fields in the documentation
2. Check error responses for clues about where parameters should be placed
3. Be especially careful with parameters that modify the behavior of the endpoint rather than provide content
4. Test with small examples that match the documentation examples

## FastAPI Request Query Parameters

When working with FastAPI request objects, it's important to use the correct methods to access query parameters:

1. **Correct approach**: Use `request.query_params` to access query parameters in FastAPI. This property returns a `QueryParams` object that can be converted to a dict with `dict(request.query_params)`.

2. **Incorrect approach**: Using non-existent methods like `request.query_items()` will cause runtime errors.

When using FastAPI with an object-oriented approach, it's better to declare query parameters as function parameters with type annotations where possible:

```python
@router.post("/endpoint")
async def endpoint(request: Request, query_param: str = Query(None)):
    # This approach is better when you know the parameter names in advance
    pass
```

But when you need to access all query parameters in a dictionary format:

```python
@router.post("/endpoint")
async def endpoint(request: Request):
    # This is the correct way to get all query params as a dict
    query_params = dict(request.query_params)
    # Now you can access parameters by name
    param_value = query_params.get("paramName")
```

Always add tests for API endpoints to catch these issues early, including tests for query parameter handling.

## UX Insights

### Voice Interaction Feedback

**Issue:** Users had no visual indication that their microphone was working.

**Solution:** Implemented a real-time audio level visualization:

```typescript
const updateAudioLevel = () => {
  if (analyser.current && audioDataArray.current) {
    analyser.current.getByteFrequencyData(audioDataArray.current);
    // Calculate average volume level
    const average = audioDataArray.current.reduce((sum, value) => sum + value, 0) / 
                   audioDataArray.current.length;
    // Scale to 0-100 for easier use
    const scaledLevel = Math.min(100, Math.max(0, average * 2));
    setAudioLevel(scaledLevel);
  }
  // Continue monitoring
  animationFrameId.current = requestAnimationFrame(updateAudioLevel);
};
```

**Learning:** Always provide clear visual feedback for voice interactions to help users understand the system's state.

### Error Recovery

**Issue:** Users were confused when microphone permissions were denied.

**Solution:** Implemented clear error messages and recovery options:

```tsx
{error?.includes('microphone') || error?.includes('Microphone') ? (
  <Button 
    variant="contained" 
    color="primary" 
    onClick={requestMicrophoneAccess}
    sx={{ mt: 2 }}
  >
    Grant Microphone Access
  </Button>
) : (
  <Button 
    variant="contained" 
    color="primary" 
    onClick={initializeAgent}
    sx={{ mt: 2 }}
  >
    Retry
  </Button>
)}
```

**Learning:** Provide contextual error recovery options rather than generic error messages.

### Conversation Continuity

**Issue:** Users expect to resume their conversations even if they refresh the page or come back later.

**Solution:** Implemented a multi-layered persistence strategy:

1. For immediate page refreshes:
   - Store call ID and transcripts in window memory

2. For returning to the site in the same browser session:
   - Store call ID in sessionStorage

3. For returning after closing the browser:
   - Store call ID and transcripts in localStorage

4. Visual confirmation:
   ```typescript
   // Add a message to show the user we've resumed their conversation
   dispatch(addTranscript({
     text: "Resuming your previous conversation...",
     isFinal: true,
     speaker: "agent",
     medium: Medium.TEXT
   }));
   ```

**Learning:** Design your application to maintain state across various user interactions, with appropriate feedback when state is restored.

## Performance Insights

### API Request Optimization

**Issue:** Repeated API calls for the same resources were impacting performance.

**Solution:** Implemented memory caching and proper HTTP caching headers:

```python
# In backend/main.py
class CachingStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        
        # Add caching headers for image files
        if path.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            # Cache images for 24 hours
            response.headers['Cache-Control'] = 'public, max-age=86400'
            response.headers['Pragma'] = 'cache'
        
        return response
```

**Learning:** Implement caching at multiple levels (memory, HTTP) for optimal performance.

## React Dialog Component Cleanup

When implementing dialog components in React, especially those that manage resources like audio streams or API connections, it's crucial to ensure proper cleanup occurs in all possible closing scenarios:

1. **Closing via explicit buttons**: When users close a dialog using provided buttons, the cleanup logic must run without fail.

2. **Closing via dialog "X" button**: Material-UI dialog components have a built-in close button that must be configured to properly trigger cleanup functions.

3. **Component unmounting**: Always implement a cleanup function in the `useEffect` with an empty dependency array to ensure resources are freed when the component is unmounted unexpectedly.

4. **Escape key and backdrop clicks**: Consider whether you want to allow or prevent closing via these methods, and ensure they trigger proper cleanup if allowed.

5. **Browser/window closing**: For critical cleanup that must happen even when the browser window closes, consider using the `beforeunload` event.

The lesson learned is to always implement robust cleanup in multiple places to provide redundancy for resource management. For our voice agent component specifically, we needed to ensure call termination happens in all possible closing scenarios to prevent orphaned API calls continuing to run in the background.

## Next Steps and Future Work

1. **Implement Offline Support:**
   - Add service workers for asset caching
   - Create a local storage system for order history

2. **User Account Integration:**
   - Move conversation persistence from localStorage to user accounts
   - Implement proper backend storage for conversation history

3. **Performance Monitoring:**
   - Add user interaction metrics
   - Monitor API response times
   - Track resource loading performance

4. **Accessibility Improvements:**
   - Enhance keyboard navigation
   - Add more descriptive aria attributes
   - Ensure color contrast compliance

## Ultravox Call Termination

**Issue:** Attempts to end Ultravox calls using various HTTP methods were failing.

**Root Cause:** The Ultravox API requires a simpler approach - using the SDK's direct `leaveCall()` method.

**Solution:**

The most reliable way to end a call with Ultravox is to use the JavaScript SDK's built-in method:

```typescript
// Using the SDK directly
export const endCall = async (callId: string) => {
  try {
    if (uvSession) {
      await uvSession.leaveCall();
      // Clear the session reference
      uvSession = null;
      // Notify the application
      window.dispatchEvent(new CustomEvent('callEnded'));
      return { status: "success" };
    }
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
};
```

No need for:
- Custom hangUp tool registration
- HTTP DELETE requests
- POST requests to custom tool endpoints

**Learning:** When working with voice AI services like Ultravox, prioritize using the official SDK methods over creating custom API endpoints. The SDK provides the most reliable way to manage call lifecycle, especially for terminating calls. Trying to implement call termination through custom HTTP methods can lead to inconsistent behavior and errors.

## Robust Call Termination Strategies

When working with voice API calls like the Ultravox SDK, it's critical to implement multiple termination approaches to ensure calls are properly ended in all scenarios.

### Multi-layer call termination approach:

1. **Direct session access**: Using the session object directly for immediate termination rather than through service abstractions
   ```typescript
   if (session) {
     await session.leaveCall();
   }
   ```

2. **Timeout protection**: Adding timeouts to prevent hanging on termination calls
   ```typescript
   const leavePromise = session.leaveCall();
   const timeoutPromise = new Promise((_, reject) => {
     setTimeout(() => reject(new Error('Timeout')), 2000);
   });
   await Promise.race([leavePromise, timeoutPromise]);
   ```

3. **Low-level connection cleanup**: Directly closing any WebRTC connections that might be keeping calls alive
   ```typescript
   if (session.peerConnection) {
     session.peerConnection.close();
   }
   ```

4. **Reference nullification**: Explicitly setting session references to null to enable garbage collection
   ```typescript
   uvSession = null;
   ```

5. **Explicit audio resource cleanup**: Stopping all audio tracks immediately
   ```typescript
   if (window.temporaryAudioStream) {
     window.temporaryAudioStream.getTracks().forEach(track => track.stop());
   }
   ```

6. **Event dispatching**: Notifying all parts of the application that the call has ended
   ```typescript
   window.dispatchEvent(new CustomEvent('callEnded', { detail: { callId } }));
   ```

7. **State reset**: Resetting Redux state even if other termination strategies fail
   ```typescript
   dispatch(setStatus(VoiceAgentStatus.IDLE));
   dispatch(setActive(false));
   ```

8. **Last resort methods**: Trying any available cleanup methods on the session object
   ```typescript
   if (typeof session.destroy === 'function') {
     session.destroy();
   }
   ```

9. **Heavy log monitoring**: Adding distinctive logs to track the termination process
   ```typescript
   console.log('🔊🔊 EXIT CALL: Starting termination process');
   ```

This multi-layered approach ensures that even if one termination method fails, other methods can still succeed in properly cleaning up the call resources.

# Real Estate Voice Agent - Lessons Learned

## UI Conversion Strategy 

When converting a domain-specific application (like a restaurant ordering system) to a different domain (real estate):

1. **Incremental Approach Works Best**: Converting UI components one by one while maintaining the core functionality helped maintain stability.
2. **Keep Core Infrastructure**: We leveraged the existing voice agent technology while changing only the presentation layer.
3. **Theme Consistency**: Updating the color scheme and typography early provides a consistent foundation for the new domain.
4. **Component Architecture**: Well-structured React components with clear interfaces made the conversion process smoother.

## UI Development Insights

1. **Layout Structure**: Starting with the main page layout (HeroSection, SearchFilters, PropertyList) established the foundation for the real estate interface.
2. **Responsive Design Maintenance**: Ensuring all new components followed responsive design principles maintained cross-device compatibility.
3. **Component Props**: Well-defined interfaces for component props (like Filters and VoiceFilterCriteria) provided clarity during development.
4. **Shared State Management**: Using React state combined with props for filter handling created a clean data flow.

## Integration Challenges

1. **Voice Agent Context**: The existing voice agent was designed for restaurant ordering, so integrating it with real estate search required careful UI adaptation.
2. **State Management**: Ensuring state is properly shared between the voice agent and the new real estate components was important for functionality.
3. **Content Adaptation**: The transition from food ordering to property search required thoughtful content changes in UI elements.

## Best Practices Identified

1. **Clear Component Boundaries**: Defining clear responsibilities for each component (HeroSection for main search, SearchFilters for filtering, PropertyList for results).
2. **Mock Data Structure**: Creating a well-structured property data model early helped shape the UI development.
3. **Consistent Styling**: Following Material-UI patterns consistently across components created a cohesive look and feel.
4. **Gradual Voice Integration**: Focusing on UI first, then voice integration helped manage complexity.

## Future Improvements

1. **Voice Agent Responses**: The voice agent still needs response adaptation for real estate terminology and searches.
2. **Data Integration**: Connecting to a real property database would make the application fully functional.
3. **Advanced Features**: Property details, map integration, and saved properties would enhance the user experience.
4. **Voice Command Set**: Expanding the voice command vocabulary for property-specific searches would improve usability.

## Technical Decisions

1. **Material-UI**: Continuing to use MUI provided a robust component library for building the real estate UI.
2. **Functional Components**: Using React functional components with hooks maintained code consistency.
3. **Modular CSS**: Component-specific styles helped maintain styling isolation.
4. **Interface Definitions**: TypeScript interfaces for data structures ensured type safety throughout the application.

These insights will guide future development of the Real Estate Voice Agent and provide valuable guidance for similar domain conversion projects. 

# Memory / Learnings

- When deprecating a tool or feature (e.g., property search tool, DeepInfra RAG), ensure all references are removed from frontend, backend, environment variables, and documentation.
- Always update architecture, changelog, feature-design, and current-state docs to reflect major changes.
- Make minimal changes to avoid breaking unrelated functionality.
- Clearly document new endpoints, environment variables, and architectural changes.

## Deployment Issues and Solutions

### Issue: Ultravox API Calls in Frontend-Only Mode Not Working in Production (Date: 2023-09-08)

**Problem:**
When deploying the application to Vercel in frontend-only mode, direct calls to the Ultravox API failed with 404 errors. The application was attempting to call:
`https://real-estate-voice-ai-qmdber0hl-rswain1486s-projects.vercel.app/ultravox-api/api/agents/{agent-id}/calls`

**Root Cause:**
The code was attempting to use the development proxy configuration (`/ultravox-api`) in the production environment. The Vite proxy only works in the development environment and isn't available in the production build on Vercel.

**Solution:**
1. Updated `createAgentCallDirect` and other related functions to detect the environment (development vs. production)
2. In development, continued to use the `/ultravox-api` proxy path
3. In production, used the direct Ultravox API URL (`https://api.ultravox.ai`)
4. Added proper error handling and logging
5. Made sure the API key header was included in all direct API calls in production

**Code Changes:**
```javascript
// Determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Choose the appropriate base URL
let baseUrl = isDevelopment 
  ? '/ultravox-api' // Use proxy in development
  : 'https://api.ultravox.ai'; // Use direct URL in production

// Use the appropriate URL
const url = `${baseUrl}/api/agents/${ULTRAVOX_AGENT_ID}/calls`;
```

**Lessons Learned:**
1. Always test deployment configurations in a production-like environment before actual deployment
2. Development proxies set up in Vite/Webpack don't carry over to production builds
3. API keys and authentication need to be handled differently in production vs development
4. Consider environment-specific configuration for API endpoints

# Real Estate Voice Agent - Lessons Learned

## UI Conversion Strategy 

When converting a domain-specific application (like a restaurant ordering system) to a different domain (real estate):

1. **Incremental Approach Works Best**: Converting UI components one by one while maintaining the core functionality helped maintain stability.
2. **Keep Core Infrastructure**: We leveraged the existing voice agent technology while changing only the presentation layer.
3. **Theme Consistency**: Updating the color scheme and typography early provides a consistent foundation for the new domain.
4. **Component Architecture**: Well-structured React components with clear interfaces made the conversion process smoother.

## UI Development Insights

1. **Layout Structure**: Starting with the main page layout (HeroSection, SearchFilters, PropertyList) established the foundation for the real estate interface.
2. **Responsive Design Maintenance**: Ensuring all new components followed responsive design principles maintained cross-device compatibility.
3. **Component Props**: Well-defined interfaces for component props (like Filters and VoiceFilterCriteria) provided clarity during development.
4. **Shared State Management**: Using React state combined with props for filter handling created a clean data flow.

## Integration Challenges

1. **Voice Agent Context**: The existing voice agent was designed for restaurant ordering, so integrating it with real estate search required careful UI adaptation.
2. **State Management**: Ensuring state is properly shared between the voice agent and the new real estate components was important for functionality.
3. **Content Adaptation**: The transition from food ordering to property search required thoughtful content changes in UI elements.

## Best Practices Identified

1. **Clear Component Boundaries**: Defining clear responsibilities for each component (HeroSection for main search, SearchFilters for filtering, PropertyList for results).
2. **Mock Data Structure**: Creating a well-structured property data model early helped shape the UI development.
3. **Consistent Styling**: Following Material-UI patterns consistently across components created a cohesive look and feel.
4. **Gradual Voice Integration**: Focusing on UI first, then voice integration helped manage complexity.

## Future Improvements

1. **Voice Agent Responses**: The voice agent still needs response adaptation for real estate terminology and searches.
2. **Data Integration**: Connecting to a real property database would make the application fully functional.
3. **Advanced Features**: Property details, map integration, and saved properties would enhance the user experience.
4. **Voice Command Set**: Expanding the voice command vocabulary for property-specific searches would improve usability.

## Technical Decisions

1. **Material-UI**: Continuing to use MUI provided a robust component library for building the real estate UI.
2. **Functional Components**: Using React functional components with hooks maintained code consistency.
3. **Modular CSS**: Component-specific styles helped maintain styling isolation.
4. **Interface Definitions**: TypeScript interfaces for data structures ensured type safety throughout the application.

These insights will guide future development of the Real Estate Voice Agent and provide valuable guidance for similar domain conversion projects. 

# Memory / Learnings

- When deprecating a tool or feature (e.g., property search tool, DeepInfra RAG), ensure all references are removed from frontend, backend, environment variables, and documentation.
- Always update architecture, changelog, feature-design, and current-state docs to reflect major changes.
- Make minimal changes to avoid breaking unrelated functionality.
- Clearly document new endpoints, environment variables, and architectural changes. 