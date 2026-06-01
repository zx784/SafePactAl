"""Tool call input/output types for the agent tool layer."""
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel


class ToolName(str, Enum):
    GENERATE_MESSAGE = "generate_message"
    EXPLAIN_CLAUSE = "explain_clause"
    GENERATE_QUESTIONS = "generate_questions"


class ToolCall(BaseModel):
    name: ToolName
    inputs: Dict[str, Any]


class ToolResult(BaseModel):
    name: ToolName
    success: bool
    output: Any
    error: Optional[str] = None
