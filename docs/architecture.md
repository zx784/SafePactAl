# ProtectMe AI — Architecture

## System overview

```
Browser (Next.js)
      │
      │  HTTP REST + WebSocket
      ▼
FastAPI Backend (Python)
  ├── Route layer        — no business logic
  ├── Handler layer      — request/response shaping
  ├── Service layer      — business logic, session management
  ├── Repository layer   — in-memory session store (MVP)
  │
  └── imports ──────────────────────────────────────────────────────
                                                                     │
Agent Package (protectme_agent/)                                     │
  ├── Orchestrator       — coordinates agent workflows               │
  ├── GeminiClient       — wraps google-genai SDK                    │
  ├── ContractAnalysisAgent → structured risk_report JSON            │
  ├── ConversationAgent  → intent routing, tool dispatch, streaming  │
  ├── IntentRouter       → 8 intent classes                          │
  ├── Tools              → generate_message, explain_clause,         │
  │                        generate_questions                        │
  └── SentenceBuffer     → token stream → sentence chunks ──────────┘
                                                                      │
                                              WebSocket (sentences + status)
                                                                      ▼
                                                               Browser
                                                  SpeechRecognition (input)
                                                  speechSynthesis (output)
```

## Request flow: contract analysis

```
POST /api/contracts/analyze (PDF or text)
  → contract_routes.py
  → contract_handler.py
  → contract_service.py
  → agent/orchestrator.analyze_contract(text)
    → ContractAnalysisAgent
      → GeminiClient.generate(analysis_prompt)
      → json_utils.extract_json_from_text()
      → RiskReport (Pydantic validated)
  → session_repository.create(session)
  → AnalyzeResponse {session_id, risk_report}
```

## Request flow: voice agent

```
WS /ws/voice/{session_id}
  Client sends: {type: "transcript", text: "..."}
  → voice_routes.py
  → voice_service.handle_voice_session()
  → agent/orchestrator.handle_conversation_turn()
    → IntentRouter (Gemini flash)
    → if tool needed → ToolLayer.execute()
    → ConversationAgent (Gemini flash, streaming)
    → SentenceBuffer emits sentences
  → WS sends: {type: "sentence", text: "..."}
  Client: speechSynthesis.speak(text)
```

## Session model

Sessions are stored in-memory (dict + threading lock). TTL: 60 minutes idle.
Cleanup runs every 5 minutes via FastAPI lifespan background task.

For production scale: replace `SessionRepository` with Redis-backed implementation
without changing the service layer (same interface).

## Key design rules

1. Routes contain zero business logic.
2. Agent package is completely independent — backend imports it, not vice versa.
3. All Gemini model names come from environment variables — never hardcoded.
4. Frontend only calls FastAPI — never calls Gemini directly.
5. API key is never in committed files.
