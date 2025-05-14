# API Routing: Technical Explanation

This document outlines the technical flow of communication for the voice agent feature, from the frontend to the backend, and then to the Ultravox API.

**Explanation of the Routing Flow:**

Think of the system as having three main parts:

1.  **Your Browser (Frontend - `voiceAgentService.ts`):** This is what you see and interact with in the web application. When you want to interact with the voice agent, this part of the system kicks things off.
2.  **Our Application Server (Backend - `voice_agent.py` running via `main.py`):** This is a middleman that sits between your browser and the actual AI voice service (Ultravox). It handles requests from your browser securely and communicates with Ultravox.
3.  **Ultravox AI Service (The actual AI):** This is the powerful AI service that understands voice, talks back, and has the agent's configured intelligence.

**Here's how the communication flows for key actions:**

**1. Starting a New Call (Initiating the Voice Agent Session):**

*   **Frontend (`voiceAgentService.ts` -> `createVoiceAgentCall` function):**
    *   When you start the voice agent, this function in the frontend is called.
    *   It prepares a payload, which may include `initialMessages` if a previous conversation's transcripts were saved.
    *   It then sends this payload as an HTTP `POST` request to our backend server. The specific endpoint is `/api/voice-agent/agent-calls` (e.g., `http://localhost:8000/api/voice-agent/agent-calls`).

*   **Backend (`main.py` then `voice_agent.py` -> `create_agent_call` function):**
    *   Our backend server (managed by `main.py` using FastAPI) receives this `POST` request.
    *   FastAPI routes the request based on the endpoint (`/api/voice-agent/agent-calls`) to the `create_agent_call` function within the `backend/routes/voice_agent.py` module.
    *   The `create_agent_call` function in the backend is responsible for communicating with the Ultravox API.
    *   It retrieves the `ULTRAVOX_API_KEY` and the `ULTRAVOX_AGENT_ID` from environment variables stored securely on the server.
    *   It then constructs and sends its own HTTP `POST` request to the Ultravox AI service. The URL for this request is `https://api.ultravox.ai/api/agents/YOUR_AGENT_ID/calls`, where `YOUR_AGENT_ID` is replaced with the actual agent ID. The request includes the payload received from the frontend and the `X-API-Key` header for authentication.
    *   Ultravox processes this request, creates a new call session for the specified agent, and returns a JSON response. This response contains essential details like a unique `callId` for the session and a `joinUrl`.

*   **Frontend (`voiceAgentService.ts` receives the response):**
    *   The backend's `create_agent_call` function forwards the JSON response (containing `callId` and `joinUrl`) from Ultravox back to the `createVoiceAgentCall` function in the frontend.
    *   The frontend then uses this `joinUrl` with the Ultravox client-side SDK (e.g., `uvSession.joinCall(joinUrl)`) to establish the actual WebRTC connection for the voice call.

**2. Getting Information About an Existing Call (`getCallInfo`):**

*   **Frontend (`voiceAgentService.ts` -> `getCallInfo` function):**
    *   If the frontend needs to retrieve details about an ongoing call, it invokes this function, passing the `callId` of the target session.
    *   It sends an HTTP `GET` request to our backend server at the endpoint `/api/voice-agent/calls/THE_CALL_ID` (e.g., `http://localhost:8000/api/voice-agent/calls/some-call-id`).

*   **Backend (`main.py` then `voice_agent.py` -> `get_call_info` function):**
    *   The backend server (FastAPI in `main.py`) receives this `GET` request.
    *   It routes the request to the `get_call_info` function in `backend/routes/voice_agent.py`.
    *   This backend function then makes an HTTP `GET` request to the Ultravox AI service at `https://api.ultravox.ai/api/calls/THE_CALL_ID`, including the `X-API-Key` header.
    *   Ultravox returns the current details for that specific call session.

*   **Frontend (`voiceAgentService.ts` receives the response):**
    *   The backend forwards the call information received from Ultravox back to the `getCallInfo` function in the frontend, which can then use this data as needed.

**Why this layered approach (Frontend -> Backend -> Ultravox)?**

*   **Security:** The primary reason for the backend proxy is to protect the `ULTRAVOX_API_KEY`. This key should never be exposed in client-side code (the frontend). By having the backend make the authenticated requests to Ultravox, the API key remains secure on the server.
*   **Control & Abstraction:** The backend acts as a controlled gateway. It can:
    *   Implement additional logic, validation, or data transformation before relaying requests to Ultravox or responses to the frontend.
    *   Abstract away the direct complexities of the Ultravox API from the frontend.
    *   Potentially consolidate calls to multiple services if needed in the future.
*   **Configuration Management:** Centralizes the management of sensitive or environment-specific configurations like `ULTRAVOX_AGENT_ID` and API base URLs on the server-side. 