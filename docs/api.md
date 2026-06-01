# ProtectMe AI — API Reference

Base URL (local): `http://localhost:8000`

---

## Health check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "app": "ProtectMe AI",
  "version": "0.1.0",
  "gemini_configured": true,
  "missing_env_vars": null,
  "active_sessions": 0
}
```

---

## Contracts

### Analyze a contract

```
POST /api/contracts/analyze
Content-Type: multipart/form-data
```

Fields (provide one):
- `file` — PDF file upload
- `text` — plain text string

Response `200`:
```json
{
  "session_id": "abc123",
  "risk_report": {
    "contract_type": "Rental Agreement",
    "overall_risk": "High",
    "final_recommendation": "Do Not Sign Yet",
    "summary": "...",
    "confidence": 0.87,
    "risks": [
      {
        "id": "risk_001",
        "title": "...",
        "severity": "High",
        "category": "Cancellation",
        "clause_text": "...",
        "simple_explanation": "...",
        "why_it_matters": "...",
        "question_to_ask": "...",
        "suggested_action": "Clarify"
      }
    ],
    "missing_information": [],
    "recommended_questions": []
  }
}
```

Error `400` — no input provided.
Error `503` — Gemini not configured.

---

## Actions

### Generate a message

```
POST /api/actions/generate-message
Content-Type: application/json
```

Body:
```json
{
  "session_id": "abc123",
  "clause_ids": ["risk_001", "risk_002"],
  "message_type": "clarification",
  "tone": "professional",
  "format": "email"
}
```

`message_type` values: `clarification | negotiation | rejection | amendment_request`
`tone` values: `polite | firm | professional`
`format` values: `email | whatsapp`

Response `200`:
```json
{
  "draft": "Subject: Clarification on cancellation clause\n\nDear...",
  "session_id": "abc123",
  "clause_ids": ["risk_001"],
  "message_type": "clarification",
  "tone": "professional",
  "format": "email"
}
```

---

## Session

### Set active clause

```
POST /api/session/active-clause
```

Body:
```json
{ "session_id": "abc123", "active_clause_id": "risk_002" }
```

Response:
```json
{ "status": "ok", "session_id": "abc123", "active_clause_id": "risk_002" }
```

### Get session

```
GET /api/session/{session_id}
```

Returns full session object.

---

## Voice (WebSocket)

```
WS /ws/voice/{session_id}
```

### Client → Server messages

```json
{ "type": "transcript",  "text": "What does the cancellation clause mean?" }
{ "type": "text_input",  "text": "Generate an email about risk_001" }
```

### Server → Client messages

```json
{ "type": "sentence",    "text": "The cancellation clause means..." }
{ "type": "status",      "state": "thinking", "label": "Thinking..." }
{ "type": "tool_result", "tool": "generate_message", "result": {...} }
{ "type": "draft_ready", "draft": "Dear...", "clause_ids": ["risk_001"] }
{ "type": "debug",       "log": "[Agent] Intent detected: explain_clause" }
{ "type": "error",       "message": "Session not found." }
```

### Voice states

`idle | listening | thinking | speaking | tool_running | draft_ready | call_ended | error`
