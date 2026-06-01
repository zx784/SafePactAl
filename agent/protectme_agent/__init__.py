"""
ProtectMe AI — Agent Package

Custom lightweight agent orchestrator using the Gemini API,
designed to be ADK-compatible for future migration.

Modules:
  orchestrator    — top-level coordinator
  gemini_client   — wraps google-genai SDK
  prompts/        — system prompts for each agent workflow
  tools/          — callable tools (generate_message, explain_clause, generate_questions)
  schemas/        — Pydantic models shared by agent internals
  streaming/      — sentence buffer + optional Gemini Live stub
  safety/         — disclaimer injection
"""
