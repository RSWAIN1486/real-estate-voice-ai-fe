# Architecture

## Current Architecture (Ultravox Agent API)

```mermaid
graph TD
    A[User (Frontend)] -- voice/text --> B[VoiceAgentService (Frontend)]
    B -- API call --> C[/agent-calls (Backend)]
    C -- POST /api/agents/{agent_id}/calls --> D[Ultravox Agent API]
    D -- response --> C
    C -- response --> B
    B -- display/voice --> A
```

- All property search and Q&A is handled by the Ultravox Agent's pretrained knowledge.
- No property search tool or RAG is used.
- The backend simply proxies calls to the Ultravox Agent API using the agent ID from the environment.

## Deprecated/Removed
- DeepInfra RAG-based property search
- Property search tool (frontend/backend) 