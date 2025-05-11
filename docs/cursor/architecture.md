# Architecture

## Current Architecture (Ultravox Agent API)

### Frontend-Only Mode with Vite Proxy

```mermaid
graph TD
    A[User (Frontend)] -- voice/text --> B[VoiceAgentService (Frontend)]
    B -- API call --> C[Vite Proxy]
    C -- POST /api/agents/{agent_id}/calls --> D[Ultravox Agent API]
    D -- response --> C
    C -- response --> B
    B -- display/voice --> A
```

- The frontend calls the Ultravox Agent API through a Vite proxy to avoid CORS issues.
- This simplifies deployment for demos and presentations, as only the frontend needs to be deployed.
- The frontend is configured to always use frontend-only mode.
- All property search and Q&A is handled by the Ultravox Agent's pretrained knowledge.
- No property search tool or RAG is used.

## Deprecated/Removed
- Backend proxy mode (removed)
- DeepInfra RAG-based property search (removed)
- Property search tool (frontend/backend) (removed)
- Backend server (removed) 