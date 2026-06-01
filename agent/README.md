# ProtectMe AI — Agent Package

Custom lightweight agent orchestrator using the Gemini API,
**designed to be ADK-compatible for future migration.**

## Structure

```
protectme_agent/
├── orchestrator.py         ← Top-level coordinator (Phase 2+)
├── gemini_client.py        ← Wraps google-genai SDK (Phase 2+)
├── prompts/                ← System prompts for each workflow
│   ├── contract_analysis_prompt.py
│   ├── message_generation_prompt.py
│   ├── voice_agent_prompt.py
│   └── intent_router_prompt.py
├── tools/                  ← Callable tools dispatched by ConversationAgent
│   ├── generate_message_tool.py
│   ├── explain_clause_tool.py
│   └── generate_questions_tool.py
├── schemas/                ← Pydantic models shared by agent internals
│   ├── risk_report_schema.py
│   ├── tool_schema.py
│   └── intent_schema.py
├── streaming/              ← Sentence buffer + Gemini Live stub
│   ├── sentence_buffer.py
│   └── live_client.py
└── safety/
    └── legal_disclaimer.py ← Disclaimer constants + injection helpers
```

## Phase roadmap

| Phase | What gets implemented |
|---|---|
| 2 | `GeminiClient.generate()` + `ContractAnalysisAgent` (full risk report) |
| 3 | `GenerateMessageTool`, `ExplainClauseTool`, `GenerateQuestionsTool`, `IntentRouter` |
| 4 | `ConversationAgent` + WebSocket streaming loop |
| 5 | `SentenceBuffer` edge cases + Gemini Live investigation |

## Agent design principle

> "Custom lightweight agent orchestrator using the Gemini API,
> designed to be ADK-compatible for future migration."

The `Orchestrator` class is structured so that replacing its internal dispatch
with ADK `Agent.run()` requires only swapping the tool and streaming interface —
the prompt, session, and schema layers remain unchanged.
