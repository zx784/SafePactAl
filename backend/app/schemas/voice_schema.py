from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel


class VoiceState(str, Enum):
    IDLE = "idle"
    LISTENING = "listening"
    THINKING = "thinking"
    SPEAKING = "speaking"
    TOOL_RUNNING = "tool_running"
    DRAFT_READY = "draft_ready"
    CALL_ENDED = "call_ended"
    ERROR = "error"


# ── Client → Server ──────────────────────────────────────────────────────────

class TranscriptMessage(BaseModel):
    type: Literal["transcript"] = "transcript"
    text: str


class TextInputMessage(BaseModel):
    type: Literal["text_input"] = "text_input"
    text: str


# ── Server → Client ──────────────────────────────────────────────────────────

class SentenceMessage(BaseModel):
    type: Literal["sentence"] = "sentence"
    text: str


class StatusMessage(BaseModel):
    type: Literal["status"] = "status"
    state: VoiceState
    label: Optional[str] = None


class ToolResultMessage(BaseModel):
    type: Literal["tool_result"] = "tool_result"
    tool: str
    result: Dict[str, Any]


class DraftReadyMessage(BaseModel):
    type: Literal["draft_ready"] = "draft_ready"
    draft: str
    clause_ids: List[str]


class DebugMessage(BaseModel):
    type: Literal["debug"] = "debug"
    log: str


class ErrorMessage(BaseModel):
    type: Literal["error"] = "error"
    message: str
