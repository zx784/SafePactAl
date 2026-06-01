# ProtectMe AI — Agent Workflow

## Agent architecture

> "Custom lightweight agent orchestrator using the Gemini API,
> designed to be ADK-compatible for future migration."

Two agent workflows, one orchestrator:

### 1. Contract Analysis Workflow (Phase 2)

```
Input:  contract text (cleaned, truncated to 500K chars)
        ↓
ContractAnalysisPrompt (system + few-shot schema)
        ↓
GeminiClient.generate(model=analysis_model)  ← Pro-level, JSON mode
        ↓
json_utils.extract_json_from_text()
  → success → validate with RiskReport Pydantic schema
  → fail → retry once with JSON repair prompt
        ↓
Output: RiskReport dict (stored in session)
```

### 2. Conversation / Voice Agent Workflow (Phase 4)

```
Input:  user transcript + session_context (risk_report, active_clause_id, history)
        ↓
IntentRouter (GeminiClient, conversation_model)
  → returns IntentResult {intent, confidence, target_clause_ids, …}
  → confidence < 0.6 → intent = "unclear" → ask clarification question
        ↓
  ┌─────────────────────────────────────────────────────────┐
  │  Intent dispatch                                        │
  │  generate_message  → GenerateMessageTool.execute()      │
  │  explain_clause    → ExplainClauseTool.execute()        │
  │  generate_questions→ GenerateQuestionsTool.execute()    │
  │  ask_question      → ConversationAgent direct answer    │
  │  summarize_risks   → ConversationAgent direct answer    │
  │  ask_recommendation→ ConversationAgent direct answer    │
  │  unclear           → clarification question returned    │
  └─────────────────────────────────────────────────────────┘
        ↓
Gemini streaming (conversation_model)
        ↓
SentenceBuffer emits complete sentences on [. ? ! ، ؟]
        ↓
WebSocket sends {type: "sentence", text: "..."} per sentence
        ↓
Frontend: speechSynthesis.speak(sentence)  ← immediate, no wait
```

## Intent classes

| Intent | Example triggers |
|---|---|
| `ask_question` | "What is the notice period?" |
| `explain_clause` | "What does this mean?" "Explain the termination clause" |
| `generate_message` | "Write me an email", "Draft something I can send", "Tell them I reject this" |
| `summarize_risks` | "Give me an overview", "What are the main risks?" |
| `ask_recommendation` | "What should I do?", "Is this safe to sign?" |
| `modify_message` | "Make it shorter", "More formal please" |
| `generate_questions` | "What should I ask them?", "What questions should I raise?" |
| `unclear` | "Write something for them" (ambiguous) |

## Tool layer

Each tool is a standalone class with an `execute()` async method.
Tools receive a `gemini_client` argument so they can call Gemini independently.
Tools return plain Python values (str or list) — no framework coupling.

## Safety rules enforced at agent level

- DISCLAIMER_SHORT injected into every voice session start.
- DISCLAIMER_HIGH_RISK appended when `overall_risk == "High"`.
- All prompts explicitly forbid claiming legal authority.
- `inject_into_prompt()` helper ensures consistent placement.
